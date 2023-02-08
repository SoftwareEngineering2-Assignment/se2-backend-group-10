const mongoose = require("mongoose");

// creates a connection to the MongoDB database using mongoose
const mongooseOptions = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  poolSize: 100,
  keepAlive: true,
  keepAliveInitialDelay: 300000,
};
const mongodbUri = process.env.MONGODB_URI;

/**
 * exports a function, which is used in the src/index.js file
 * returns a promise from the mongoose.connect() method
 * catches any errors with the promise and logs them to the console
 */
module.exports = () => {
  // eslint-disable-next-line no-console
  mongoose.connect(mongodbUri, mongooseOptions).catch(console.error);
};
