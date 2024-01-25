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
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if the product is already in the cart
    const productInCart = cart.items.find(item => item.productId.toString() === productId);
    if (productInCart) {
      return res.send('Product is already in the cart');
    }

    // Fetch the product to get its price
    const product = await Product.findById(productId).populate('brand');
    const price = product.saleprice;

  

    // Add new product to the cart
    cart.items.push({ productId: productId, quantity: 1 });

    // Update the total price
    cart.total += price;

    // Populate the productId in the cart
    await cart.populate('items.productId');

    await cart.save();

    res.redirect('/cart');
  } catch (error) {
    console.log(error);
    res.send('Error occurred while adding to cart');
  }
}

const deleteItem = async(req,res)=>{
  try {
    const userId = req.session.user._id;
    const productId = req.params.id;
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).send('Cart not found');
    }

    // Find the item to be removed
    const item = cart.items.find(item => item.productId.toString() === productId);
    if (!item) {
      return res.status(404).send('Item not found in cart');
    }

    // Fetch the product to get its price
    const product = await Product.findById(productId).populate('brand');
    const price = product.saleprice;

    // Subtract the total price of the item from the cart's total
    cart.total -= item.quantity * price;

    // Remove the item from the cart
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);

    // If all items are removed, set the total price to 0
    if (cart.items.length === 0) {
      cart.total = 0;
    }

    // Populate the productId in the cart
    await cart.populate('items.productId');

    await cart.save();
    res.json({ total: cart.total, items: cart.items }); // Send back the updated total and items
  } catch (error) {
    console.log(error);
    res.status(500).send('Error occurred while removing from cart');
  }
}

const increment = async(req,res)=>{
  try{
    const userId = req.session.user._id;
    const productId = req.params.productId;
    let cart = await Cart.findOne({ user: userId }).populate('items.productId');

    if (!cart) {
      return res.status(404).send('Cart not found');
    }
  
    console.log('Cart items:', cart.items.map(item => item.productId._id.toString()));

    // Find the item to be incremented
    const item = cart.items.find(item => item.productId._id.toString() === productId);

    if (!item) {
      return res.status(404).send('Item not found in cart');
    }
  
    // Increment the quantity of the item
    item.quantity++;
  

    // Update the total price
    cart.total += item.productId.saleprice;  

  
    await cart.save();
    res.json({ total: cart.total });
  
  } catch(error){
    console.log(error);
  }
}




module.exports={
    getCart,
    addCart,
    deleteItem,
    increment
}