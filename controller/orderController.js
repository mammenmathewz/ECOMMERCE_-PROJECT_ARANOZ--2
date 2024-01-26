const Product = require('../models/products')
const Brand = require('../models/brand') 
const Cart = require('../models/cart')
const { User } = require('../models/users')
const Order = require('../models/checkout')

const getOrder = async(req,res)=>{
    try{
        const userId = req.session.user._id;
        const user = await User.findById(userId);
        const cart = await Cart.findOne({ user: userId }).populate({
            path: 'items.productId',
            populate: {
              path: 'brand'
            }
          });  // Populate the products in the cart
    
        console.log(user);
        console.log(cart);
    
        res.render('user/checkout', { user: user, cart: cart });  // Pass the cart to the view
      } catch (err){
        console.log(err);
      }
}

const addAddress = async(req,res)=>{
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
            pin: req.body.pin
        };

        user.address.push(newAddress);

     
        await user.save();

        // Continue with your checkout process...
        res.status(200).redirect('/checkout');
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while adding the address.');
    }
}

const confirmOrder = async(req,res)=>{
    try {
        // Get user ID from request body (or session, if authenticated)
        const userId = req.session.user

        // Fetch cart for user
        const cart = await Cart.findOne({ user: userId }).populate('user').populate('items.productId');
        
       
        if (!cart) {
            return res.status(400).send('No cart found for this user');
        }

        const { selector, addressRadio } = req.body;

        // Fetch user for address
        const user = await User.findById(userId).populate('address');

        const selectedAddressIndex = user.address.findIndex(address => address._id.toString() === req.body.selectedAddress); // Use addressRadio to get the selected address
        console.log(selectedAddressIndex);


        // Create new order with cart data and selected address
        const newOrder = new Order({
            paymentMethod: selector,
            selectedAddress: selectedAddressIndex,  // Include full address details
            user: userId,
            items: cart.items,
            total: cart.total,
            discount: cart.discount,
            grandTotal: cart.grandTotal,
            // Add other fields as necessary
        });

        // Save new order to database
        await newOrder.save();
        const order = await Order.findById(newOrder._id).populate('items.productId');

        // Optionally, clear the user's cart after successful order placement
        cart.items = [];
        cart.total = 0;
        cart.discount = 0;
        cart.grandTotal = 0;
        await cart.save();

        // Send success response
        res.redirect(`/confirmation/${newOrder._id}`);
    } catch (error) {
        // Handle errors
        res.status(500).send({ message: error.message });
    }
}


const getConfirmation = async(req,res)=>{
    try {
        // Fetch the order with populated product details
        const order = await Order.findById(req.params.orderId).populate('items.productId');

        // Fetch the user
        const user = await User.findById(order.user);

        // Get the selected address using the index stored in selectedAddress
        const selectedAddress = user.address[order.selectedAddress];

        // Pass the user, order, and selectedAddress to the view
        res.render('user/confirmation', { user, order, selectedAddress });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}



module.exports={
    getOrder,
    addAddress,
    confirmOrder,
    getConfirmation
}