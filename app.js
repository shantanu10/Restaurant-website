var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var passport = require('passport');

var authenticate = require('./authenticate');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var dishRouter = require('./routes/dishRouter');
var promoRouter = require('./routes/promoRouter');
var leaderRouter = require('./routes/leaderRouter');

//MongoDB driver
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Dishes = require('./models/dishes');   //Mongoose model

// Connection URL
const url = 'mongodb://localhost:27017/conFusion';
const connect = mongoose.connect(url, {
    useMongoClient: true,
    /* other options */
  });
  connect.then((db) => {
    console.log("Connected correctly to server");
}, (err) => { console.log(err); });

//instantiating the express as 'app'
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//app.use(cookieParser());

var session = require('express-session');
var FileStore = require('session-file-store')(session);

app.use(session({
  name: 'session-id',
  secret: '12345-67890-09876-54321',
  saveUninitialized: false,
  resave: false,
  store: new FileStore()
}));

app.use(passport.initialize());
app.use(passport.session());
//Routing before authentication
app.use('/', indexRouter);
app.use('/users', usersRouter);

//authentication
function auth (req, res, next) {
  console.log(req.user);

  if (!req.user) {
    var err = new Error('Hey You are not authenticated!');
    res.setHeader('WWW-Authenticate', 'Basic');                          
    err.status = 401;
    next(err);
  }
  else {
    next();
  }
}

app.use(auth);
//serving static files
app.use(express.static(path.join(__dirname, 'public')));   

//Routing
app.use('/dishes',dishRouter);
app.use('/promotions',promoRouter);
app.use('/leaders',leaderRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));    //forward to error handler coded below
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;  //message to be displayed through error.jade
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;

