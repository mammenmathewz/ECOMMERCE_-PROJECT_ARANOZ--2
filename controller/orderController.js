
const Product = require("../models/products");
const Brand = require("../models/brand");
const Cart = require("../models/cart");
const { User } = require("../models/users");
const Order = require("../models/checkout");
const moment = require("moment");
const Razorpay = require('razorpay')
const crypto = require('crypto')


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
    console.log("userid:"+userId);
  

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
      paymentStatus : 'COD'
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


// const generateOrderid = async(req,res)=>{
//   try {
//     var options = {
//       amount: req.body.amount * 100,  // amount in the smallest currency unit
//       currency: "INR",
//       receipt: "order_rcptid_" + Math.random().toString(36).substring(7)
//     };
    
//     instance.orders.create(options, function(err, order) {
//       if (err) {
//         return res.status(500).send({ message: err.message });
//       }

//       res.json({ orderId: order.id });
//     });

//   } catch (error) {
//     console.log(error);
//   }
// }

// const verify = async(req,res)=>{
//   try {
//         const secret = 'YOUR_SECRET'; // Replace with your Razorpay secret key
//         const userId = req.session.user;

//     // Extract the order details from the request body
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     // Generate the hmac
//     const generated_signature = crypto.createHmac('sha256', secret).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');

//     if (generated_signature === razorpay_signature) {
//         // Payment is successful

//         // Find the cart for the user
//         const cart = await Cart.findOne({ user: userId }).populate("user").populate("items.productId");
//         if (!cart) {
//             return res.status(400).send("No cart found for this user");
//         }

//         const { selector, addressRadio } = req.body;
//         const user = await User.findById(userId).populate("address");
//         const selectedAddressIndex = user.address.findIndex((address) => address._id.toString() === req.body.selectedAddress);

//         // Create a new order document
//         const newOrder = new Order({
//             paymentMethod: selector,
//             selectedAddress: selectedAddressIndex, 
//             user: userId,
//             items: cart.items,
//             total: cart.total,
//             discount: cart.discount,
//             grandTotal: cart.grandTotal,
//         });

//         // Save the order document in the database
//         try {
//             await newOrder.save();
//             const order = await Order.findById(newOrder._id).populate("items.productId");

//             for (let item of cart.items) {
//                 const product = await Product.findById(item.productId);
//                 product.number -= item.quantity;
//                 await product.save();
//             }

//             cart.items = [];
//             cart.total = 0;
//             cart.discount = 0;
//             cart.grandTotal = 0;
//             await cart.save();

//             res.json({ redirectUrl: `/confirmation/${newOrder._id}` });
//         } catch (error) {
//             res.status(500).send({ message: error.message });
//         }
//     } else {
//         // Payment verification failed
//         res.status(400).send('Payment verification failed');
//     }
//   } catch (error) {
//     console.log(error);
//   }
// }


/////////////////////////////////////////////////////////////////////////////


const generateOrderid = async(req,res)=>{
  try {
    const userId = req.session.user;
    console.log("user..."+req.session.user);
    console.log("userid::"+userId);

    var options = {
      amount: req.body.amount * 100,  
      currency: "INR",
      receipt: "order_rcptid_" + Math.random().toString(36).substring(7)
    };
    
    instance.orders.create(options, async function(err, order) {
      if (err) {
        return res.status(500).send({ message: err.message });
      }

      const cart = await Cart.findOne({ user: userId }).populate("user").populate("items.productId");
      if (!cart) {
          return res.status(400).send("No cart found for this user");
      }

      const { selector, addressRadio, selectedAddress, paymentMethod } = req.body;
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
      });

      try {
        await newOrder.save();
        console.log('Order created with ID:', newOrder._id);
        req.session.orderId = newOrder._id;
        console.log('Order ID saved to session:', req.session.orderId);
      } catch (error) {
        console.log(error);
      }

      res.json({ orderId: order.id });
    });

  } catch (error) {
    console.log(error);
  }
}

const verify = async(req,res)=>{
  try {
    const secret = instance.key_secret; // Replace with your Razorpay secret key
    const userId = req.session.user;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const orderId = req.session.orderId;

    console.log('secret:', secret);
    console.log('razorpay_order_id:', razorpay_order_id);
    console.log('razorpay_payment_id:', razorpay_payment_id);
    console.log('Order ID retrieved from session:', orderId);

    const generated_signature = crypto.createHmac('sha256', secret).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
    
    console.log('razorpay_signature:', razorpay_signature);


    if (generated_signature === razorpay_signature) {
      // Payment is successful, update the order status
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'Paid';
        await order.save();
    
        // Reduce product quantities and clear the cart
        const cart = await Cart.findOne({ user: userId }).populate("items.productId");
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
      }
      let redirectUrl = `/confirmation/${orderId}`;
      res.json({ redirectUrl: redirectUrl });
      console.log("url:" + redirectUrl);

    } else {
      // Signature verification failed, check the payment status
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus !== 'Paid') {
        try {
          console.log(orderId);
          await Order.deleteOne({ _id: orderId });
        } catch (error) {
          console.log('Error deleting order:', error);
        }
      }
     
    }
   
 


  } catch (error) {
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
  generateOrderid,
  verify,
  getConfirmation,
};
