var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/login', function(req, res, next) {
  res.render('user/login',);
});

router.get('/signup', function(req, res, next) {
  res.render('user/signup',);
});

module.exports = router;