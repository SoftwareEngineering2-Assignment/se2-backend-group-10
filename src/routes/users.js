const express = require("express");
const { validation, authorization } = require("../middlewares");
const {
  helpers: { jwtSign },
} = require("../utilities/authentication");

const {
  mailer: { mail, send },
} = require("../utilities");

const router = express.Router();

const User = require("../models/user");
const Reset = require("../models/reset");

/**
 * checks if the a user with the same username or email already exists and creates a new user if not
 * if a user with the same email already exists, the user gets an error message
 */
router.post(
  "/create",
  (req, res, next) => validation(req, res, next, "register"),
  async (req, res, next) => {
    const { username, password, email } = req.body;
    try {
      const user = await User.findOne({ $or: [{ username }, { email }] });
      if (user) {
        return res.json({
          status: 409,
          message:
            "Registration Error: A user with that e-mail or username already exists.",
        });
      }
      const newUser = await new User({
        username,
        password,
        email,
      }).save();
      return res.json({ success: true, id: newUser._id });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * validates the request body using the authenticate schema and finds the user by username
 * if the user is not found, the user gets an error message
 * if the user is found, the password gets compared to the password in the database
 * if the password does not match, the user gets an error message
 * if the password matches, the user gets a token and the user object
 */
router.post(
  "/authenticate",
  (req, res, next) => validation(req, res, next, "authenticate"),
  async (req, res, next) => {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({ username }).select("+password");
      if (!user) {
        return res.json({
          status: 401,
          message: "Authentication Error: User not found.",
        });
      }
      if (!user.comparePassword(password, user.password)) {
        return res.json({
          status: 401,
          message: "Authentication Error: Password does not match!",
        });
      }
      return res.json({
        user: {
          username,
          id: user._id,
          email: user.email,
        },
        token: jwtSign({ username, id: user._id, email: user.email }),
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * checks if the user's username exists and sends an e-mail with a token to the user
 * returns a success message
 */
router.post(
  "/resetpassword",
  (req, res, next) => validation(req, res, next, "request"),
  async (req, res, next) => {
    const { username } = req.body;
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return res.json({
          status: 404,
          message: "Resource Error: User not found.",
        });
      }
      const token = jwtSign({ username });
      await Reset.findOneAndRemove({ username });
      await new Reset({
        username,
        token,
      }).save();

      const email = mail(token);
      send(user.email, "Forgot Password", email);
      return res.json({
        ok: true,
        message: "Forgot password e-mail sent.",
      });
    } catch (error) {
      return next(error);
    }
  }
);

// checks for a valid reset token and a valid user and changes the user's password
router.post(
  "/changepassword",
  (req, res, next) => validation(req, res, next, "change"),
  authorization,
  async (req, res, next) => {
    const { password } = req.body;
    const { username } = req.decoded;
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return res.json({
          status: 404,
          message: "Resource Error: User not found.",
        });
      }
      const reset = await Reset.findOneAndRemove({ username });
      if (!reset) {
        return res.json({
          status: 410,
          message: " Resource Error: Reset token has expired.",
        });
      }
      user.password = password;
      await user.save();
      return res.json({
        ok: true,
        message: "Password was changed.",
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
