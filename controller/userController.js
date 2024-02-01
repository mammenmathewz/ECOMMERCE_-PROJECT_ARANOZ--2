require('dotenv').config();
const Product = require('../models/products')
const brand = require('../models/brand')
const { User, Address } = require('../models/users')
const bcrypt = require('bcrypt');
const session = require('express-session');
const nodemailer = require('nodemailer');
const crypto = require('crypto')
const flash = require('express-flash')
const Order = require("../models/checkout");

const saltRounds = 10;

const getHome =async(req,res)=>{
    try{
        res.render('user/home')
    }
    catch (error) {
        console.log(error);
        res.send('Error occurred while fetching data')
      }
}

const getProducts = async(req, res) => {
  try {
      const { page = 1, limit = 2 } = req.query;
      const skip = (page - 1) * limit;

      // Count the total number of products
      const totalProducts = await Product.countDocuments({deleted: false, number: { $gte: 1 }});

      // Calculate the total number of pages
      const pages = Math.ceil(totalProducts / limit);

      let product = await Product.find({deleted: false, number: { $gte: 1 }}).limit(limit).skip(skip);

      // Pass the current page and total pages to the EJS template
      res.render('user/products', {product: product, currentPage: page, pages: pages});
  } catch (error) {
      console.log(error);
      res.send('Error occurred while fetching data');
  }
}



const getProduct = async(req,res)=>{
    try {
        const id = req.params.id;
        const product = await Product.findById(id).populate('brand'); // Add .populate('brand')
        res.render('user/viewproduct', { product: product });
      } catch (error) {
        console.log(error);
        res.send('Error occurred while fetching data');
      }
}

const getLogin = async(req,res)=>{
  try{

    res.render('user/login')
 
  } catch (error) {
    console.log(error)
  }
}


const postLogin = async(req,res)=>{
  try {
     
    const user = await User.findOne({ email: req.body.email });
    const { email, password } = req.body;
  
    if (!user) {
      
      req.flash('info', 'User does not exist');
      req.flash('type', 'alert alert-danger');
      return res.redirect('/login');
    }
    if (user.block) {
      // Redirect if user not found or user is blocked
      req.flash('info', 'Please contact us');
      req.flash('type', 'alert alert-danger');

      return res.redirect('/login');
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
        res.redirect('/');
        
      } else {
        // Passwords don't match
        req.flash('info', 'Invalide Password');
      req.flash('type', 'alert alert-danger');
        
        return res.redirect('/login');
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred.');
  }
}

const getAccount = async(req,res)=>{
  try{
    const user = await User.findById(req.session.user._id);
    console.log(user);
    res.render('user/account', { user: user });
  } catch (err){
    console.log(err);
  }
}

const editUser = async(req, res) => {
  try {
      const id = req.params.id; // get the user's ID from the request parameters
      const user = await User.findById(id); // find the user by their ID

      if (!user) {
          return res.status(404).send('User not found');
      }

      // render the 'edituser' view, passing the user data to it
      res.render('admin/edituser', { user: user });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
};

const myOrder = async(req, res) => {
  try {
    const user_id= req.session.user._id;
    const orders = await Order.find({ user: user_id }).populate("items.productId").populate("user");
    res.render('user/myorder', { orders });
  } catch(error) {
    console.log(error);
  }
}




const userLogout = async(req,res)=>{
  try {
      req.session.user = null
      res.redirect('/')
  } catch (error) {
      console.log(error.message);
  }
}

const getSignup = async(req,res)=>{
  try{
      res.render('user/signup')
  }catch (error){
    console.log(error.message)
  }
}

const postSignup = async(req,res)=>{
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
      req.flash('info', 'User already exists');
      return res.redirect('signup');
  }

  if (req.body.otp !== otps[req.body.email]) {
      req.flash('info', 'Invalid OTP');
      req.flash('type', 'alert alert-danger');
      return res.status(400).redirect('signup');
  }

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
          password: hash,
          created: Date.now(),
          block: false
      });

      try {
          await newUser.save();
          req.session.user = newUser; 
          res.redirect('login');
      } 
      catch (err) {
          res.json({ message: err.message, type: 'danger' });
      }
  });
}


let otps = {};


const postOtp =async(req,res)=>{
  try {
    const otp = crypto.randomBytes(3).toString('hex');
    otps[req.body.email] = otp;
    console.log(otp, req.body.email);
  
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

  
    let mailOptions = {
      from: 'your-email@gmail.com',
      to: req.body.email,
      subject: 'Your OTP',
      text: `Your OTP is ${otp}`
    };
  
    await transporter.sendMail(mailOptions);
  
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(500).send('An error occurred.');
  }

}

const resetPassword = async(req,res)=>{
  try{
     const { email, otp, newPassword } = req.body;

  // Check if the OTP matches
  if (otp !== otps[email]) {
      req.flash('info', 'Invalid OTP');
      return res.status(400).redirect('login');
  }

  // Hash the new password
  bcrypt.hash(newPassword, saltRounds, async function(err, hash) {
      if (err) {
          console.log(err);
          return res.status(500).send('An error occurred while hashing the password.');
      }

      // Update the user's password
      try {
          await User.updateOne({ email: email }, { password: hash });
          req.flash('info', 'Password reset successful');
          req.flash('type', 'alert alert-success');
          res.redirect('login');
      } catch (err) {
          console.log(err);
          res.status(500).send('An error occurred while updating the password.');
      }
  });


  } catch(error){
    console.log(error);
  }
}


module.exports = {
    getHome,
    getProducts,
    getProduct,
    getLogin,
    postLogin,
    getAccount,
    userLogout,
    getSignup,
    postSignup,
    postOtp,
    myOrder,
    resetPassword,
    editUser
   
}