/* eslint-disable func-names */

/**
 * imports the mongoose package, the mongoose-beautiful-unique-validation package and
 * the expires property from the constants object in the validation object in the utilities folder
 */
const mongoose = require("mongoose");
const beautifyUnique = require("mongoose-beautiful-unique-validation");
const {
  constants: { expires },
} = require("../utilities/validation");

//Mongoose schema for a "reset-tokens" model, which defines fields such as "username", "token" and "expireAt"
const ResetSchema = new mongoose.Schema({
  username: {
    index: true,
    type: String,
    required: true,
    unique: "A token already exists for that username!",
    lowercase: true,
  },
  token: {
    type: String,
    required: true,
  },
  expireAt: {
    type: Date,
    default: Date.now,
    index: { expires },
  },
});

// Plugin for Mongoose that turns duplicate errors into regular Mongoose validation errors.

ResetSchema.plugin(beautifyUnique);

mongoose.pluralize(null);
module.exports = mongoose.model("reset-tokens", ResetSchema);
