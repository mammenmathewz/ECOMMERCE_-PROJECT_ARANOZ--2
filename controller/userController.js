require("dotenv").config();
const Product = require("../models/products");
const Brand = require("../models/brand");
const { User, Address } = require("../models/users");
const bcrypt = require("bcrypt");
const session = require("express-session");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const flash = require("express-flash");
const Order = require("../models/checkout");
const Razorpay = require('razorpay')
const path = require('path');
const fs = require('fs');

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.API_KEY,
});

const saltRounds = 10;

const getHome = async (req, res) => {
  try {
    res.render("user/home", { user: req.session.user });
  } catch (error) {
    console.log(error);
    res.send("Error occurred while fetching data");
  }
};

const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Count the total number of products
    const totalProducts = await Product.countDocuments({
      deleted: false,
      number: { $gte: 1 },
    });

    // Calculate the total number of pages
    const pages = Math.ceil(totalProducts / limit);

    const mostOrderedProducts = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", total: { $sum: "$items.quantity" } } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // Get the product IDs
    const productIds = mostOrderedProducts.map(item => item._id);
    console.log("id:"+productIds);

    let product = await Product.find({ deleted: false, number: { $gte: 1 } })
      .limit(limit)
      .skip(skip);

    // Fetch the brands
    let brands = await Brand.find();
    let mostOrderedProductsDisplay = await Product.find({ _id: { $in: productIds } });

    // Pass the current page, total pages, and brands to the EJS template
    res.render("user/products", {
      product: product,
      currentPage: page,
      pages: pages,
      brands: brands,
      mostOrderedProducts: JSON.stringify(productIds),// Convert the array to a JSON string
      mostOrderedProductsDisplay: mostOrderedProductsDisplay,
      totalProducts: totalProducts
    });
    
  } catch (error) {
    console.log(error);
    res.send("Error occurred while fetching data");
  }
};

const getProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).populate("brand"); // Add .populate('brand')
    res.render("user/viewproduct", { product: product });
  } catch (error) {
    console.log(error);
    res.send("Error occurred while fetching data");
  }
};

const getLogin = async (req, res) => {
  try {
    res.render("user/login");
  } catch (error) {
    console.log(error);
  }
};

const postLogin = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    const { email, password } = req.body;

    if (!user) {
      req.flash("info", "User does not exist");
      req.flash("type", "alert alert-danger");
      return res.redirect("/login");
    }
    if (user.block) {
      // Redirect if user not found or user is blocked
      req.flash("info", "Please contact us");
      req.flash("type", "alert alert-danger");

      return res.redirect("/login");
    }

    // Validate password
    bcrypt.compare(password, user.password, function (err, result) {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .send("An error occurred while comparing the passwords.");
      }
      if (result) {
        // Passwords match
        req.session.user = user;
        res.redirect("/");
      } else {
        // Passwords don't match
        req.flash("info", "Invalid Password");
        req.flash("type", "alert alert-danger");

        return res.redirect("/login");
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred.");
  }
};

const getAccount = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    console.log(user);
    // Pass userId and addressId to the EJS template
    res.render("user/account", {
      user: user,
      userId: req.session.user._id,
      addressId: "your_address_id",
    });
  } catch (err) {
    console.log(err);
  }
};

const editUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const addressId = req.params.addressId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const address = user.address.id(addressId);

    if (!address) {
      return res.status(404).send("Address not found");
    }

    res.render("user/edituser", {
      user: user,
      address: address,
      userId: userId,
      addressId: addressId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const updateAddress = async (req, res) => {
  try {
    const userId = req.params.userId; // get the user's ID from the request parameters
    const addressId = req.params.addressId; // get the address ID from the request parameters

    const user = await User.findById(userId); // find the user by their ID

    if (!user) {
      return res.status(404).send("User not found");
    }

    const address = user.address.id(addressId); // find the address by its ID

    if (!address) {
      return res.status(404).send("Address not found");
    }

    // update the address with the new data from the request body
    address.set(req.body);

    // save the updated user
    await user.save();

    req.flash("info", "Address updated successfully");
    req.flash("type", "alert alert-success");
    res.redirect("/account");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.params.userId; // get the user's ID from the request parameters
    const addressId = req.params.addressId; // get the address ID from the request parameters

    const user = await User.findById(userId); // find the user by their ID

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // remove the address
    user.address.pull(addressId);

    // save the updated user
    await user.save();

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const myOrder = async (req, res) => {
  try {
    const page = req.query.page || 1; // Get the page number from the query parameters
    const limit = 4; // Set the number of orders per page
    const skip = (page - 1) * limit; // Calculate the number of orders to skip

    const user_id = req.session.user._id;
    const orders = await Order.find({ user: user_id })
      .populate("items.productId")
      .populate("user")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit); // Limit the number of orders and skip the orders from the previous pages

    const count = await Order.countDocuments({ user: user_id });
    const pages = Math.ceil(count / limit);

    res.render("user/userorders", { orders, currentPage: page, pages });
  } catch (error) {
    console.log(error);
  }
};


const changePassword_Profile = async (req, res) => {
  try {
    const user_id = req.session.user._id;
    // Fetch the user from the database
    const user = await User.findById(user_id);
    // Pass the user's email to the view
    res.render("user/changepassword", { email: user.email });
  } catch (error) {
    console.log(error);
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.user = null;
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const getSignup = async (req, res) => {
  try {
    res.render("user/signup");
  } catch (error) {
    console.log(error.message);
  }
};

const postSignup = async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    req.flash("info", "User already exists");
    return res.redirect("signup");
  }

  if (req.body.otp !== otps[req.body.email]) {
    req.flash("info", "Invalid OTP");
    req.flash("type", "alert alert-danger");
    return res.status(400).redirect("signup");
  }

  bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .send("An error occurred while hashing the password.");
    }
    const newUser = new User({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone,
      password: hash,
      created: Date.now(),
      block: false,
    });

    try {
      await newUser.save();
      req.session.user = newUser;
      res.redirect("login");
    } catch (err) {
      res.json({ message: err.message, type: "danger" });
    }
  });
};

let otps = {};

const postOtp = async (req, res) => {
  try {
    const otp = crypto.randomBytes(3).toString("hex");
    otps[req.body.email] = otp;
    console.log(otp, req.body.email);

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailOptions = {
      from: "your-email@gmail.com",
      to: req.body.email,
      subject: "Your OTP",
      text: `Your OTP is ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred.");
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Check if the OTP matches
    if (otp !== otps[email]) {
      req.flash("info", "Invalid OTP");
      return res.status(400).redirect("login");
    }

    // Hash the new password
    bcrypt.hash(newPassword, saltRounds, async function (err, hash) {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .send("An error occurred while hashing the password.");
      }

      // Update the user's password
      try {
        await User.updateOne({ email: email }, { password: hash });
        req.flash("info", "Password reset successful");
        req.flash("type", "alert alert-success");
        res.redirect("login");
      } catch (err) {
        console.log(err);
        res.status(500).send("An error occurred while updating the password.");
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const viewOrder = async (req, res) => {
  try {
    // Get the user's ID from the session
    const userId = req.session.userId;
    console.log(userId);

    // Find orders for the specific user
    const orders = await Order.find({ user: userId })
      .populate("user")
      .populate("items.productId");
    console.log(orders);

    // Render the 'user/myorder' view with the orders
    res.render("user/myorder", { orders: orders });
  } catch (error) {
    console.log(error);
  }
};

const resetPasswordWithoutOTP = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    // Find the user
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).redirect("/account");
    }

    // Check the current password
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      req.flash("info", "Current password is wrong");
      req.flash("type", "alert alert-danger");
      return res.status(400).redirect("/account");
    }

    // Hash the new password
    bcrypt.hash(newPassword, saltRounds, async function (err, hash) {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .send("An error occurred while hashing the password.");
      }

      // Update the user's password
      user.password = hash;
      await user.save();

      req.flash("info", "Password reset success");
      req.flash("type", "alert alert-success");
      res.redirect("/account");
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred.");
  }
};

const filterAndSortProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "1", categories, brands, search = "" } = req.query;
    const skip = (page - 1) * limit;

    let query = { deleted: false, number: { $gte: 1 } };

    // Handle search
    if (search) {
      query.$or = [
        { productname: { $regex: search, $options: 'i' } },
        { 'brand.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Handle category filtering
    if (categories) {
      if (categories.includes("Mens") || categories.includes("Womens")) {
        categories.push("Unisex");
      }
      query.category = { $in: categories };
    }

    // Handle brand filtering
    if (brands) {
      const brandDocs = await Brand.find({ name: { $in: brands } });
      const brandIds = brandDocs.map((doc) => doc._id);
      query.brand = { $in: brandIds };
    }

    // Handle sorting
    let sortOrder = sort === "1" ? 1 : -1;
    let sortQuery = { saleprice: sortOrder };

    // Count the total number of products
    const totalProducts = await Product.countDocuments(query);

    // Calculate the total number of pages
    const pages = Math.ceil(totalProducts / limit);

    // Find the 10 most ordered products
    const mostOrderedProducts = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", total: { $sum: "$items.quantity" } } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // Get the product IDs
    const productIds = mostOrderedProducts.map(item => item._id.toString());

    let product = await Product.find(query)
      .sort(sortQuery)
      .limit(limit)
      .skip(skip);

    // Send a JSON response
    res.json({ product: product, currentPage: page, pages: pages, mostOrderedProducts: productIds });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred while fetching data");
  }
};


const getWallet = async(req,res)=>{
  try {
    const user = await User.findById(req.session.user._id);
    console.log(user);
    res.render('user/wallet',{user:user})
  } catch (error) {
    console.log(error);
  }
}
const generateOrderid = async(req,res)=>{
  try {
    const userId = req.session.user._id;
    const clientOrderId = req.body.orderId; 

    let existingOrder;

    try {
      existingOrder = await Order.findOne({ _id: clientOrderId,user:userId }).populate("user").populate("items.productId");
     
      // Check if products are in stock
      for (let item of existingOrder.items) {
        if (item.productId.number < item.quantity) {
          return res.status(400).json({ message: `Product ${item.productId.productname} is out of stock.` });
        } else {
          console.log(true);
        }
      }
      

    } catch (error) {
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
    }
    
    var options = {
      amount: existingOrder.grandTotal * 100,  // Use the grandTotal of the existing order
      currency: "INR",
      receipt: "order_rcptid_" + Math.random().toString(36).substring(7)
    };
    console.log(options.receipt);

    instance.orders.create(options)
    .then(function(order) { 
      req.session.orderId = existingOrder._id;
      res.json({ orderId: order.id });
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).send({ message: err.message });
    });

  } catch (error) {
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
  }
}

const downlodeInvoice = async(req,res)=>{
  try {
    const orderId = req.params.orderId;
    const filePath = path.join(__dirname, '..', 'public', 'Invoice', `${orderId}.pdf`);
  
    fs.readFile(filePath , function (err,data){
      res.contentType("application/pdf");
      res.send(data);
    });
  } catch (error) {
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
  editUser,
  updateAddress,
  deleteAddress,
  viewOrder,
  changePassword_Profile,
  resetPasswordWithoutOTP,
  filterAndSortProducts,
  getWallet,
  generateOrderid,
  downlodeInvoice
};
