const Admin = require('../models/admins');
const User = require('../models/users')
const Product = require('../models/products')
const Brand = require('../models/brand') 
const flash = require('express-flash')



const getAdminLogin = async(req,res)=>{
    try{
        res.render('admin/signin')
    } catch (error){
        console.log(error);
        res.send('Error occurred while fetching data')

    }
}

const postAdminLogin = async(req,res)=>{
    try {
        const { email, password } = req.body;
    
        // Find user by email
        const admin = await Admin.findOne({ email });
    
        if (!admin) {
          req.flash('info', 'User does not exist');
          req.flash('type', 'alert alert-danger');
          return res.status(401).redirect('/admin/');
        }
    
        // Validate password
        if (password !== admin.password) {
          req.flash('info', 'Invalide Password');
          req.flash('type', 'alert alert-danger');
          return res.status(401).redirect('/admin/');
          
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
}

const getAdminSignup = async(req,res)=>{
    try{
        res.render('admin/signup')
    }  catch (error) {
        console.log(error);
        res.send('Error occurred while fetching data')
      }
}

const postAdminSignup = async(req,res)=>{
    const existingUser = await Admin.findOne({ email: req.body.email });
   if (existingUser) {
    //  req.flash('info', 'Admin already exists');
    //  req.flash('type', 'alert alert-danger');
     return res.redirect('signup');
     
   }
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
}

const adminDash = async(req,res)=>{
    try{
        res.render('admin/index',{active: 'dash'})
    } catch (error){
        console.log(error);
        res.send('Error occurred while fetching data')
    }
}

const adminLogout = async(req,res)=>{
    try{
        if (req.session.admin) {
            req.session.admin = null;
            // req.flash('info', 'Logout succesfull');
            // req.flash('type', 'alert alert-primary');
            res.redirect('/admin');
          } else {
            res.redirect('/error');
          }
    } catch (error){
        console.log(error);
        res.send('Error occurred while fetching data')
    }
}

//USER FUNCTIONS//

const getUsers = async(req,res)=>{
    try{
        let users = await User.find({});
        res.render('admin/usermanag', { users: users ,active: 'users'});
    } catch (error) {
        console.log(error);
        res.send('Error occurred while fetching data')
    }
} 

const blockUser = async(req,res)=>{
    try {
        let user = await User.findById(req.params.userId);
        console.log(user);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.block = req.body.blockStatus === 'block';
        await user.save();
        res.json({ success: true });
    } catch(err) {
        console.error(err);
        res.json({ success: false });
    }
}

const getProducts = async(req,res)=>{
    try{
      
          let product = await Product.find({deleted: false}).populate('brand');
          let brands = await Brand.find(); // Fetch the brands
          res.render('admin/manageproducts', { product: product, brands: brands,active: 'productmanagement' }); // Pass the brands to your view
     } catch (error){
        console.log(error);
        res.send('Error occurred while fetching data');
      }
}

const editProduct = async(req,res)=>{
    try {
        const id = req.params.id;
        const product = await Product.findById(id).populate('brand');
        const brands = await Brand.find();
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.render('admin/editproduct', { product: product, brands: brands ,  active: 'productmanagement' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
}

const updateProduct = async(req,res)=>{
    try {
        console.log(req.body);
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
  
        res.redirect("/admin/productmanagement");
      } catch (err) {
        console.log(err);
        res.status(500).send('An error occurred while updating the product.');
      }
}
const addProduct = async(req,res)=>{
    try {
        const brands = await Brand.find();
        res.render('admin/addproducts', { brands: brands, active: 'addproduct'});
      } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while fetching the brands.');
      }
}

const uploadProduct = async(req,res)=>{
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
     
        
        res.redirect("/admin/addproduct");
      } catch (err) {
        console.log(err);
        res.status(500).send('An error occurred while saving the product.');
      }
 
}

const deleteImage = async(req,res)=>{
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
  
}

const deleteProduct = async(req,res)=>{
    try {
        const id = req.params.id;
        const product = await Product.findById(id);
        if (product) {
            product.deleted = true;
            await product.save();
            res.redirect('/admin/productmanagement');
        } else {
            res.send('Product not found');
        }
    } catch (error) {
        console.log(error);
        res.send('Error occurred while deleting product');
    }
}

const getBrands = async(req,res)=>{
    try {
        // Fetch the brands from the database
        const brands = await Brand.find();
    
        // Render the view and pass the brands to it
        res.render('admin/brand', { brands: brands,active: 'brands' });
      } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while fetching the brands.');
      }
}

const addBrands = async(req,res)=>{

    const existingBrand = await Brand.findOne({ name: req.body.name });
    if (existingBrand) {
      // req.flash('info', 'User already exists');
      return res.send('hufsdi')
    }
    console.log(req.body);
    const brandName = req.body.name;
 // make sure 'name' matches the form input field name
  
    // Create a new brand
    const brand = new Brand({ name: brandName });
  
    try {
      // Save the brand to the database
      await brand.save();
  
      // Fetch the updated list of brands
      const brands = await Brand.find();
  
      // Send the updated list of brands back to the client
      res.json(brands);
    } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred while saving the brand.');
    }
}

const deleteBrand = async(req,res)=>{
    try {
        await Brand.findByIdAndDelete(req.params.id);
        res.redirect('/admin/brands');
      } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while deleting the brand.');
      }
}

module.exports={
    getAdminLogin,
    postAdminLogin,
    getAdminSignup,
    postAdminSignup,
    adminDash,
    adminLogout,
    getUsers,
    blockUser,
    getProducts,
    editProduct,
    updateProduct,
    addProduct,
    uploadProduct,
    deleteImage,
    deleteProduct,
    getBrands,
    addBrands,
    deleteBrand

}