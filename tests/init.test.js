/* eslint-disable import/no-unresolved */
require("dotenv").config();

const http = require("node:http");
const test = require("ava").default;
const got = require("got");
const listen = require("test-listen");

const app = require("../src/index");
const { jwtSign } = require("../src/utilities/authentication/helpers");

/**
 * starts a server and listens on a random port
 * sets the 'prefixUrl' option of the 'got' object to the given URL
 * makes a request to the server
 * closes the server after all tests are done
 */
test.before(async (t) => {
  t.context.server = http.createServer(app);
  await listen(t.context.server).then((url) => (t.context.prefixUrl = url));
  t.context.got = got.extend({
    http2: true,
    throwHttpErrors: false,
    responseType: "json",
    prefixUrl: t.context.prefixUrl,
  });
});

test.after.always((t) => {
  t.context.server.close();
});

test("GET /statistics returns correct response and status code", async (t) => {
  const { body, statusCode } = await t.context.got("general/statistics", {
    responseType: "json",
  });

  t.is(statusCode, 200);
  t.true(body.success);
  t.true(Number.isInteger(body.users));
  t.true(Number.isInteger(body.dashboards));
  t.true(Number.isInteger(body.sources));
  t.true(Number.isInteger(body.views));
});

test("GET /sources returns correct response and status code", async (t) => {
  const token = jwtSign({ id: 1 });
  const { statusCode } = await t.context.got(`sources/sources?token=${token}`);
  t.is(statusCode, 200);
});


test("GET /test-url with valid URL returns expected response", async (t) => {
  const response = await t.context.got(
    "general/test-url?url=https://www.google.com",
    { responseType: "json" }
  );

  t.is(response.statusCode, 200);
  t.truthy(response.body.status);
  t.true(response.body.active);
});

test("GET /test-url with invalid URL returns expected response", async (t) => {
  const response = await t.context.got("general/test-url?url=invalidurl", {
    responseType: "json",
  });

  t.is(response.statusCode, 200);
  t.is(response.body.status, 500);
  t.false(response.body.active);
});


test("GET /dashboards returns the correct dashboard and sources", async (t) => {
  const token = jwtSign({ id: 1 });
  const response = await t.context.got(`dashboards/dashboards?token=${token}`);

  t.is(response.statusCode, 200);
  t.is(response.body.success, true);
  t.truthy(response.body.dashboards);
});


test("GET /dashboards returns 403 as there unauthorized entry try", async (t) => {
  const response = await t.context.got("dashboards/dashboards");

  t.is(response.statusCode, 403);
});

test("GET /dashboard returns 403 as there unauthorized entry try", async (t) => {
  const response = await t.context.got("dashboards/dashboard");

  t.is(response.statusCode, 403);
});

test("POST create and delete /dashboards", async (t) => {
  const token = jwtSign({ id: "638bb43acb0182b0c398149c" });

  // Before creating try get dashboard -> should return 409 (no found)

  const response_before = await t.context.got(`dashboards/dashboard?token=${token}`);
  t.is(response_before.statusCode, 200);
  t.is(response_before.body.status, 409);

  // Create dashboard

  let random = (Math.random() + 2).toString(36).substring(7);

  var options = {
    json: {
      name: random,
    },
    responseType: "json",
  };

  const response = await t.context.got.post(`dashboards/create-dashboard?token=${token}`, options);
  t.is(response.statusCode, 200);
  t.is(response.body.success, true);

  // Get dashboards

  const response_view_dashboards = await t.context.got(`dashboards/dashboards?token=${token}`);
  t.is(response_view_dashboards.statusCode, 200);
  t.is(response_view_dashboards.body.success, true);
  t.truthy(response_view_dashboards.body.dashboards);
  
  // Helper: Delete dashboard 
  // let option ={
  //   json: {
  //     id: '',
  //   },
  //   responseType: "json",
  // };
  // const resp_delete = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, option);
  // console.log(resp_delete.body);

  // Export dashboard

  const dashboard_id = response_view_dashboards.body.dashboards[0].id;
  const response_export_dashboard = await t.context.got(`dashboards/dashboard?id=${dashboard_id}`,{
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  t.is(response_export_dashboard.statusCode, 200);
  t.is(response_export_dashboard.body.success, true);
  t.truthy(response_export_dashboard.body.dashboard);

  // Delete dashboard

  options ={
    json: {
      id: response.body.id,
    },
    responseType: "json",
  };

  const response_delete = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, options);
  t.is(response_delete.statusCode, 200);


});