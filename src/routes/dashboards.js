/* eslint-disable max-len */
const express = require("express");
const mongoose = require("mongoose");
const { authorization } = require("../middlewares");

const router = express.Router();

const Dashboard = require("../models/dashboard");
const Source = require("../models/source");

// creates a new route that handles GET requests to /dashboards
router.get("/dashboards", authorization, async (req, res, next) => {
  try {
    const { id } = req.decoded;
    const foundDashboards = await Dashboard.find({
      owner: mongoose.Types.ObjectId(id),
    });
    const dashboards = [];
    foundDashboards.forEach((s) => {
      dashboards.push({
        id: s._id,
        name: s.name,
        views: s.views,
      });
    });

    return res.json({
      success: true,
      dashboards,
    });
  } catch (err) {
    return next(err.body);
  }
});

//checks if a user already has a dashboard with the same name and creates a new dashboard if not
router.post("/create-dashboard", authorization, async (req, res, next) => {
  try {
    const { name } = req.body;
    const { id } = req.decoded;
    const foundDashboard = await Dashboard.findOne({
      owner: mongoose.Types.ObjectId(id),
      name,
    });
    if (foundDashboard) {
      return res.json({
        status: 409,
        message: "A dashboard with that name already exists.",
      });
    }
    const created = await new Dashboard({
      name,
      layout: [],
      items: {},
      nextId: 1,
      owner: mongoose.Types.ObjectId(id),
    }).save();

    return res.json({ success: true, id: created.id });
  } catch (err) {
    return next(err.body);
  }
});

// checks if the user has the authority to delete the dashboard and deletes it if so
router.post("/delete-dashboard", authorization, async (req, res, next) => {
  try {
    const { id } = req.body;

    const foundDashboard = await Dashboard.findOneAndRemove({
      _id: mongoose.Types.ObjectId(id),
      owner: mongoose.Types.ObjectId(req.decoded.id),
    });
    if (!foundDashboard) {
      return res.json({
        status: 409,
        message: "The selected dashboard has not been found.",
      });
    }
    return res.json({ success: true });
  } catch (err) {
    return next(err.body);
  }
});

// extracts the dashboard from the database if exists and returns it to the client with the list of data sources. Otherwise, returns an 409 status code
router.get("/dashboard", authorization, async (req, res, next) => {
  try {
    const { id } = req.query;

    const foundDashboard = await Dashboard.findOne({
      _id: mongoose.Types.ObjectId(id),
      owner: mongoose.Types.ObjectId(req.decoded.id),
    });
    if (!foundDashboard) {
      return res.json({
        status: 409,
        message: "The selected dashboard has not been found.",
      });
    }

    const dashboard = {};
    dashboard.id = foundDashboard._id;
    dashboard.name = foundDashboard.name;
    dashboard.layout = foundDashboard.layout;
    dashboard.items = foundDashboard.items;
    dashboard.nextId = foundDashboard.nextId;

    const foundSources = await Source.find({
      owner: mongoose.Types.ObjectId(req.decoded.id),
    });
    const sources = [];
    foundSources.forEach((s) => {
      sources.push(s.name);
    });

    return res.json({
      success: true,
      dashboard,
      sources,
    });
  } catch (err) {
    return next(err.body);
  }
});

// searches for the dashboard and updates it if it exists. Otherwise, returns an 409 status code.
router.post("/save-dashboard", authorization, async (req, res, next) => {
  try {
    const { id, layout, items, nextId } = req.body;

    const result = await Dashboard.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(id),
        owner: mongoose.Types.ObjectId(req.decoded.id),
      },
      {
        $set: {
          layout,
          items,
          nextId,
        },
      },
      { new: true }
    );

    if (result === null) {
      return res.json({
        status: 409,
        message: "The selected dashboard has not been found.",
      });
    }
    return res.json({ success: true });
  } catch (err) {
    return next(err.body);
  }
});

// checks if a dashboard with the same name already exists, finds the dashboard to be cloned and creates a new dashboard with the same layout, items and nextId
router.post("/clone-dashboard", authorization, async (req, res, next) => {
  try {
    const { dashboardId, name } = req.body;

    const foundDashboard = await Dashboard.findOne({
      owner: mongoose.Types.ObjectId(req.decoded.id),
      name,
    });
    if (foundDashboard) {
      return res.json({
        status: 409,
        message: "A dashboard with that name already exists.",
      });
    }

    const oldDashboard = await Dashboard.findOne({
      _id: mongoose.Types.ObjectId(dashboardId),
      owner: mongoose.Types.ObjectId(req.decoded.id),
    });

    await new Dashboard({
      name,
      layout: oldDashboard.layout,
      items: oldDashboard.items,
      nextId: oldDashboard.nextId,
      owner: mongoose.Types.ObjectId(req.decoded.id),
    }).save();

    return res.json({ success: true });
  } catch (err) {
    return next(err.body);
  }
});

// returns the dashboard with the specified id if it exists and the user has the authority to view it. Otherwise, returns an 409 status code.
router.post("/check-password-needed", async (req, res, next) => {
  try {
    const { user, dashboardId } = req.body;
    const userId = user.id;

    const foundDashboard = await Dashboard.findOne({
      _id: mongoose.Types.ObjectId(dashboardId),
    }).select("+password");
    if (!foundDashboard) {
      return res.json({
        status: 409,
        message: "The specified dashboard has not been found.",
      });
    }

    const dashboard = {};
    dashboard.name = foundDashboard.name;
    dashboard.layout = foundDashboard.layout;
    dashboard.items = foundDashboard.items;

    if (userId && foundDashboard.owner.equals(userId)) {
      foundDashboard.views += 1;
      await foundDashboard.save();

      return res.json({
        success: true,
        owner: "self",
        shared: foundDashboard.shared,
        hasPassword: foundDashboard.password !== null,
        dashboard,
      });
    }
    if (!foundDashboard.shared) {
      return res.json({
        success: true,
        owner: "",
        shared: false,
      });
    }
    if (foundDashboard.password === null) {
      foundDashboard.views += 1;
      await foundDashboard.save();

      return res.json({
        success: true,
        owner: foundDashboard.owner,
        shared: true,
        passwordNeeded: false,
        dashboard,
      });
    }
    return res.json({
      success: true,
      owner: "",
      shared: true,
      passwordNeeded: true,
    });
  } catch (err) {
    return next(err.body);
  }
});

// checks if the password is correct and if it is, the number of views is incremented and the dashboard is returned. Otherwise, returns an 409 status code.
router.post("/check-password", async (req, res, next) => {
  try {
    const { dashboardId, password } = req.body;

    const foundDashboard = await Dashboard.findOne({
      _id: mongoose.Types.ObjectId(dashboardId),
    }).select("+password");
    if (!foundDashboard) {
      return res.json({
        status: 409,
        message: "The specified dashboard has not been found.",
      });
    }
    if (!foundDashboard.comparePassword(password, foundDashboard.password)) {
      return res.json({
        success: true,
        correctPassword: false,
      });
    }

    foundDashboard.views += 1;
    await foundDashboard.save();

    const dashboard = {};
    dashboard.name = foundDashboard.name;
    dashboard.layout = foundDashboard.layout;
    dashboard.items = foundDashboard.items;

    return res.json({
      success: true,
      correctPassword: true,
      owner: foundDashboard.owner,
      dashboard,
    });
  } catch (err) {
    return next(err.body);
  }
});

/**
 * receives the dashboard id and checks if the user is authorized to perform the action
 * if so, it updates the shared property of the dashboard and returns the new value. Otherwise, returns an 409 status code
 */
router.post("/share-dashboard", authorization, async (req, res, next) => {
  try {
    const { dashboardId } = req.body;
    const { id } = req.decoded;

    const foundDashboard = await Dashboard.findOne({
      _id: mongoose.Types.ObjectId(dashboardId),
      owner: mongoose.Types.ObjectId(id),
    });
    if (!foundDashboard) {
      return res.json({
        status: 409,
        message: "The specified dashboard has not been found.",
      });
    }
    foundDashboard.shared = !foundDashboard.shared;

    await foundDashboard.save();

    return res.json({
      success: true,
      shared: foundDashboard.shared,
    });
  } catch (err) {
    return next(err.body);
  }
});

/**
 * checks if the dashboard exists and if the user is authorized to perform the action
 * if so, it updates the password property of the dashboard and returns the a succes message
 * otherwise, returns an 409 status code
 */
router.post("/change-password", authorization, async (req, res, next) => {
  try {
    const { dashboardId, password } = req.body;
    const { id } = req.decoded;

    const foundDashboard = await Dashboard.findOne({
      _id: mongoose.Types.ObjectId(dashboardId),
      owner: mongoose.Types.ObjectId(id),
    });
    if (!foundDashboard) {
      return res.json({
        status: 409,
        message: "The specified dashboard has not been found.",
      });
    }
    foundDashboard.password = password;

    await foundDashboard.save();

    return res.json({ success: true });
  } catch (err) {
    return next(err.body);
  }
});

module.exports = router;
