require('dotenv').config();
const Product = require('../models/products')
const brand = require('../models/brand')
const User = require('../models/users')
const bcrypt = require('bcrypt');
const session = require('express-session');
const nodemailer = require('nodemailer');
const crypto = require('crypto')

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

const getProducts = async(req,res)=>{
    try {
        let product = await Product.find({deleted: false})
          res.render('user/products',{product:product})
      } catch (error) {
        console.log(error);
        res.send('Error occurred while fetching data')
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
    req.session.user= user;

    if (!user) {
      
      // req.flash('info', 'User does not exist');
      // req.flash('type', 'alert alert-danger');

      return res.redirect('/login');
    }
    if (user.block) {
      // Redirect if user not found or user is blocked
      // req.flash('info', 'Please contact us');
      // req.flash('type', 'alert alert-danger');

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
        // req.flash('info', 'Invalid Password');
        // req.flash('type', 'alert alert-danger');
        
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
      res.render('user/account')
  
  } catch (err){
    console.log(err);
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
    // req.flash('info', 'User already exists');
    return res.redirect('signup');
  }
//OTP
  if (req.body.otp !== otps[req.body.email]) {

    // req.flash('info', 'invalide OTP');
    return res.status(400).redirect('signup');
  }


  // If user does not exist, proceed with signup
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
      address: {
          address1: req.body.address1,
          address2: req.body.address2,
          city: req.body.city,
          state: req.body.state,
          district: req.body.district,
          pincode: req.body.pincode
      }
    });

    try {
      await newUser.save();
      req.session.user = newUser; // Set the session user to the new user
  
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
    postOtp
   
}