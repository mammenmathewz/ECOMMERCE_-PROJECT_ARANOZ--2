
const Product = require("../models/products");
const Brand = require("../models/brand");
const Cart = require("../models/cart");
const { User } = require("../models/users");
const Order = require("../models/checkout");
const moment = require("moment");
const Razorpay = require('razorpay')


var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.API_KEY,
});


const getOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.productId",
      populate: {
        path: "brand",
      },
    }); // Populate the products in the cart

    console.log(user);
    console.log(cart);

    for (let item of cart.items) {
      const product = await Product.findById(item.productId);
      if (product.number < item.quantity) {
        req.flash(
          "error",
          "Some items in your cart are no longer available in the required quantity."
        );
        return res.redirect("/cart");
      }
    }

    res.render("user/checkout", { user: user, cart: cart }); // Pass the cart to the view
  } catch (err) {
    console.log(err);
  }
};

const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);

    const newAddress = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone: req.body.phone,
      address1: req.body.address1,
      address2: req.body.address2,
      district: req.body.district,
      state: req.body.state,
      pin: req.body.pin,
    };

    user.address.push(newAddress);

    await user.save();

    const redirectPage = req.body.redirect || "/checkout";
    res.status(200).redirect(redirectPage);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while adding the address.");
  }
};

// Handle cash on delivery orders
const cashOnDelivery = async (req, res) => {
  try {
    const userId = req.session.user;
  

    const cart = await Cart.findOne({ user: userId })
      .populate("user")
      .populate("items.productId");

    if (!cart) {
      return res.status(400).send("No cart found for this user");
    }

    const { selector, addressRadio } = req.body;

    const user = await User.findById(userId).populate("address");

    const selectedAddressIndex = user.address.findIndex(
      (address) => address._id.toString() === req.body.selectedAddress
    ); // Use addressRadio to get the selected address

    const newOrder = new Order({
      paymentMethod: selector,
      selectedAddress: selectedAddressIndex, 
      user: userId,
      items: cart.items,
      total: cart.total,
      discount: cart.discount,
      grandTotal: cart.grandTotal,
    });

    await newOrder.save();
    const order = await Order.findById(newOrder._id).populate(
      "items.productId"
    );

    for (let item of cart.items) {
      const product = await Product.findById(item.productId);
      product.number -= item.quantity;
      await product.save();
    }

    cart.items = [];
    cart.total = 0;
    cart.discount = 0;
    cart.grandTotal = 0;
    await cart.save();

    res.json({ redirectUrl: `/confirmation/${newOrder._id}` });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Handle online payment orders
const onlinePayment = async(req,res)=>{
  try{
    const userId = req.session.user;
    const orderId = req.body.orderId; 

    const cart = await Cart.findOne({ user: userId })
      .populate("user")
      .populate("items.productId");

    if (!cart) {
      return res.status(400).send("No cart found for this user");
    }

    const { selector, addressRadio } = req.body;

    const user = await User.findById(userId).populate("address");

    const selectedAddressIndex = user.address.findIndex(
      (address) => address._id.toString() === req.body.selectedAddress
    ); // Use addressRadio to get the selected address

    const newOrder = new Order({
      paymentMethod: selector,
      selectedAddress: selectedAddressIndex, 
      user: userId,
      items: cart.items,
      total: cart.total,
      discount: cart.discount,
      grandTotal: cart.grandTotal,
    });

    // Create a new order in Razorpay
    let options = {
      amount: cart.total,
      currency: "INR",
      receipt: `order_rcptid_${orderId}` // Use orderId here
    };
    let razorpayOrder = await instance.orders.create(options);
    newOrder.razorpayOrderId = razorpayOrder.id;
    newOrder.status = 'Awaiting Online Payment';

    await newOrder.save();
    const order = await Order.findById(newOrder._id).populate(
      "items.productId"
    );

    for (let item of cart.items) {
      const product = await Product.findById(item.productId);
      product.number -= item.quantity;
      await product.save();
    }

    cart.items = [];
    cart.total = 0;
    cart.discount = 0;
    cart.grandTotal = 0;
    await cart.save();

    // Send success response with the Razorpay order ID
    res.json({ orderId: orderId, razorpayOrderId: razorpayOrder.id }); // Use orderId here
  } catch(error){
    console.log(error);
  }
}

const getConfirmation = async (req, res) => {
  try {
    // Fetch the order with populated product details
    const order = await Order.findById(req.params.orderId).populate(
      "items.productId"
    );

    // Fetch the user
    const user = await User.findById(order.user);

    // Get the selected address using the index stored in selectedAddress
    const selectedAddress = user.address[order.selectedAddress];

    // Format the date using moment
    const formattedDate = moment(order.date).format("DD-MM-YYYY HH:mm");

    // Pass the user, order, selectedAddress, and formattedDate to the view
    res.render("user/confirmation", {
      user,
      order,
      selectedAddress,
      date: formattedDate,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  getOrder,
  addAddress,
  cashOnDelivery, 
  onlinePayment,
  getConfirmation,
};
