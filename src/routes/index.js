const express = require("express");
const users = require("./users");
const sources = require("./sources");
const dashboards = require("./dashboards");
const general = require("./general");
const root = require("./root");

// creates a new router, uses the router to handle the /users, /sources, /dashboards, /general, and / paths and exports the router for use in the main app.js file
const router = express.Router();

router.use("/users", users);
router.use("/sources", sources);
router.use("/dashboards", dashboards);
router.use("/general", general);
router.use("/", root);

module.exports = router;
