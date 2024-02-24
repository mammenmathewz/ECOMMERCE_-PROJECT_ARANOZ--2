const Product = require('../models/products')
const Brand = require('../models/brand') 
const Cart = require('../models/cart')
const Coupon = require('../models/coupons')


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

    // Add your discount reset logic here
    if (cart.discount > 0) {
      const now = new Date();
      const discountDuration =   6*1000; // 5 minutes in milliseconds

      if (now - cart.discountAppliedAt > discountDuration || cart.items.length == 0) {
        cart.discount = 0;
        cart.grandTotal = cart.total;
        await cart.save();
      }
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
      req.flash('error', 'Product is already in the cart');
      return res.redirect(`/viewproduct/${productId}`);
    }

    // Fetch the product to get its price
    const product = await Product.findById(productId).populate('brand');
    const price = product.saleprice;

    // Add new product to the cart
    cart.items.push({ productId: productId, quantity: 1 });

    // Update the total price
    cart.total += price;

    // Update the grand total
    cart.grandTotal = cart.total - cart.discount;

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

    // Update the grand total
    cart.grandTotal = cart.total - cart.discount;

    // Remove the item from the cart
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);

    // If all items are removed, set the total price to 0
    if (cart.items.length === 0) {
      cart.total = 0;
      cart.grandTotal = 0; // Also set the grand total to 0
    }

    // Populate the productId in the cart
    await cart.populate('items.productId');

    await cart.save();
    res.json({ total: cart.total, grandTotal: cart.grandTotal, items: cart.items }); // Send back the updated total, grand total and items
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

    // Find the item to be incremented
    const item = cart.items.find(item => item.productId._id.toString() === productId);

    if (!item) {
      return res.status(404).send('Item not found in cart');
    }
  
    // Check if the product is out of stock
    if (item.quantity >= item.productId.number) {
      return res.status(400).json({
        message: `${item.productId.productname}  left ! `,
        availableQuantity: item.productId.number
      });
    }
    

    // Increment the quantity of the item
    item.quantity++;

    // Update the total price
    cart.total += item.productId.saleprice;  

    // Update the grand total
    cart.grandTotal = cart.total - cart.discount;

    await cart.save();
    res.json({ total: cart.total, grandTotal: cart.grandTotal });
  
  } catch(error){
    console.log(error);
  }
}

const decrement = async(req,res)=>{
  try{
    const userId = req.session.user._id;
    const productId = req.params.productId;
    let cart = await Cart.findOne({ user: userId }).populate('items.productId');

    if (!cart) {
      return res.status(404).send('Cart not found');
    }
  
    // Find the item to be decremented
    const item = cart.items.find(item => item.productId._id.toString() === productId);

    if (!item) {
      return res.status(404).send('Item not found in cart');
    }
  
    // Decrement the quantity of the item, but not below 1
    if (item.quantity > 1) {
      item.quantity--;
      // Update the total price
      cart.total -= item.productId.saleprice;  
    }

    // Update the grand total
    cart.grandTotal = cart.total - cart.discount;

    await cart.save();
    res.json({ total: cart.total, grandTotal: cart.grandTotal });
  
  } catch(error){
    console.log(error);
  }
}

// Server-side code
const applyCoupon = async(req,res)=>{
  const { code } = req.body; // assuming you're sending the coupon code in the request body
  const userId = req.session.user._id;

  try {
    const coupon = await Coupon.findOne({ code: code });

    // Check if the coupon exists
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Check if the coupon is valid (not expired and not deleted)
    if (coupon.expiry_date < new Date() || coupon.is_deleted) {
      return res.status(400).json({ message: 'Coupon is not valid' });
    }

    if (!coupon.users.includes(userId)) {
      coupon.users.push(userId);
      await coupon.save();
    } else {
      return res.status(400).json({ message: 'User has already used this coupon' });
    }

    const cart = await Cart.findOne({ user: userId });

    // Check if the cart exists
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Generate a random discount amount between coupon.discount and coupon.max_discount
    const discountAmount = Math.floor(Math.random() * (coupon.max_discount - coupon.discount) + coupon.discount);


    // Apply the discount to the cart
    cart.discount = discountAmount;
    cart.grandTotal = cart.total - discountAmount;

    // Update the discountAppliedAt field with the current date and time
    cart.discountAppliedAt = new Date();

    await cart.save();

    res.json({ message: 'Coupon applied successfully', grandTotal: cart.grandTotal, couponAmount:cart.discount, originalTotal: cart.total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}




module.exports={
    getCart,
    addCart,
    deleteItem,
    increment,
    decrement,
    applyCoupon
}