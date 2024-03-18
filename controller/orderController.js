const Product = require("../models/products");
const Brand = require("../models/brand");
const Cart = require("../models/cart");
const Coupon = require("../models/coupons");
const { User, Address } = require("../models/users");
const Order = require("../models/checkout");
const moment = require("moment");
const Razorpay = require("razorpay");
const crypto = require("crypto");

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.API_KEY,
});

const getOrder = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const justuser = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.productId",
      populate: {
        path: "brand",
      },
    }); // Populate the products in the cart
    if (justuser.block) {
      // Redirect if user not found or user is blocked
      req.flash("info", "Please contact us");
      req.flash("type", "alert alert-danger");
      req.session.user = null;
      return res.redirect("/login");
    }
if (cart.items==0) {
  req.flash(
    "error",
    "Cart is empty"
  );
  return res.redirect("/cart");
}

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

    res.render("user/checkout", {
      justuser: justuser,
      cart: cart,
      addMoneySuccess: req.query.addMoneySuccess,
    }); // Pass the cart to the view
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const addAddress = async (req, res, next) => {
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
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Handle cash on delivery orders
const cashOnDelivery = async (req, res, next) => {
  try {
    const userId = req.session.user;

    const cart = await Cart.findOne({ user: userId })
      .populate("user")
      .populate("items.productId");

    if (!cart) {
      return res.status(400).send("No cart found for this user");
    }

    // Check if the cart exists and has a coupon applied

    const { selector, addressRadio } = req.body;

    const user = await User.findById(userId).populate("address");

    if (user.block) {
      // Redirect if user not found or user is blocked
      req.flash("info", "Please contact us");
      req.flash("type", "alert alert-danger");
      req.session.user = null;
      return res.json({ redirectUrl: `/login` });
    }

    const selectedAddressIndex = user.address.findIndex(
      (address) => address._id.toString() === req.body.selectedAddress
    );

    const newOrder = new Order({
      paymentMethod: selector,
      selectedAddress: selectedAddressIndex,
      user: userId,
      items: cart.items,
      total: cart.total,
      discount: cart.discount,
      grandTotal: cart.grandTotal,
      paymentMethod: "COD",
      paymentStatus: "COD",
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

    if (cart && cart.couponCode) {
      
      const coupon = await Coupon.findOne({ code: cart.couponCode });

      if (coupon && !coupon.users.includes(userId)) {
        coupon.users.push(userId);
        await coupon.save();
      }

      // Remove the coupon from the cart
      cart.couponCode = null;
      cart.discount = 0;
      cart.grandTotal = cart.total;
    }
    

    cart.items = [];
    cart.total = 0;
    cart.discount = 0;
    cart.grandTotal = 0;
    await cart.save();

    res.json({ redirectUrl: `/confirmation/${newOrder._id}` });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const walletPayment = async (req, res, next) => {
  try {
    const userId = req.session.user;

    const cart = await Cart.findOne({ user: userId })
      .populate("user")
      .populate("items.productId");

    if (!cart) {
      return res.status(400).send("No cart found for this user");
    }
    if (cart.grandTotal !== 0) {
      console.log(true);
      return res.json({
        redirectUrl:
          "/checkout?flashMessage=please add money from wallet to continue",
      });
    }

    const { selector, addressRadio } = req.body;

    const user = await User.findById(userId).populate("address");
    if (user.block) {
      // Redirect if user not found or user is blocked
      req.flash("info", "Please contact us");
      req.flash("type", "alert alert-danger");
      req.session.user = null;
      return res.json({ redirectUrl: `/login` });
    }
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
      paymentMethod: "Wallet",
      paymentStatus: "Paid",
      walletAmount : cart.walletAmount
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
    if (cart && cart.couponCode) {
      // Fetch the coupon
      const coupon = await Coupon.findOne({ code: cart.couponCode });

      // Add the user to the list of users who have used the coupon
      if (coupon && !coupon.users.includes(userId)) {
        coupon.users.push(userId);
        await coupon.save();
      }
     
      cart.couponCode = null;
      cart.discount = 0;
      cart.grandTotal = cart.total;
    }
    user.transactions.push({
      amount: cart.walletAmount,
      type: "debit",
    });
    await user.save()

    cart.walletAmount=0
    cart.items = [];
    cart.total = 0;
    cart.discount = 0;
    cart.grandTotal = 0;
    await cart.save();

    res.json({ redirectUrl: `/confirmation/${newOrder._id}` });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const generateOrderid = async (req, res, next) => {
  try {
    const userId = req.session.user;
    console.log("user..." + req.session.user);
    console.log("userid::" + userId);

    var options = {
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: "order_rcptid_" + Math.random().toString(36).substring(7),
    };

    instance.orders.create(options, async function (err, order) {
      if (err) {
        return res.status(500).send({ message: err.message });
      }

      const cart = await Cart.findOne({ user: userId })
        .populate("user")
        .populate("items.productId");
      if (!cart) {
        return res.status(400).send("No cart found for this user");
      }

      const { selector, addressRadio, selectedAddress, paymentMethod } =
        req.body;
      console.log(req.body);
      const user = await User.findById(userId).populate("address");
      const selectedAddressIndex = user.address.findIndex(
        (address) => address._id.toString() === req.body.selectedAddress
      );

      // Save the order in the database
      const newOrder = new Order({
        orderId: order.id,
        selectedAddress: selectedAddressIndex,
        paymentMethod: paymentMethod,
        user: userId,
        items: cart.items,
        total: cart.total,
        discount: cart.discount,
        grandTotal: cart.grandTotal,
        walletAmount : cart.walletAmount
      });

      try {
        await newOrder.save();
        console.log("Order created with ID:", newOrder._id);
        req.session.orderId = newOrder._id;
        console.log("Order ID saved to session:", req.session.orderId);
      } catch (error) {
        console.log(error);
      }

      res.json({ orderId: order.id });
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const verify = async (req, res, next) => {
  try {
    const secret = instance.key_secret; // Replace with your Razorpay secret key
    const userId = req.session.user;
    const user = await User.findById(userId);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const orderId = req.session.orderId;

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      // Payment is successful, update the order status
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = "Paid";
        await order.save();

        // Reduce product quantities and clear the cart
        const cart = await Cart.findOne({ user: userId }).populate(
          "items.productId"
        );
        for (let item of cart.items) {
          const product = await Product.findById(item.productId);
          product.number -= item.quantity;
          await product.save();
        }

        // Check if the cart exists and has a coupon applied
        if (cart && cart.couponCode) {
          // Fetch the coupon
          const coupon = await Coupon.findOne({ code: cart.couponCode });

          // Add the user to the list of users who have used the coupon
          if (coupon && !coupon.users.includes(userId)) {
            coupon.users.push(userId);
            await coupon.save();
          }

          // Remove the coupon from the cart
          cart.couponCode = null;
          cart.discount = 0;
          cart.grandTotal = cart.total;
        }
        user.transactions.push({
          amount: cart.walletAmount,
          type: "debit",
        });
        await user.save()

        cart.walletAmount=0
        cart.items = [];
        cart.total = 0;
        await cart.save();
      }
      let redirectUrl = `/confirmation/${orderId}`;
      res.json({ redirectUrl: redirectUrl });
    } else {
      // Signature verification failed, check the payment status

      const order = await Order.findById(orderId);
      if (order && order.paymentStatus !== "Paid") {
        try {
          await Order.deleteOne({ _id: orderId });
        } catch (error) {
          console.log("Error deleting order:", error);
        }
      }
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const addFromWallet = async (req, res, next) => {
  try {
    const userId = req.session.user._id;

    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId });

    if (!user || !cart) {
      return res.status(404).json({ message: "User or cart not found" });
    }
    if (user.wallet==0) {
      return res.status(200).json({ message: "Wallet is empty, try another payment methods" });
    }
    if (cart.grandTotal==0) {
      return res.status(200).json({ message: "Wallet already applied. Please confirm your order." });
    }
    // check if wallet amount is greater than the grandTotal
    if (user.wallet >= cart.grandTotal) {
      // subtract grandTotal from user's wallet
      user.wallet -= cart.grandTotal;
      cart.grandTotal = 0;
      cart.walletAmount+=cart.total - cart.discount
    
    } else {
      // subtract from grandTotal and save on a new field on cart
      cart.grandTotal -= user.wallet;
      cart.walletAmount+=user.wallet
      user.wallet = 0;
    }

    await user.save(); // Save the updated user
    await cart.save(); // Save the updated cart

    res.json({ message: "Transaction successful. Redirecting to checkout." });
  } catch (error) {
    console.log(error);
    next(error);
  }
};



const getConfirmation = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      "items.productId"
    );

    const user = await User.findById(order.user);
    const selectedAddress = user.address[order.selectedAddress];
    const formattedDate = moment(order.date).format("DD-MM-YYYY HH:mm");

    // Pass the user, order, selectedAddress, and formattedDate to the view
    res.render("user/confirmation", {
      user,
      order,
      selectedAddress,
      date: formattedDate,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  getOrder,
  addAddress,
  cashOnDelivery,
  generateOrderid,
  verify,
  addFromWallet,
  getConfirmation,
  walletPayment,
};
