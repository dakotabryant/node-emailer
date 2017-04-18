'use strict';

const express = require('express');
const morgan = require('morgan');
// this will load our .env file if we're
// running locally. On Gomix, .env files
// are automatically loaded.
require('dotenv').config();

//Grabs the environment variables from the env file, and assigns them to each value
const {ALERT_FROM_EMAIL, ALERT_FROM_NAME, ALERT_TO_EMAIL} = process.env;

//Pulling in our send email function from emailer.js
const {sendEmail} = require('./emailer');

//pulling in logger
const {logger} = require('./utilities/logger');

// these are custom errors we've created
const {FooError, BarError, BizzError} = require('./errors');

const app = express();

// this route handler randomly throws one of `FooError`,
// `BarError`, or `BizzError`
const russianRoulette = (req, res) => {
  const errors = [FooError, BarError, BizzError];
  throw new errors[
    Math.floor(Math.random() * errors.length)]('It blew up!');
};

app.use(morgan('common', {stream: logger.stream}));


// for any GET request, we'll run our `russianRoulette` function
app.get('*', russianRoulette);

function sendEmailAlerts(err,req,res,next) {
  if (err instanceof FooError || err instanceof BarError) {
    logger.info(`I just sent an email detailing the error to ${ALERT_TO_EMAIL}`);
    const emailInfo = {
      from: ALERT_FROM_EMAIL,
      to: ALERT_TO_EMAIL,
      subject: `I found some errors. Here it is: ${err.name}`,
      text: `Here's what happened: ${err.stack}`
    };
  sendEmail(emailInfo);
  }
  next();
}
app.use(sendEmailAlerts);

app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({error: 'Something went wrong'}).end();
});

const port = process.env.PORT || 8080;

const listener = app.listen(port, function () {
  logger.info(`Your app is listening on port ${port}`);
});
