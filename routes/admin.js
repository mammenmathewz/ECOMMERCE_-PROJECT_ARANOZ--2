const express = require('express');
const adminRouter = express.Router();
const bodyParser = require('body-parser')
const multer = require('multer');
const flash = require('express-flash')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/user/img/product');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  });
  
  const upload = multer({ storage: storage });


const auth = require('../middleware/auth')
const adminController = require('../controller/adminController')

adminRouter.use(flash());
adminRouter.use(bodyParser.json());
adminRouter.use(bodyParser.urlencoded({extended:true}));

adminRouter.get('/', auth.isAdminLogout,adminController.getAdminLogin)
adminRouter.post('/login',auth.isAdminLogout,adminController.postAdminLogin)
adminRouter.get('/signup',auth.isAdminLogout,adminController.getAdminSignup)
adminRouter.post('/signup',auth.isAdminLogout,adminController.postAdminSignup)
adminRouter.get('/dash',auth.isAdminLogin,adminController.adminDash)
adminRouter.get('/logout',auth.isAdminLogin,adminController.adminLogout)
adminRouter.get('/users',auth.isAdminLogin,adminController.getUsers)
adminRouter.post('/block:userId',auth.isAdminLogin,adminController.blockUser)
adminRouter.get('/productmanagement',auth.isAdminLogin,adminController.getProducts)
adminRouter.get('/edit/:id',auth.isAdminLogin,adminController.editProduct)
adminRouter.post('/updateproduct/:productId', upload.array("images"), auth.isAdminLogin, adminController.updateProduct);
adminRouter.get('/addproduct',auth.isAdminLogin,adminController.addProduct)
adminRouter.post('/uploadeproduct', upload.array("images"),auth.isAdminLogin,adminController.uploadProduct)
adminRouter.delete('/deleteimage/:productId/:imageIndex',auth.isAdminLogin,adminController.deleteImage)
adminRouter.post('/delete-product/:id',auth.isAdminLogin,adminController.deleteProduct)
adminRouter.get('/brands',auth.isAdminLogin,adminController.getBrands)
adminRouter.post('/addbrand',auth.isAdminLogin,adminController.addBrands)
adminRouter.post('/delete-brand/:id',auth.isAdminLogin,adminController.deleteBrand)
module.exports = adminRouter;