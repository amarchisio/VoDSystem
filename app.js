var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
/*

//adds firebase module
var firebase = require("firebase");
// Initialize Firebase
var config = {
  apiKey: "AIzaSyD-4GKCin3OQpqLdZwEDVlvosi0wd5bhF8",
  authDomain: "vodsystem-43ff0.firebaseapp.com",
  databaseURL: "https://vodsystem-43ff0.firebaseio.com",
  storageBucket: "vodsystem-43ff0.appspot.com",
  messagingSenderId: "514238778813"
};
firebase.initializeApp(config);
*/


var routes = require('./routes/index');
//coverPage
var app = express();
var session = require('express-session');
var flash = require('express-flash');

// load additional environment variables to access database
// require('dotenv').config();

var env = require('dotenv');
env.config();
// Authentication
var pg = require('pg');
// var pg = require('pg') // this is for local database use only
// javascript password encryption (https://www.npmjs.com/package/bcryptjs)
var bcrypt = require('bcryptjs');
//  authentication middleware
var passport = require('passport');
// authentication locally (not using passport-google, passport-twitter, passport-github...)
var LocalStrategy = require('passport-local').Strategy;


passport.use(new LocalStrategy({
    usernameField: 'inputName', // form field
    passwordField: 'inputPassword'
  },
  function(inputName, inputPassword, done) {
    pg.connect(process.env.DATABASE_URL, function(err, client, next) {
      if (err) {
        return console.error("Unable to connect to database");
      }
      console.log("Connected to database");
      client.query('SELECT * FROM vodusers WHERE username = $1', [inputName], function(err, result) {
        // Release client back to pool
        next();
        if (err) {
          console.log("Database error");
          return done(err);
        }
        if (result.rows.length > 0) {
          var matched = bcrypt.compareSync(inputPassword, result.rows[0].password);
          if (matched) {
            console.log("Successful login");
            return done(null, result.rows[0]);
          }
        }
        console.log("Bad username or password");
        return done(null, false, {message: 'Bad username or password'});
      });
    });
  })
);


// Store user information into session
passport.serializeUser(function(user, done) {
  //return done(null, user.id);
  return done(null, user);
});

// Get user information out of session
passport.deserializeUser(function(id, done) {
  return done(null, id);
});

// Use the session middleware
// configure session object to handle cookie
app.use(session({
  //proxy: true,
  secret: 'COMP335',
//  cookie: { maxAge: 60000 },
  resave:false,
  saveUninitialized: true,
//  cookie: { secure: app.get('env') === 'production' }
}));
//books
var env = require('dotenv');
env.config();
var books = require('./routes/books');
app.use('/books', books);


app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// view engine setup
// configure views by concatenating "views" to current directory
app.set('views', path.join(__dirname, 'views'));
// Configure view engin to "hbs" because there are other view engines (templates) other than hbs
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// configure application to use compatible 3rd party module
app.use(logger('dev'));
// initialize two parsers (JSON and urlencoded form data from POST request)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// initialize a parser to parse cookie data
app.use(cookieParser());

// decide which one is default home page
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes); // index.js
var vodsystem = require('./routes/vodsystem');
app.use('/vodsystem', vodsystem);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);