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
