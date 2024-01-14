
var express = require('express');
var router = express.Router();
const Product = require('/Users/mamme/BROCAMP PROJECTS/ECOMMERCE_ PROJECT/models/products')



/* GET users listing. */
router.get('/', function(req, res) {
  res.render('user/home')
});

router.get('/products',async function(req, res) {
  try {
    let product = await Product.find({deleted: false})
      res.render('user/products',{product:product})
  } catch (error) {
    console.log(error);
    res.send('Error occurred while fetching data')
  }
});


router.get('/viewproduct/:id', async function(req, res) {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).populate('brand'); // Add .populate('brand')
    res.render('user/viewproduct', { product: product });
  } catch (error) {
    console.log(error);
    res.send('Error occurred while fetching data');
  }
});





module.exports = router;
