/**
 * Uses the Yup library to create a schema for validating the data and the ramda to check if the username and password are null or undefined.
 * Creates a Yup object schema that defines the `email`, `password`, and `username` fields as required strings.
 * Also, it defines the `request`, `register`, `authenticate`, `update`, and `change` schemas.
 */
const { isNil } = require("ramda");

const yup = require("yup");
const { min } = require("./constants");

const email = yup.string().lowercase().trim().email();

const username = yup.string().trim();

const password = yup.string().trim().min(min);

const request = yup.object().shape({ username: username.required() });

const authenticate = yup.object().shape({
  username: username.required(),
  password: password.required(),
});

const register = yup.object().shape({
  email: email.required(),
  password: password.required(),
  username: username.required(),
});

const update = yup
  .object()
  .shape({
    username,
    password,
  })
  .test({
    message: "Missing parameters",
    test: ({ username: u, password: p }) => !(isNil(u) && isNil(p)),
  });

const change = yup.object().shape({ password: password.required() });

module.exports = {
  authenticate,
  register,
  request,
  change,
  update,
};
