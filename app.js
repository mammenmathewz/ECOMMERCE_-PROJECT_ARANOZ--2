require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const createError = require('http-errors');
const app = express();
const config = require('./config/config');
config.mongooseConnection();

const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');

// View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration (Replaces Memory Store)
app.use(
  session({
    name: 'user',
    secret: process.env.SESSION_SECRET || 'user secret',
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // Use your MongoDB connection string
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 10, // 10 days
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true,
    },
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Static file caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Routes
app.use('/', userRouter);
app.use('/admin', adminRouter);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  if (err.name === 'CastError') {
    err.status = 500;
  }

  let errorPage = 'error';
  let templateData = { error: err };

  if (req.originalUrl.startsWith('/admin')) {
    templateData.active = 'dash';
    errorPage = err.status === 404 ? 'admin/404' : 'admin/500';
  } else if (err.status === 500) {
    errorPage = '500';
  }

  res.status(err.status || 500);
  res.render(errorPage, templateData);
});

module.exports = app;
