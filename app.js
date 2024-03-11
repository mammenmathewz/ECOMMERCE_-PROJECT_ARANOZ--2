require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session')
const createError = require('http-errors'); // Add this line
const app = express();
const config = require('./config/config');
config.mongooseConnection();

const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(session({
    name: 'user',
    secret: 'user secret',
    saveUninitialized:true,
    resave:false,
    cookie:{
        maxAge:1000 * 60 * 24 * 10
    }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/',userRouter)
app.use('/admin',adminRouter)



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
// error handler
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // If the error is a CastError, set the status to 500
  if (err.name === 'CastError') {
    err.status = 500;
  }

  // render the error page
  let errorPage = 'error';
  let templateData = { error: err }; // Initialize template data with the error object

  if (req.originalUrl.startsWith('/admin')) {
    templateData.active = "dash"; // Add 'active' variable to the template data for all admin routes
    if (err.status === 404) {
      errorPage = 'admin/404'; // Render a different error page for 404 errors in admin routes
    } else if(err.status === 500) {
      errorPage = 'admin/500'; // Render a different error page for 500 errors in admin routes
    } else {
      errorPage = 'admin/error'; // Render a different error page for other errors in admin routes
    }
  } else if(err.status === 500) {
    errorPage = '500'; // Render a different error page for 500 errors
  }
  res.status(err.status || 500);
  res.render(errorPage, templateData); // Pass the template data to your EJS template
});



module.exports = app;