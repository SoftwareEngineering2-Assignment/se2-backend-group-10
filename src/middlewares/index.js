/**
 * requires the authorization, error and validation modules
 * exports the authorization, error and validation modules
 */
const authorization = require("./authorization");
const error = require("./error");
const validation = require("./validation");

module.exports = {
  authorization,
  error,
  validation,
};
