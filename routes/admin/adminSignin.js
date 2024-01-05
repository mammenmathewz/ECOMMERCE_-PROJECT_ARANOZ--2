var express = require('express');
var router = express.Router();
const Admin = require('/Users/mamme/BROCAMP PROJECTS/ECOMMERCE_ PROJECT/models/admins')
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

router.use(express.urlencoded({ extended: true }))

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

/* GET users listing. */

function checkAuthenticated(req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    res.redirect('/admin');
  }
}

router.get('/', function (req, res, next) {
  if (req.session.admin) {
    res.redirect('/admin/dash');
  } else {
    res.render('admin/signin');
  }
});

router.get('/signup',function(req, res, next) {
 
  if (req.session.user) {
    res.redirect('/admin/dash');
  } else {
    res.render('admin/signup',);
  }
});

router.post('/signup', async function(req, res) {
  try {
    // Get the data from the request body
    const { email, password } = req.body;

    // Create a new user with the provided email and password
    const admin = new Admin({
      email: email,
      password: password,
      
    });

    // Save the new user to the database
    await admin.save();

    // Redirect or respond as necessary
    res.redirect('/admin/dash');
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while signing up.');
  }
});



router.get('/dash', checkAuthenticated, function (req, res, next) {
  res.render('admin/index',);
});


// router.get('/dash', function(req, res, next) {
//   res.render('admin/index');
// });



router.post('/adminlogin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).send('User not found');
    }

    // Validate password
    if (password !== admin.password) {
      return res.status(401).send('Invalid password');
    }
    else {
      // Set user session
      req.session.admin = admin;
      console.log(admin);

      // Redirect to account
      res.redirect('/admin/dash');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

router.get('/admin/adminlogout', (req, res) => {
  if (req.session.admin) {
    req.session.admin = null;
    res.redirect('/admin');
  } else {
    res.redirect('/error');
  }
})


module.exports = router;
