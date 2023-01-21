// imports the jwt module from the jsonwebtoken package
const jwt = require("jsonwebtoken");

// imports the path, ifElse, isNil, startsWith, slice, identity, pipe functions from the ramda package
const {
  path,
  ifElse,
  isNil,
  startsWith,
  slice,
  identity,
  pipe,
} = require("ramda");

//gets the value of the SERVER_SECRET environment variable and stores it in a secret variable
const secret = process.env.SERVER_SECRET;

/**
 * Below it gets the token fron the request object. It checks for the token in the query string,
 * the headers object and the authorization object.
 * If the token is found, it is stored in the token variable.
 * Checks if the token is valid.
 * If it is not valid, it calls the next() function and passes it to an object with the message property set to
 * "Authorization Error: token missing." and the status property set to 403.
 * If the token is valid, it assigns the token to the req.decoded variable.
 *
 */
module.exports = (req, res, next) => {
  /**
   * @name authorization
   * @description Middleware that checks a token's presence and validity in a request
   */
  pipe(
    (r) =>
      path(["query", "token"], r) ||
      path(["headers", "x-access-token"], r) ||
      path(["headers", "authorization"], r),
    ifElse(
      (t) => !isNil(t) && startsWith("Bearer ", t),
      (t) => slice(7, t.length, t).trimLeft(),
      identity
    ),
    ifElse(
      isNil,
      () =>
        next({
          message: "Authorization Error: token missing.",
          status: 403,
        }),
      (token) =>
        jwt.verify(token, secret, (e, d) =>
          ifElse(
            (err) => !isNil(err),
            (er) => {
              if (er.name === "TokenExpiredError") {
                next({
                  message: "TokenExpiredError",
                  status: 401,
                });
              }
              next({
                message: "Authorization Error: Failed to verify token.",
                status: 403,
              });
            },
            (_, decoded) => {
              req.decoded = decoded;
              return next();
            }
          )(e, d)
        )
    )
  )(req);
};
