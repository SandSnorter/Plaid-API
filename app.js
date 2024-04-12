require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const pass = require('./Routes/linkToken');
const accessRoutes = require('./Routes/accessToken');
const { headerSchema } = require('./Helper/validation_schema');

const app = express();

mongoose.connect("mongodb://0.0.0.0:27017/sandbox").then( () => {
  console.log('Connected to MongoDB!');
} ).catch( () => {
  console.log('error');
} )

const joiHeaderValidationMiddleware = (req, res, next) => {
  const isPostmanRequest = req.headers['user-agent'] && req.headers['user-agent'].includes('Postman');
  if (isPostmanRequest) {
    const headerValidationResult = headerSchema.validate(req.headers);
    if (headerValidationResult.error) {
      return res.status(400).json({ error: 'Invalid or missing testing key in header' });
    }
  }
  next();
};


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(joiHeaderValidationMiddleware);

app.use("/", pass.router);
app.use("/exchange_token", accessRoutes);

module.exports = app;

