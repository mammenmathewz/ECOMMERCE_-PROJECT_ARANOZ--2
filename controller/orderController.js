const Product = require('../models/products')
const Brand = require('../models/brand') 
const Cart = require('../models/cart')
const { User } = require('../models/users')

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
        // Assume user is logged in and session exists
        const user = await User.findById(req.session.user._id);

        // Create a new address
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

        // Add the address to the user's addresses
        user.address.push(newAddress);

        // Save the user
        await user.save();

        // Continue with your checkout process...
        res.status(200).redirect('/checkout');
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while adding the address.');
    }
}


module.exports={
    getOrder,
    addAddress
}