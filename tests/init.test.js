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

test("GET /sources with invalid token returns 403 and error message", async (t) => {
  const url = "http://localhost:3000/sources/sources";

  try {
    await got(url, { responseType: "json" });
  } catch (error) {
    const { statusCode, body } = error.response;
    t.is(statusCode, 403);
    t.is(body.message, "Authorization Error: token missing.");
  }
});

test("GET /dashboards with invalid token returns 403 and error message", async (t) => {
  const url = "http://localhost:3000/dashboards/dashboards";

  try {
    await got(url, { responseType: "json" });
  } catch (error) {
    const { statusCode, body } = error.response;
    t.is(statusCode, 403);
    t.is(body.message, "Authorization Error: token missing.");
  }
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
