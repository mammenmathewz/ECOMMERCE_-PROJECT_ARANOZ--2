
const express = require('express');
const userRouter = express.Router();
const bodyParser = require('body-parser')
const flash = require('express-flash')


const auth = require('../middleware/auth')
userRouter.use(flash());
userRouter.use(bodyParser.json());
userRouter.use(bodyParser.urlencoded({extended:true}));

const userController = require('../controller/userController'); 
const cartController = require('../controller/cartController')
const orderController = require('../controller/orderController')


userRouter.get('/',userController.getHome)
userRouter.get('/products',userController.getProducts)
userRouter.get('/viewproduct/:id',userController.getProduct)
userRouter.get('/login',auth.isUserLogout,userController.getLogin)
userRouter.post('/login',auth.isUserLogout,userController.postLogin)
userRouter.get('/account',auth.isUserLogin,userController.getAccount)
userRouter.get('/logout',auth.isUserLogin,userController.userLogout)
userRouter.get('/signup',auth.isUserLogout,userController.getSignup)
userRouter.post('/signup',auth.isUserLogout,userController.postSignup)
userRouter.post('/generateOtp',auth.isUserLogout,userController.postOtp)
userRouter.get('/cart',auth.isUserLogin,cartController.getCart)
userRouter.post('/addcart/:id', auth.isUserLogin, cartController.addCart);
userRouter.delete('/removeFromCart/:id', auth.isUserLogin, cartController.deleteItem);
userRouter.put('/incrementQuantity/:productId',auth.isUserLogin,cartController.increment)
userRouter.put('/decrementQuantity/:productId',auth.isUserLogin,cartController.decrement)
userRouter.get('/checkout',auth.isUserLogin,orderController.getOrder)
userRouter.post('/addAddress',auth.isUserLogin,orderController.addAddress)
userRouter.post('/confirmOrder',auth.isUserLogin,orderController.cashOnDelivery)
userRouter.post('/confirmWalletPayment',auth.isUserLogin,orderController.walletPayment)
userRouter.post('/create/orderId',auth.isUserLogin,orderController.generateOrderid)
userRouter.post('/paymentverify',auth.isUserLogin,orderController.verify)

userRouter.get('/confirmation/:orderId',auth.isUserLogin,orderController.getConfirmation)
userRouter.get('/myorder',auth.isUserLogin,userController.myOrder)
userRouter.post('/getOrderDetails',auth.isUserLogin,userController.generateOrderid)

userRouter.get('/editUser/:userId/address/:addressId', auth.isUserLogin, userController.editUser);
userRouter.post('/reset-password',auth.isUserLogout,userController.resetPassword)
userRouter.post('/updateaddress/:userId/address/:addressId',auth.isUserLogin,userController.updateAddress)
userRouter.delete('/deleteaddress/:userId/address/:addressId', auth.isUserLogin, userController.deleteAddress);
userRouter.get('/vieworder',auth.isUserLogin,userController.viewOrder)
userRouter.get('/changepass',auth.isUserLogin,userController.changePassword_Profile)
userRouter.post('/newpassword',auth.isUserLogin,userController.resetPasswordWithoutOTP)
userRouter.get('/filterAndSortProducts',userController.filterAndSortProducts)
userRouter.put('/applyCoupon',auth.isUserLogin,cartController.applyCoupon)
userRouter.get('/wallet',auth.isUserLogin,userController.getWallet)
userRouter.get('/addFromWallet',auth.isUserLogin,orderController.addFromWallet)




module.exports = userRouter;