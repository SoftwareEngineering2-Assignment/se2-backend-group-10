// creates a new router, sets the path to the index.html file and exports the router
const express = require("express");
const path = require("path");

const router = express.Router();

const file = path.join(__dirname, "../../index.html");
router.use(express.static(file));

router.get("/", (req, res) => res.sendFile(file));

module.exports = router;
