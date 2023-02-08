// This file is used to export all the mailer utilities
const password = require("./password");
const send = require("./send");

module.exports = {
  mail: password,
  send,
};
