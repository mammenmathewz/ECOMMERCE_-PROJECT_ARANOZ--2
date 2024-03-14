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
const adminController = require('../controller/adminController');
const adminProductController = require('../controller/adminProductController')
const adminCouponController = require('../controller/adminCouponController')

adminRouter.use(flash());
adminRouter.use(bodyParser.json());
adminRouter.use(bodyParser.urlencoded({extended:true}));

adminRouter.get('/', auth.isAdminLogout,adminController.getAdminLogin)
adminRouter.post('/login',auth.isAdminLogout,adminController.postAdminLogin)
adminRouter.get('/signup',auth.isAdminLogout,adminController.getAdminSignup)
adminRouter.post('/signup',auth.isAdminLogout,adminController.postAdminSignup)
adminRouter.get('/dash',auth.isAdminLogin,adminController.adminDash)
adminRouter.get('/salesReport',auth.isAdminLogin,adminController.salesReport)
adminRouter.get('/logout',auth.isAdminLogin,adminController.adminLogout)
adminRouter.get('/users',auth.isAdminLogin,adminController.getUsers)
adminRouter.post('/block:userId',auth.isAdminLogin,adminController.blockUser)
adminRouter.get('/productmanagement',auth.isAdminLogin,adminProductController.getProducts)
adminRouter.get('/edit/:id',auth.isAdminLogin,adminProductController.editProduct)
adminRouter.post('/updateproduct/:productId', upload.array("images"), auth.isAdminLogin, adminProductController.updateProduct);
adminRouter.get('/addproduct',auth.isAdminLogin,adminProductController.addProduct)
adminRouter.post('/uploadeproduct', upload.single("image"), auth.isAdminLogin, adminProductController.uploadProduct);

adminRouter.delete('/deleteimage/:productId/:imageIndex',auth.isAdminLogin,adminProductController.deleteImage)
adminRouter.post('/delete-product/:id',auth.isAdminLogin,adminProductController.deleteProduct)
adminRouter.get('/brands',auth.isAdminLogin,adminController.getBrands)
adminRouter.post('/addbrand', auth.isAdminLogin, upload.single('brandImage'), adminController.addBrands);
adminRouter.post('/toggle-display/:brandId',auth.isAdminLogin,adminController.toggleBrandDisplay)

adminRouter.post('/delete-brand/:id',auth.isAdminLogin,adminController.deleteBrand)
adminRouter.get('/orders',auth.isAdminLogin,adminController.getOrderManagement)
adminRouter.post('/change-order-status/:id',adminController.switchStatus)
adminRouter.get('/vieworder/:orderId',auth.isAdminLogin,adminController.vieworder)
adminRouter.post('/dateData',auth.isAdminLogin,adminController.dataPerDate)
adminRouter.get('/coupons',auth.isAdminLogin,adminCouponController.getCoupon)
adminRouter.post('/addCoupons',auth.isAdminLogin,adminCouponController.postCoupon)
adminRouter.get('/editCoupon/:id',auth.isAdminLogin,adminCouponController.getCouponEdit)
adminRouter.post('/updateCoupon',auth.isAdminLogin,adminCouponController.updateCoupon) 
adminRouter.delete('/couponDelete', auth.isAdminLogin,adminCouponController.deleteCoupon)
adminRouter.get('/homeSettings',auth.isAdminLogin,adminController.getHomeSettings)
adminRouter.post('/addBanner',auth.isAdminLogin, upload.single('image'),adminController.addBanner)
adminRouter.post('/updateBanner',auth.isAdminLogin, upload.single('image'),adminController.updateBanner)
adminRouter.delete('/deletebanner/id=:id',auth.isAdminLogin,adminController.deleteBanner)

adminRouter.post("/select-coupon",auth.isAdminLogin,adminController.switchCoupon)

module.exports = adminRouter;