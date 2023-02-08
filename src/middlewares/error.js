/* eslint-disable no-console */

// imports the required functions from the ramda library
const {
  pipe,
  has,
  ifElse,
  assoc,
  identity,
  allPass,
  propEq,
} = require("ramda");

// creates a function that formats the message for production environment
const withFormatMessageForProduction = ifElse(
  allPass([propEq("status", 500), () => process.env.NODE_ENV === "production"]),
  assoc("message", "Internal server error occurred."),
  identity
);

// creates the error middleware and exports it
module.exports = (error, req, res, next) =>
  /**
   * @name error
   * @description Middleware that handles errors
   */
  pipe(
    (e) => ({ ...e, message: e.message }),
    ifElse(has("status"), identity, assoc("status", 500)),
    withFormatMessageForProduction,
    (fError) => res.status(fError.status).json(fError)
  )(error);
