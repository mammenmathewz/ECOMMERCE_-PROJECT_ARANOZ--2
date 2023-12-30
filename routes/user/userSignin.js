var express = require('express');
var router = express.Router();
const User = require('/Users/mamme/BROCAMP PROJECTS/ECOMMERCE_ PROJECT/models/users')
var cookieParser = require('cookie-parser')
const session = require('express-session')


router.use(cookieParser())
router.use(session({
  secret: 'key that will sign cookie',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 
  }
}))

router.use(express.json())

router.use(express.urlencoded({extended: true }))

function checkAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/user/login');
  }
}


/* GET login page. */
router.get('/login', function(req, res, next) {
  if (req.session.user) {
    res.redirect('/user/account');
  } else {
    res.render('user/login');
  }
});

router.get('/account',checkAuthenticated, function(req, res, next) {
  res.render('user/account',);
});

//Signup//
router.get('/signup', function(req, res, next) {
  res.render('user/signup',);
});


router.post('/signup', async (req, res) => {
  // Check if user already exists
  // const existingUser = await User.findOne({ email: req.body.email });
  // if (existingUser) {
  //     return res.render('signup_page');
  // }
let use = req.body
console.log(use);

  // If user does not exist, proceed with signup
  const newUser = new User({
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password,
    address: {
        address1: req.body.address1,
        address2: req.body.address2,
        city: req.body.city,
        state: req.body.state,
        district: req.body.district,
        pincode: req.body.pincode
    }
});

try {
  await newUser.save();
  req.session.user = newUser; // Set the session user to the new user
  res.redirect('login');
} 
catch (err) {
  res.json({ message: err.message, type: 'danger' });
}

});

module.exports = router;