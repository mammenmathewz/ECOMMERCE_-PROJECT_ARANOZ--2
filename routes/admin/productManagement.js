
var express = require('express');
const session = require('express-session');
var router = express.Router();
const Product = require('/Users/mamme/BROCAMP PROJECTS/ECOMMERCE_ PROJECT/models/products')
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/user/img/product');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

router.get('/',(req,res)=>{
    res.render('admin/productManagement')
})


router.post("/upload", upload.array("images"), async (req, res) => {
  const product = new Product({
    brand: req.body.brand,
    productname: req.body.productname,
    description: req.body.description,
    category: req.body.category,
    regularprice: req.body.regularprice,
    saleprice: req.body.saleprice,
    createdon: Date.now()
   
  });
  req.files.forEach(file => {
    // Save the path of the image file to the database
    product.images.push("/user/img/product/" + file.originalname);
  });
  try {
    await product.save();
    res.redirect("/admin/products");
  } catch (err) {
    console.log(err);
    res.status(500).send('An error occurred while saving the product.');
  }
});



module.exports = router;