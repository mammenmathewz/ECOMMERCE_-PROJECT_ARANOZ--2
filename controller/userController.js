require("dotenv").config();
const Product = require("../models/products");
const Brand = require("../models/brand");
const { User, Address } = require("../models/users");
const Banner = require("../models/banners");
const Coupon = require("../models/coupons");
const bcrypt = require("bcrypt");
const session = require("express-session");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const flash = require("express-flash");
const Order = require("../models/checkout");
const moment = require("moment");
const Razorpay = require("razorpay");
const path = require("path");
const fs = require("fs");

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.API_KEY,
});

const saltRounds = 10;

const getHome = async (req, res, next) => {
  try {
    const brands = await Brand.find({ display: true });
    const banners = await Banner.find();

    // Get the most ordered products
    const mostOrderedProducts = await getMostOrderedProducts();

    // Get the product IDs
    const productIds = mostOrderedProducts.map((item) => item._id);

    let mostOrderedProductsDisplay = await Product.find({
      _id: { $in: productIds },
    });

    // Fetch the coupon that is currently set to be displayed
    let coupon = await Coupon.findOne({ display_home: true });

    console.log("id:" + productIds);
    res.render("user/home", {
      user: req.session.user,
      brands: brands,
      banners: banners,
      mostOrderedProductsDisplay: mostOrderedProductsDisplay,
      coupon: coupon,
    });
  } catch (error) {
    console.log(error);
    next(error); // Pass the error to the next middleware
  }
};

const getMostOrderedProducts = async () => {
  return await Order.aggregate([
    { $unwind: "$items" },
    { $group: { _id: "$items.productId", total: { $sum: "$items.quantity" } } },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ]);
};

const getProducts = async (req, res, next) => {
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

    const mostOrderedProducts = await getMostOrderedProducts();

    // Get the product IDs
    const productIds = mostOrderedProducts.map((item) => item._id);
    console.log("id:" + productIds);

    let product = await Product.find({ deleted: false, number: { $gte: 1 } })
      .limit(limit)
      .skip(skip);

    // Fetch the brands
    let brands = await Brand.find();
    let mostOrderedProductsDisplay = await Product.find({
      _id: { $in: productIds },
    });

    res.render("user/products", {
      product: product,
      currentPage: page,
      pages: pages,
      brands: brands,
      mostOrderedProducts: JSON.stringify(productIds), // Convert the array to a JSON string
      mostOrderedProductsDisplay: mostOrderedProductsDisplay,
      totalProducts: totalProducts,
    });
  } catch (error) {
    console.log(error);
    next(error); // Pass the error to the next middleware
  }
};

const getProductsByBrand = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { deleted: false, number: { $gte: 1 } };

    // If a brand ID is provided, add it to the query
    if (req.params.brandId) {
      query.brand = req.params.brandId;
    }

    // Count the total number of products
    const totalProducts = await Product.countDocuments(query);

    // Calculate the total number of pages
    const pages = Math.ceil(totalProducts / limit);

    const mostOrderedProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: { _id: "$items.productId", total: { $sum: "$items.quantity" } },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    // Get the product IDs
    const productIds = mostOrderedProducts.map((item) => item._id);

    let product = await Product.find(query).limit(limit).skip(skip);

    // Fetch the brands
    let brands = await Brand.find();
    let mostOrderedProductsDisplay = await Product.find({
      _id: { $in: productIds },
    });

    // Pass the current page, total pages, and brands to the EJS template
    res.render("user/products", {
      product: product,
      currentPage: page,
      pages: pages,
      brands: brands,
      mostOrderedProducts: JSON.stringify(productIds), // Convert the array to a JSON string
      mostOrderedProductsDisplay: mostOrderedProductsDisplay,
      totalProducts: totalProducts,
    });
  } catch (error) {
    console.log(error);
    next(error); // Pass the error to the next middleware
  }
};

const getProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).populate("brand"); // Add .populate('brand')
    res.render("user/viewproduct", { product: product });
  } catch (error) {
    console.log(error);
    next(error); // Pass the error to the next middleware
  }
};
const getLogin = async (req, res) => {
  try {
    res.render("user/login");
  } catch (error) {
    console.log(error);
    next(error); // Pass the error to the next middleware
  }
};

const postLogin = async (req, res, next) => {
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
    console.log(error);
    next(error); // Pass the error to the next middleware
  }
};

const getAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user._id);
    console.log(user);
    if (user.block) {
      req.flash("info", "Please contact us");
      req.flash("type", "alert alert-danger");
      req.session.user = null;
      return res.redirect("/login");
    }
    res.render("user/account", {
      user: user,
      userId: req.session.user._id,
      addressId: "your_address_id",
    });
  } catch (error) {
    console.log(error);
    next(error); // Pass the error to the next middleware
  }
};

const editUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const addressId = req.params.addressId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }
    if (user.block) {
      // Redirect if user not found or user is blocked
      req.flash("info", "Please contact us");
      req.flash("type", "alert alert-danger");
      req.session.user = null;
      return res.redirect("/login");
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
    console.log(error);
    next(error); // Pass the error to the next middleware
  }
};

const updateAddress = async (req, res, next) => {
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

    // update the address with the new data from the request body
    address.set(req.body);

    // save the updated user
    await user.save();

    req.flash("info", "Address updated successfully");
    req.flash("type", "alert alert-success");
    res.redirect("/account");
  } catch (error) {
    console.log(error);
    next(error); // Pass the error to the next middleware
  }
};

const deleteAddress = async (req, res, next) => {
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
    console.log(error);
    next(error); // Pass the error to the next middleware
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const myOrder = async (req, res, next) => {
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
    next(error); // Pass the error to the next middleware
  }
};

const viewDetails = async (req, res, next) => {
  try {
    console.log(req.params.orderId);
    const order = await Order.findById(req.params.orderId)
      .populate("items.productId")
      .populate("user");

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }
    const formattedDate = moment(order.date).format("DD-MM-YYYY HH:MM");

    res.render("user/viewDetails", {
      order,
      date: formattedDate,
    });
  } catch (error) {
    console.log(error);
    next(error); // Pass the error to the next middleware
  }
};

const changePassword_Profile = async (req, res, next) => {
  try {
    const user_id = req.session.user._id;

    const user = await User.findById(user_id);
    if (user.block) {
      // Redirect if user not found or user is blocked
      req.flash("info", "Please contact us");
      req.flash("type", "alert alert-danger");
      req.session.user = null;
      return res.redirect("/login");
    }
    res.render("user/changepassword", { email: user.email });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const userLogout = async (req, res, next) => {
  try {
    req.session.user = null;
    res.redirect("/");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getSignup = async (req, res, next) => {
  try {
    res.render("user/signup");
  } catch (error) {
    console.log(error);
    next(error);
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

  // Password validation
  const password = req.body.password;
  const passwordRequirements = {
    numCharacters: 8,
    useLowercase: true,
    useUppercase: true,
    useNumbers: true,
    useSpecial: true,
  };

  // Validate password according to requirements
  const isValidPassword = validatePassword(password, passwordRequirements);
  if (!isValidPassword) {
    req.flash(
      "info",
      "Your password does not meet the requirements. Please try again."
    );
    return res.status(400).redirect("signup");
  }

  bcrypt.hash(password, saltRounds, async function (err, hash) {
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

// Password validation function
function validatePassword(password, requirements) {
  // Check length
  if (password.length < requirements.numCharacters) {
    return false;
  }

  // Check for lowercase letter
  if (requirements.useLowercase && !/[a-z]/.test(password)) {
    return false;
  }

  // Check for uppercase letter
  if (requirements.useUppercase && !/[A-Z]/.test(password)) {
    return false;
  }

  // Check for number
  if (requirements.useNumbers && !/[0-9]/.test(password)) {
    return false;
  }

  // Check for special character
  if (
    requirements.useSpecial &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)
  ) {
    return false;
  }

  // If all requirements are met
  return true;
}

let otps = {};

const postOtp = async (req, res, next) => {
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
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Check if the OTP matches
    if (otp !== otps[email]) {
      req.flash("info", "Invalid OTP");
      return res.status(400).redirect("login");
    }

    // Password validation
    const passwordRequirements = {
      numCharacters: 8,
      useLowercase: true,
      useUppercase: true,
      useNumbers: true,
      useSpecial: true,
    };

    // Validate new password according to requirements
    const isValidPassword = validatePassword(newPassword, passwordRequirements);
    if (!isValidPassword) {
      req.flash(
        "info",
        "Your new password does not meet the requirements. Please try again."
      );
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
    next(error);
  }
};


const viewOrder = async (req, res, next) => {
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
    next(error);
  }
};

const resetPasswordWithoutOTP = async (req, res, next) => {
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

    // Password validation
    const passwordRequirements = {
      numCharacters: 8,
      useLowercase: true,
      useUppercase: true,
      useNumbers: true,
      useSpecial: true,
    };

    // Validate new password according to requirements
    const isValidPassword = validatePassword(newPassword, passwordRequirements);
    if (!isValidPassword) {
      req.flash(
        "info",
        "Your new password does not meet the requirements. Please try again."
      );
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
    next(error);
  }
};


const filterAndSortProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "1",
      categories,
      brands,
      search = "",
    } = req.query;
    const skip = (page - 1) * limit;

    let query = { deleted: false, number: { $gte: 1 } };

    // Handle search
    if (search) {
      query.$or = [
        { productname: { $regex: search, $options: "i" } },
        { "brand.name": { $regex: search, $options: "i" } },
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
    let sortQuery;
    switch (sort) {
      case "1":
        sortQuery = { saleprice: 1 }; // Sort by price, low to high
        break;
      case "2":
        sortQuery = { saleprice: -1 }; // Sort by price, high to low
        break;
      case "3":
        sortQuery = { productname: 1 }; // Sort by product name, Aa-Az
        break;
      case "4":
        sortQuery = { productname: -1 }; // Sort by product name, Z-A
        break;
      default:
        sortQuery = {};
    }

    // Count the total number of products
    const totalProducts = await Product.countDocuments(query);

    // Calculate the total number of pages
    const pages = Math.ceil(totalProducts / limit);

    // Find the 10 most ordered products
    const mostOrderedProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: { _id: "$items.productId", total: { $sum: "$items.quantity" } },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    // Get the product IDs
    const productIds = mostOrderedProducts.map((item) => item._id.toString());

    let product = await Product.find(query)
      .sort(sortQuery)
      .limit(limit)
      .skip(skip);

    res.json({
      product: product,
      currentPage: page,
      pages: pages,
      mostOrderedProducts: productIds,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (user.block) {
      // Redirect if user not found or user is blocked
      req.flash("info", "Please contact us");
      req.flash("type", "alert alert-danger");
      req.session.user = null;
      return res.redirect("/login");
    }
    res.render("user/wallet", { user: user, moment: moment });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
const generateOrderid = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const clientOrderId = req.body.orderId;

    let existingOrder;

    try {
      existingOrder = await Order.findOne({ _id: clientOrderId, user: userId })
        .populate("user")
        .populate("items.productId");

      // Check if products are in stock
      for (let item of existingOrder.items) {
        if (item.productId.number < item.quantity) {
          return res
            .status(400)
            .json({
              message: `Product ${item.productId.productname} is out of stock.`,
            });
        } else {
          console.log(true);
        }
      }
    } catch (error) {
      console.log("Error message:", error.message);
      console.log("Error stack:", error.stack);
    }

    var options = {
      amount: existingOrder.grandTotal * 100, // Use the grandTotal of the existing order
      currency: "INR",
      receipt: "order_rcptid_" + Math.random().toString(36).substring(7),
    };
    console.log(options.receipt);

    instance.orders
      .create(options)
      .then(function (order) {
        req.session.orderId = existingOrder._id;
        res.json({ orderId: order.id });
      })
      .catch(function (err) {
        console.log(err);
        return res.status(500).send({ message: err.message });
      });
  } catch (error) {
    console.log("Error message:", error.message);
    console.log("Error stack:", error.stack);
  }
};

const generateInvoice = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate("items.productId")
      .populate("user");

    if (!order) {
      console.log(`No order found with id: ${orderId}`);
      return;
    }

    let index = order.selectedAddress;

    const ordersInfo = order.items.map((item) => ({
      quantity: item.quantity,
      description: `${item.productId.productname}`,
      price: item.productId.saleprice,
      Total: order.total - order.discount - order.grandTotal,
    }));

    var data = {
      apiKey:
        "9IfEYtA5Bc3sS6gaj7W85B4JjtctPTihRY3uUmyW34Ezwvmh6SChsPxL7d18AYEB",
      mode: "development",
      images: {
        logo: "https://themewagon.github.io/aranoz/img/logo.png",
      },
      sender: {
        company: "Aranoz",
        address: "Sample Street 123",
        zip: "1234 AB",
        city: "Sampletown",
        country: "Samplecountry",
      },
      client: {
        company: order.user.first_name + " " + order.user.last_name,
        address: order.user.address[index].address1,
        zip: order.user.address[index].pin.toString(),
        city: order.user.address[index].district,
        country: order.user.address[index].state,
      },
      information: {
        ID: order._id,
        date: moment(order.date).format("YYYY-MM-DD HH:mm:ss"),
      },
      products: ordersInfo,
      bottomNotice:
        "Your satisfaction is our priority. Thank you for choosing Aranoz.com",
      settings: {
        currency: "INR",
      },
    };

    const result = await easyinvoice.createInvoice(data);

    const folderPath = path.join(__dirname, "..", "public", "Invoice");
    const filePath = path.join(folderPath, `${order._id}.pdf`);

    fs.mkdirSync(folderPath, { recursive: true });
    fs.writeFileSync(filePath, result.pdf, "base64");

    order.invoice = filePath;
    await order.save();

    console.log(`Invoice saved at: ${filePath}`);
  } catch (error) {
    console.error("Error creating invoice:", error);
  }
};
const downlodeInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const filePath = path.join(
      __dirname,
      "..",
      "public",
      "Invoice",
      `${orderId}.pdf`
    );

    if (!fs.existsSync(filePath)) {
      // If the invoice file doesn't exist, generate it
      await generateInvoice(orderId);
    }

    fs.readFile(filePath, function (err, data) {
      res.contentType("application/pdf");
      res.send(data);
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

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
  viewDetails,
  changePassword_Profile,
  resetPasswordWithoutOTP,
  filterAndSortProducts,
  getWallet,
  generateOrderid,
  downlodeInvoice,
  getProductsByBrand,
};
