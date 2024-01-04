var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose')



var adminSignin = require('./routes/admin/adminSignin');
var adminUserManag = require('./routes/admin/userManagement');
var adminProductManag = require('./routes/admin/productManagement');


var userSignin = require('./routes/user/userSignin');
var userShop = require('./routes/user/shop');



var app = express();

//DB CONNECTION//

mongoose.connect('mongodb://localhost:27017/Ecommerce_Aranoz');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
  console.log('Connected to database');
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));





app.use('/admin', adminSignin);
app.use('/admin/usermanagement',adminUserManag)
app.use('/admin/products',adminProductManag)

app.use('/user', userSignin);
app.use('/home', userShop);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
