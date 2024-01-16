const express = require('express');
const adminRouter = express.Router();
const bodyParser = require('body-parser')


const auth = require('../middleware/auth')

adminRouter.use(bodyParser.json());
adminRouter.use(bodyParser.urlencoded({extended:true}));

module.exports = adminRouter;