require("dotenv").config();
const Admin = require("../models/admins");
const { User } = require("../models/users");
const Product = require("../models/products");
const Brand = require("../models/brand");
const Order = require("../models/checkout");
const Coupon = require("../models/coupons");
const Banner = require("../models/banners");
const moment = require("moment");
const fs = require("fs");
const path = require("path");

const getAdminLogin = async (req, res, next) => {
  try {
    res.render("admin/signin");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const postAdminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      req.flash("info", "User does not exist");
      req.flash("type", "alert alert-danger");
      return res.status(401).redirect("/admin/");
    }

    // Validate password
    if (password !== admin.password) {
      req.flash("info", "Invalide Password");
      req.flash("type", "alert alert-danger");
      return res.status(401).redirect("/admin/");
    } else {
      // Set user session
      req.session.admin = admin;
      console.log(admin);

      // Redirect to account
      res.redirect("/admin/dash");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getAdminSignup = async (req, res, next) => {
  try {
    res.render("admin/addAdmin",{active: "dash"});
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const postAdminSignup = async (req, res, next) => {
  const existingUser = await Admin.findOne({ email: req.body.email });
  if (existingUser) {
    //  req.flash('info', 'Admin already exists');
    //  req.flash('type', 'alert alert-danger');
    return res.redirect("signup");
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
    res.redirect("/admin/dash");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

function aggregateDailySales() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return Order.aggregate([
    {
      $match: {
        paymentStatus: { $ne: "Failed" },
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      },
    },
    {
      $group: {
        _id: { $hour: { date: "$date", timezone: "Asia/Kolkata" } }, // replace with your local time zone
        totalSales: { $sum: "$total" },
      },
    },
    { $sort: { _id: 1 } },
  ]).exec();
}

// Function to aggregate weekly sales data
function aggregateWeeklySales() {
  const now = new Date();
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay()
  );
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  console.log("start:" + startOfWeek + "      " + endOfWeek);
  return Order.aggregate([
    {
      $match: {
        paymentStatus: { $ne: "Failed" },
        date: {
          $gte: startOfWeek,
          $lt: endOfWeek,
        },
      },
    },
    {
      $group: {
        _id: { $dayOfWeek: { date: "$date", timezone: "Asia/Kolkata" } },
        totalSales: { $sum: "$total" },
      },
    },

    { $sort: { _id: 1 } },
  ]).exec();
}

// Function to aggregate yearly sales data
function aggregateYearlySales() {
  return Order.aggregate([
    {
      $match: {
        paymentStatus: { $ne: "Failed" },
        date: {
          $gte: new Date(new Date().getFullYear(), 0, 1),
          $lt: new Date(new Date().getFullYear() + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$date" },
        totalSales: { $sum: "$total" },
      },
    },
    { $sort: { _id: 1 } },
  ]).exec();
}

const getDailyDeliveredOrders = async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return await Order.find({
    is_delivered: true,
    date: { $gte: startOfDay },
  }).populate("user");
};

const getWeeklyDeliveredOrders = async () => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return await Order.find({
    is_delivered: true,
    date: { $gte: oneWeekAgo },
  }).populate("user");
};

const getYearlyDeliveredOrders = async () => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return await Order.find({
    is_delivered: true,
    date: { $gte: oneYearAgo },
  }).populate("user");
};

////GET ADMIN DASH/////

const adminDash = async (req, res, next) => {
  try {
    const [
      dailySales,
      weeklySales,
      yearlySales,
      totalOrders,
      codOrders,
      onlineOrders,
    ] = await Promise.all([
      aggregateDailySales(),
      aggregateWeeklySales(),
      aggregateYearlySales(),
      Order.countDocuments(), // total number of orders
      Order.countDocuments({ paymentMethod: "COD" }), // number of orders with paymentMethod == 'COD'
      Order.countDocuments({ paymentMethod: "Online payment" }), // number of orders with paymentMethod == 'Online Payment'
    ]);

    // Create an array for each day of the week with default sales of 0
    const weeklySalesData = Array(7)
      .fill(0)
      .map((_, i) => ({ _id: i + 1, totalSales: 0 }));

    // Update the sales for the days that are in the result of the aggregation
    for (const sale of weeklySales) {
      weeklySalesData[sale._id - 1].totalSales = sale.totalSales;
    }

    console.log(weeklySalesData);
    const yearlySalesData = Array(12)
      .fill(0)
      .map((_, i) => ({ _id: i + 1, totalSales: 0 }));

    for (const sale of yearlySales) {
      yearlySalesData[sale._id - 1].totalSales = sale.totalSales;
    }
    const dailySalesData = Array(24)
      .fill(0)
      .map((_, i) => ({ _id: i, totalSales: 0 }));

    for (const sale of dailySales) {
      dailySalesData[sale._id].totalSales = sale.totalSales;
    }

    const weeklyTotal = weeklySales.reduce(
      (sum, sale) => sum + sale.totalSales,
      0
    );
    const dailyTotal = dailySales.reduce(
      (sum, sale) => sum + sale.totalSales,
      0
    );
    const yearlyTotal = yearlySales.reduce(
      (sum, sale) => sum + sale.totalSales,
      0
    );

    console.log(
      "weekly :" + JSON.stringify(dailySales + "  total=" + dailyTotal)
    );

    res.render("admin/index", {
      active: "dash",
      dailyTotal,
      dailySalesData,
      weeklyTotal,
      weeklySalesData,
      yearlyTotal,
      yearlySalesData,
      totalOrders,
      codOrders,
      onlineOrders,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const salesReport = async (req, res, next) => {
  try {
    let salesData;

    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);

      salesData = await Order.find({
        is_delivered: true,
        date: { $gte: startDate, $lte: endDate },
      }).populate("user");
    } else {
      switch (req.query.timePeriod) {
        case "daily":
          salesData = await getDailyDeliveredOrders();
          break;
        case "weekly":
          salesData = await getWeeklyDeliveredOrders();
          break;
        case "yearly":
          salesData = await getYearlyDeliveredOrders();
          break;
        default:
          break;
      }
    }

    res.json({ salesData });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const dataPerDate = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;
    console.log(startDate + "  " + endDate);
    const data = await Order.aggregate([
      {
        $match: {
          paymentStatus: { $ne: "Failed" },
          date: {
            $gte: new Date(startDate),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
          },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$date" },
          totalSales: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();

    // Initialize an array with zeros for each day of the selected date range
    const salesPerDay = Array(
      moment(endDate).diff(moment(startDate), "days") + 1
    ).fill(0);

    // Update the array with the data from the aggregation
    for (const item of data) {
      salesPerDay[item._id - moment(startDate).date()] = item.totalSales;
    }
    console.log(JSON.stringify(salesPerDay));
    res.json(salesPerDay);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const adminLogout = async (req, res, next) => {
  try {
    if (req.session.admin) {
      req.session.admin = null;
      // req.flash('info', 'Logout succesfull');
      // req.flash('type', 'alert alert-primary');
      res.redirect("/admin");
    } else {
      res.redirect("/error");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//USER FUNCTIONS//
const getUsers = async (req, res, next) => {
  try {
    const page = req.query.page || 1; // Get the page number from the query parameters
    const limit = 10; // Set the number of users per page
    const skip = (page - 1) * limit; // Calculate the number of users to skip

    // Fetch the users for the current page
    let users = await User.find({}).skip(skip).limit(limit);

    // Calculate the total number of pages
    const count = await User.countDocuments({});
    const pages = Math.ceil(count / limit);

    // Pass the users, current page, and total pages to the view
    res.render("admin/usermanag", {
      users: users,
      active: "users",
      currentPage: page,
      pages,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const blockUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.userId);
    console.log(user);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.block = req.body.blockStatus === "block";
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
};

const getBrands = async (req, res, next) => {
  try {
    // Fetch the brands from the database
    const brands = await Brand.find();

    // Render the view and pass the brands to it
    res.render("admin/brand", { brands: brands, active: "brands" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const addBrands = async (req, res, next) => {
  const existingBrand = await Brand.findOne({
    name: { $regex: new RegExp(`^${req.body.name}$`, "i") },
  });
  if (existingBrand) {
    return res.status(400).json({ message: "Brand already exists" });
  }
  console.log(req.body);
  const brandName = req.body.name;
  let brandImage = "";
  if (req.file) {
    brandImage = "/user/img/product/" + req.file.originalname; // Save the path of the image file to the database
  }

  // Create a new brand
  const brand = new Brand({ name: brandName, brandImage: brandImage });

  try {
    // Save the brand to the database
    await brand.save();

    // Fetch the updated list of brands
    const brands = await Brand.find();

    // Send the updated list of brands back to the client
    res.json(brands);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const toggleBrandDisplay = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.brandId);
    if (!brand) {
      return res.status(400).json({ message: "Brand not found" });
    }
    brand.display = !brand.display;
    await brand.save();

    // Send different messages based on the value of brand.display
    let message = brand.display
      ? "Brand added to home page"
      : "Brand removed from home page";
    res.json({ message: message });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const deleteBrand = async (req, res, next) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.redirect("/admin/brands");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getOrderManagement = async (req, res, next) => {
  try {
    const page = req.query.page || 1; // Get the page number from the query parameters
    const limit = 10; // Set the number of orders per page
    const skip = (page - 1) * limit; // Calculate the number of orders to skip

    // Fetch the orders for the current page and sort by date
    // Fetch the orders for the current page and sort by date
    const orders = await Order.find({ paymentStatus: { $ne: "Failed" } })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate("items.productId")
      .populate("user");

    // Calculate the total number of pages
    const count = await Order.countDocuments({});
    const pages = Math.ceil(count / limit);

    const active = "orders";

    // Pass the orders, current page, and total pages to the view
    res.render("admin/ordermanagement", {
      orders,
      active,
      currentPage: page,
      pages,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const switchStatus = async (req, res) => {
  const orderId = req.params.id; // Get the order ID from the URL
  const status = req.body.status; // Get the new status from the request body
  console.log("status  : : " + status);
  let amount;
  try {
    const order = await Order.findById(orderId)
      .populate("items.productId")
      .populate("user");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // find the user
    const user = await User.findById(order.user._id);

    order.is_delivered = false;
    order.user_cancelled = false;
    order.admin_cancelled = false;
    order.is_returned = false;

    switch (status) {
      case "Delivered":
        order.is_delivered = true;
        order.paymentStatus = "Paid";
        order.delivery_time = new Date();
        break;

      case "User Cancelled":
        order.user_cancelled = true;
        incrementProductQuantity(order.items);
        amount = order.total - order.discount;
        if (order.paymentStatus == "Paid") {
          user.transactions.push({
            amount: amount,
            type: "credit",
            orderId: order._id,
          });
          user.wallet += amount;
        }

        break;

      case "Admin Cancelled":
        order.admin_cancelled = true;
        incrementProductQuantity(order.items);
        amount = order.total - order.discount;
        console.log("admin :  :" + amount);
        if (order.paymentStatus == "Paid") {
          user.transactions.push({
            amount: amount,
            type: "credit",
            orderId: order._id,
          });
          user.wallet += amount;
        }

        break;

      case "Returned":
        order.is_returned = true;
        incrementProductQuantity(order.items);
        amount = order.total - order.discount;
        if (order.paymentStatus == "Paid") {
          user.transactions.push({
            amount: amount,
            type: "credit",
            orderId: order._id,
          });
          user.wallet += amount;
        }

        break;

      case "Pending":
        order.is_delivered = false;
        order.user_cancelled = false;
        order.admin_cancelled = false;
        order.is_returned = false;
        break;
      default:
        return res.status(400).json({ message: "Invalid status" });
    }
    console.log(order.paymentStatus);
    await user.save(); // Save the updated user
    await order.save();
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

async function incrementProductQuantity(items) {
  for (let item of items) {
    const product = await Product.findById(item.productId._id);
    product.number += item.quantity;
    await product.save();
  }
}

const vieworder = async (req, res, next) => {
  try {
    // Fetch the order by its ID, populate product details and user data
    console.log(req.params.orderId);
    const order = await Order.findById(req.params.orderId)
      .populate("items.productId")
      .populate("user");

    // Check if order exists
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    // Format the date using moment
    const formattedDate = moment(order.date).format("DD-MM-YYYY HH:MM");

    // Render the 'vieworder' page with the order details and the formatted date
    res.render("admin/viewmore", {
      order,
      active: "orders",
      date: formattedDate,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getHomeSettings = async (req, res) => {
  try {
    const active = "settings";
    const banners = await Banner.find();
    const coupons = await Coupon.find();

    res.render("admin/settings", { active, banners, coupons });
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred while fetching the banners.");
  }
};

const addBanner = async (req, res) => {
  try {
    const { mainDescription, description } = req.body;
    const image = "/user/img/product/" + req.file.filename;

    const banner = new Banner({
      mainDescription,
      description,
      image,
    });

    await banner.save();

    res.redirect("/admin/homeSettings");
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while adding the banner" });
  }
};

const updateBanner = async (req, res) => {
  try {
    const { mainDescription, Description } = req.body;
    let updateObject = {
      mainDescription,
      Description,
    };

    if (req.file) {
      updateObject.image = "/user/img/product/" + req.file.filename;
    }

    await Banner.findByIdAndUpdate(req.body.id, updateObject);
    res.redirect("/admin/homeSettings");
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the banner" });
  }
};

const deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the banner" });
  }
};

const switchCoupon = async (req, res, next) => {
  try {
    const { couponId } = req.body;

    await Coupon.updateMany({}, { display_home: false });
    await Coupon.findByIdAndUpdate(couponId, { display_home: true });
    res.json({ message: "Coupon selected successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
module.exports = {
  getAdminLogin,
  postAdminLogin,
  getAdminSignup,
  postAdminSignup,
  adminDash,
  adminLogout,
  getUsers,
  blockUser,
  getBrands,
  addBrands,
  deleteBrand,
  getOrderManagement,
  switchStatus,
  vieworder,
  dataPerDate,
  salesReport,
  toggleBrandDisplay,
  getHomeSettings,
  addBanner,
  updateBanner,
  deleteBanner,
  switchCoupon,
};
