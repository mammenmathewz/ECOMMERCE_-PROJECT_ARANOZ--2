
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
      res.render('admin/addproducts', { brands: brands });
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
      console.log(product); // Log the product to check if brand is populated
      if (!product) {
          console.log(`Product not found with id: ${id}`);
      } else if (!product.brand) {
          console.log(`Brand not found for product with id: ${id}`);
      }
      const brands = await Brand.find(); // Fetch the brands
      if (product) {
          res.render('admin/editproduct', { product: product, brands: brands }); // Pass the brands to your view
      } else {
          res.send('Product not found');
      }
  } catch (error) {
      console.log(error);
      res.send('Error occurred while fetching product data');
  }
});




router.post('/updateproduct/:id', upload.array("images"), async (req, res) => {
  try {
    console.log('Request received');
      const id = req.params.id;
      console.log(req.body);

      // Validate the brand ID
      const brand = await Brand.findById(req.body.brand);
      console.log(brand); // Log the brand to check if it exists
      if (!brand) {
        return res.status(400).send('Invalid brand ID.');
      }

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
      const product = await Product.findByIdAndUpdate(id, updatedProduct, { new: true });
      console.log(product); // Log the updated product
      res.redirect('/admin/products/productmanagement'); // redirect to the product management page
  } catch (error) {
      console.log(error);
      res.send('Error occurred while updating product data');
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