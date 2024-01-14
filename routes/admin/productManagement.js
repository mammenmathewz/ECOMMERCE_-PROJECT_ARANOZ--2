
var express = require('express');
const session = require('express-session');
var router = express.Router();
const Product = require('/Users/mamme/BROCAMP PROJECTS/ECOMMERCE_ PROJECT/models/products')
const Brand = require('/Users/mamme/BROCAMP PROJECTS/ECOMMERCE_ PROJECT/models/brand') 
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
      let product = await Product.find({deleted: false}).populate('brand');
      let brands = await Brand.find(); // Fetch the brands
      res.render('admin/manageproducts', { product: product, brands: brands }); // Pass the brands to your view
    } else {
      res.redirect('/admin');
    }
  } catch (error){
    console.log(error);
    res.send('Error occurred while fetching data');
  }
});




//Add products//
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find();
    res.render('admin/addproducts', { brands: brands, message: req.flash('info'), type: req.flash('type') });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while fetching the brands.');
  }
});




router.post("/upload", upload.array("images"), async (req, res) => {
  try {
    // Validate the brand ID
    const brand = await Brand.findById(req.body.brand);
    if (!brand) {
      return res.status(400).send('Invalid brand ID.');
    }

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

    await product.save();
    req.flash('info', 'Product added successfully');
    
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
        const product = await Product.findById(id).populate('brand');
        const brands = await Brand.find();
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.render('admin/editproduct', { product: product, brands: brands });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;




// Update product route
router.post("/updateproduct/:productId", upload.array("images"), async (req, res) => {
  try {
    // Validate the brand ID
    const brand = await Brand.findById(req.body.brand);
    if (!brand) {
      return res.status(400).send('Invalid brand ID.');
    }

    // Find the product by id
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).send('Product not found.');
    }

    // Update the product details
    product.brand = req.body.brand;
    product.productname = req.body.productname;
    product.description = req.body.description;
    product.category = req.body.category;
    product.regularprice = req.body.regularprice;
    product.saleprice = req.body.saleprice;
    product.number = req.body.number;

    // If there are new images, add them to the product
    if (req.files) {
      req.files.forEach(file => {
        product.images.push("/user/img/product/" + file.originalname);
      });
    }

    // Save the updated product
    await product.save();
    req.flash('info', 'Product updated successfully');
    res.redirect("/admin/products/productmanagement");
  } catch (err) {
    console.log(err);
    res.status(500).send('An error occurred while updating the product.');
  }
});


router.delete('/deleteimage/:productId/:imageIndex', async (req, res) => {
  try {
      const productId = req.params.productId;
      const imageIndex = req.params.imageIndex;

      // Find the product by id
      const product = await Product.findById(productId); 

      if (product) {
          // Remove the image at the specified index
          product.images.splice(imageIndex, 1);

          // Save the product with the updated images array
          await product.save();

          // Send a JSON response
          res.json({ message: 'Image deleted successfully' });
      } else {
          res.status(404).json({ message: 'Product not found' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error occurred while deleting image' });
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