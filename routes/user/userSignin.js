var express = require('express');
var router = express.Router();
const User = require('/Users/mamme/BROCAMP PROJECTS/ECOMMERCE_ PROJECT/models/users')
var cookieParser = require('cookie-parser')
const session = require('express-session')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto')

const saltRounds = 10;


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

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});


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
router.get('/signup',function(req, res, next) {
 
  if (req.session.user) {
    res.redirect('/user/account');
  } else {
    res.render('user/signup',);
  }
});


router.post('/signup', async (req, res) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return res.redirect('signup');
  }
//OTP
  if (req.body.otp !== otps[req.body.email]) {
    return res.status(400).send('Invalid OTP.');
  }


  // If user does not exist, proceed with signup
  bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
    if (err) {
      console.log(err);
      return res.status(500).send('An error occurred while hashing the password.');
    }
    const newUser = new User({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone,
      password: hash, // Save the hashed password
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
});
//login//




let otps = {};

router.post('/generate-otp', async (req, res) => {
  const otp = crypto.randomBytes(3).toString('hex');
  otps[req.body.email] = otp;
console.log(otp);
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mammenmathew037@gmail.com',
      pass: 'iyxe mplv zjyu swro'
    }
  });

  let mailOptions = {
    from: 'your-email@gmail.com',
    to: req.body.email,
    subject: 'Your OTP',
    text: `Your OTP is ${otp}`
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

  res.sendStatus(200);
});


router.post('/loginto', async (req, res) => {
  // Find user by email
  const user = await User.findOne({ email: req.body.email });
  const { email, password } = req.body;

  if (!user || user.block) {
    // Redirect if user not found or user is blocked
    return res.redirect('login');
  }

  // Validate password
  bcrypt.compare(password, user.password, function(err, result) {
    if (err) {
      console.log(err);
      return res.status(500).send('An error occurred while comparing the passwords.');
    }
    if (result) {
      // Passwords match
      req.session.user = user;
      console.log(user);
      res.redirect('/user/account');
    } else {
      // Passwords don't match
      return res.redirect('login');
    }
  });
});


router.get('/logout', (req, res) => {
  if (req.session.user) {
    req.session.user = null;
    res.redirect('login');
  } else {
    res.redirect('/error');
  }
})

module.exports = router;