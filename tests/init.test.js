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
  t.context.prefixUrl = await listen(t.context.server);
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
  const { body, statusCode } = await t.context.got("general/statistics");
  t.is(body.sources, 1);
  t.assert(body.success);
  t.is(statusCode, 200);
});

test("GET /sources returns correct response and status code", async (t) => {
  const token = jwtSign({ id: 1 });
  const { statusCode } = await t.context.got(`sources/sources?token=${token}`);
  t.is(statusCode, 200);
});
