const Product = require('../models/products')
const Brand = require('../models/brand') 
const Cart = require('../models/cart')

const getCart = async(req, res) => {
  try {
    const userId = req.session.user._id; // Get the user's id from the session
    let cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.productId',
        populate: {
          path: 'brand'
        }
      }); // Find the cart by userId and populate productId and brand

    if (!cart) {
      return res.status(404).send('Cart not found');
    }

    res.render('user/cart', { cart: cart }); // Pass the cart to the view
  } catch (error) {
    console.log(error);
    res.send('Error occurred while fetching the cart');
  }
}

  

const addCart = async(req, res) => {
    try {
      const userId = req.session.user._id;
      const productId = req.params.id;
      console.log(userId,  productId);
      let cart = await Cart.findOne({ user: userId }); // Find the cart by userId
  
      // If the cart does not exist, create a new one
      if (!cart) {
        cart = new Cart({ user: userId, items: [] });
      }
  
      // Add new product to the cart
      cart.items.push({ productId: productId, quantity: 1 });
  
      await cart.save(); // Save the cart
      res.redirect('/cart'); // Redirect to the home page
    } catch (error) {
      console.log(error);
      res.send('Error occurred while adding to cart');
    }
  }
  

module.exports={
    getCart,
    addCart
}