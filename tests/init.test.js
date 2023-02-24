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

test("GET /sources returns error", async (t) => {
  const { statusCode } = await t.context.got("sources/sources");
  t.is(statusCode, 403);
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

test("POST /test-url-request with valid parameters and URL returns expected response", async (t) => {
  const url = "https://www.google.com";
  const type = "POST";
  const headers = { "Content-Type": "application/json" };
  const body = { title: "Test Post", body: "This is a test post" };
  const params = { userId: 1 };
  const response = await t.context.got(
    `general/test-url-request?url=${url}&type=${type}&headers=${JSON.stringify(
      headers
    )}&body=${JSON.stringify(body)}&params=${JSON.stringify(params)}`,
    { responseType: "json" }
  );

  t.is(response.statusCode, 200);
  t.truthy(response.body.status);
});

test("GET /test-url-request with valid parameters and URL returns expected response", async (t) => {
  const url = "https://www.google.com";
  const type = "GET";
  const params = { postId: 1 };
  const response = await t.context.got(
    `general/test-url-request?url=${url}&type=${type}&params=${JSON.stringify(
      params
    )}`,
    { responseType: "json" }
  );

  t.is(response.statusCode, 200);
  t.truthy(response.body.status);
});

test("PUT /test-url-request with valid parameters and URL returns expected response", async (t) => {
  const url = "https://www.google.com";
  const type = "PUT";
  const headers = { "Content-Type": "application/json" };
  const body = {
    id: 1,
    title: "Test Post Updated",
    body: "This is an updated test post",
  };
  const response = await t.context.got(
    `general/test-url-request?url=${url}&type=${type}&headers=${JSON.stringify(
      headers
    )}&body=${JSON.stringify(body)}`,
    { responseType: "json" }
  );

  t.is(response.statusCode, 200);
  t.truthy(response.body.status);
});

test("DELETE /test-url-request with valid parameters and URL returns expected response", async (t) => {
  const url = "https://www.google.com";
  const type = "DELETE";
  const response = await t.context.got(
    `general/test-url-request?url=${url}&type=${type}`,
    { responseType: "json" }
  );

  t.is(response.statusCode, 200);
  t.truthy(response.body.status);
});

test("POST /sources/create-source", async (t) => {
  const token = jwtSign({ id: "638bb43acb0182b0c398149c" });
  var options = {
    json: {
      login: "test",
      name: "testname",
      passcode: "testpasscode",
      type: "testtype",
      url: "ws://<DOMAIN>:<WEB_STOMP_PORT>/w",
      vhost: "testvhost",
    },
    responseType: "json",
  };

  const response = await t.context.got.post(
    `sources/create-source?token=${token}`,
    options
  );
  t.is(response.statusCode, 200);

  const source_id = response.body.id;
  const delete_response = await t.context.got.post(
    `sources/delete-source?token=${token}`,
    {
      json: {
        id: source_id,
      },
      responseType: "json",
    }
  );
  t.is(delete_response.statusCode, 200);
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

  //let random = (Math.random() + 2).toString(36).substring(7);

  var options = {
    json: {
      name: "test",
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


  // Save dashboard

  options ={
    json:{
      id: response.body.id,
      layout: [{i:"1", x:"1", y:"1", w:"1", h: "1", minW:"2", minH:"2" }],
      items: {"1":{type:"text", name: "test", text: "test"}},
      nextId: 2,
    },
    responseType: "json",
  };

  const response_save = await t.context.got.post(`dashboards/save-dashboard?token=${token}`, options);
  t.is(response_save.statusCode,200);
  t.is(response_save.body.success, true);


  // Invalid save dashboard
  
  options ={
    json:{
      id: "invalid",
      layout: [{i:"1", x:"1", y:"1", w:"1", h: "1", minW:"2", minH:"2" }],
      items: {"1":{type:"text", name: "test", text: "test"}},
      nextId: 100,
    },
    responseType: "json",
  };
  const response_save_invalid = await t.context.got.post(`dashboards/save-dashboard?token=${token}`, options);
  t.is(response_save_invalid.statusCode,404);

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

  // Clone dashboard

  options = {
    json: {
      dashboardId: response.body.id,
      name: "clone",
    },
    responseType: "json",
  };

  const response_clone = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`, options);
  t.is(response_clone.statusCode, 200);

  // Delete the clone to continue

  options ={
    json: {
      id: response_clone.body.id,
    },
    responseType: "json",
  };

  const response_delete_clone = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, options);
  t.is(response_delete_clone.statusCode, 200);

  // Delete dashboard

  options ={
    json: {
      id: response.body.id,
    },
    responseType: "json",
  };
  
  const response_delete = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, options);
  t.is(response_delete.statusCode, 200);

  // const response = await t.context.got.post(`dashboards/check-password-needed?token=${token}`, options);
  // t.is(response.statusCode, 200);
  // t.is(response.body.success, true
});
