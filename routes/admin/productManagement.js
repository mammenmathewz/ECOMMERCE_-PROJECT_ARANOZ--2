
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

//manage products//
router.get('/productmanagement', async(req,res)=>{
  try{
    if (req.session.admin) {
     
      let product = await Product.find({deleted: false})
      res.render('admin/manageproducts',{product:product})
   
    }else{
      res.redirect('/admin')
    }
  } catch (error){
    console.log(error);
    res.send('Error occurred while fetching data')
  }
})



//Add products//
router.get('/',(req,res)=>{
    res.render('admin/addproducts')
})


router.post("/upload", upload.array("images"), async (req, res) => {
  const product = new Product({
    brand: req.body.brand,
    productname: req.body.productname,
    description: req.body.description,
    category: req.body.category,
    regularprice: req.body.regularprice,
    saleprice: req.body.saleprice,
    number:req.body.number,
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


//edit//

router.get('/edit-product/:id', async (req, res) => {
  try {
      const id = req.params.id;
      const product = await Product.findById(id);
      if (product) {
          res.render('admin/editproduct', { product: product }); // replace 'edit-product' with your actual edit page
      } else {
          res.send('Product not found');
      }
  } catch (error) {
      console.log(error);
      res.send('Error occurred while fetching product data');
  }
});

router.post('/deleteimage/:productId/:imageName', async (req, res) => {
  try {
      const productId = req.params.productId;
      const imageName = req.params.imageName;

      // Find the product by id
      const product = await Product.findById(productId);

      if (product) {
          // Filter out the image to be deleted
          product.images = product.images.filter(image => image !== imageName);

          // Save the product with the updated images array
          await product.save();

          res.redirect('/admin/edit-product/' + productId);
      } else {
          res.send('Product not found');
      }
  } catch (error) {
      console.log(error);
      res.send('Error occurred while deleting image');
  }
});


router.post('/updateproduct/:id', upload.array("images"), async (req, res) => {
  try {
      const id = req.params.id;
      console.log(req.body)
      const updatedProduct = {
          brand: req.body.brand,
          productname: req.body.productname,
          description: req.body.description,
          category: req.body.category,
          regularprice: req.body.regularprice,
          saleprice: req.body.saleprice,
          number:req.body.number,
          images: req.files.map(file => "/user/img/product/" + file.originalname) // update images with new paths
      };
      await Product.findByIdAndUpdate(id, updatedProduct);
      res.redirect('/admin/products/productmanagement'); // redirect to the product management page
  } catch (error) {
      console.log(error);
      res.send('Error occurred while updating product data');
  }
});




router.post('/delete-product/:id', async (req, res) => {
  try {
      const id = req.params.id;
      const product = await Product.findById(id);
      if (product) {
          product.deleted = true;
          await product.save();
          res.redirect('/admin/products/productmanagement');
      } else {
          res.send('Product not found');
      }
  } catch (error) {
      console.log(error);
      res.send('Error occurred while deleting product');
  }
});



module.exports = router;