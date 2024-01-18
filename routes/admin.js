const express = require('express');
const adminRouter = express.Router();
const bodyParser = require('body-parser')


const auth = require('../middleware/auth')
const adminController = require('../controller/adminController')

adminRouter.use(bodyParser.json());
adminRouter.use(bodyParser.urlencoded({extended:true}));

adminRouter.get('/', auth.isAdminLogout,adminController.getAdminLogin)
adminRouter.post('/login',auth.isAdminLogout,adminController.postAdminLogin)
adminRouter.get('/signup',auth.isAdminLogout,adminController.getAdminSignup)
adminRouter.post('/signup',auth.isAdminLogout,adminController.postAdminSignup)
adminRouter.get('/dash',auth.isAdminLogin,adminController.adminDash)
adminRouter.get('/logout',auth.isAdminLogin,adminController.adminLogout)

module.exports = adminRouter;