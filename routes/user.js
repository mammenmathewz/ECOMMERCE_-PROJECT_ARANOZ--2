
const express = require('express');
const userRouter = express.Router();
const bodyParser = require('body-parser')
const flash = require('express-flash')


const auth = require('../middleware/auth')
userRouter.use(flash());
userRouter.use(bodyParser.json());
userRouter.use(bodyParser.urlencoded({extended:true}));

const userController = require('../controller/userController'); 


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
module.exports = userRouter;