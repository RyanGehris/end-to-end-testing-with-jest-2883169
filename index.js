/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes/index.js');

const app = express();

// add other middleware
app.use(cors());
app.use(morgan('dev'));

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// parse application/json
app.use(express.json());

app.use('/', routes);

const initializeApp = function () {
  return app;
};
const theApp = initializeApp();
module.exports = theApp;
