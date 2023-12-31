
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.render('user/home')
});

router.get('/products', function(req, res) {
  res.render('user/products')
});


module.exports = router;
