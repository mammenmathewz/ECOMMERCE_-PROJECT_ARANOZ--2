require("dotenv").config();
const Admin = require("../models/admins");
const { User } = require("../models/users");
const Product = require("../models/products");
const Brand = require("../models/brand");
const Order = require("../models/checkout");
const Coupon = require("../models/coupons");
const Banner = require("../models/banners");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const { json } = require("express");


const getCoupon = async (req, res,next) => {
    try {
      const coupons = await Coupon.find();
      res.render("admin/coupons", {
        active: "coupons",
        coupons: coupons,
        moment: moment,
      });
    }  catch (error) {
      console.log(error);
      next(error); 
    }
  };
  
  const postCoupon = async (req, res) => {
    try {
      const {
        code,
        discount_type,
        discount_value,
        min_amount,
        max_discount,
        startDate,
        expiry_date,
      } = req.body;
  
      const existingCoupon = await Coupon.findOne({ code });
      if (existingCoupon) {
        return res
          .status(400)
          .json({ message: "A coupon with this code already exists" });
      }
  
      const coupon = new Coupon({
        code,
        discount_type,
        discount_value,
        min_amount,
        max_discount,
        startDate,
        expiry_date,
      });
      console.log(coupon);
      await coupon.save();
  
      res.redirect("/admin/coupons");
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "An error occurred while creating the coupon" });
    }
  };
  
  const getCouponEdit = async (req, res,next) => {
    console.log(req.params.id); 
  
    try {
      const coupon = await Coupon.findById(req.params.id);
      console.log(coupon);
  
      if (!coupon) {
        return res.status(404).send("Coupon not found");
      }
  
      res.render("admin/editeCoupon", { active: "coupons", coupon: coupon });
    }   catch (error) {
      console.log(error);
      next(error); 
    }
  };
  
  const updateCoupon = async (req, res,next) => {
    const {
      code,
      discount_value,
      min_amount,
      max_discount,
      startDate,
      expiry_date,
    } = req.body;
  
    try {
      const coupon = await Coupon.findOne({ code: code });
  
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
  
      coupon.discount_value = discount_value;
      coupon.min_amount = min_amount;
      coupon.max_discount = max_discount;
      coupon.startDate = new Date(startDate);
      coupon.expiry_date = new Date(expiry_date);
  
      await coupon.save();
  
      res.redirect("/admin/coupons");
    }  catch (error) {
      console.log(error);
      next(error); 
    }
  };
  
  const deleteCoupon = async (req, res, next) => {
    const { id } = req.body; 
  
    try {
      const result = await Coupon.deleteOne({ _id: id });
  
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Coupon not found" });
      }
  
      res.json({ message: "Coupon deleted successfully" });
    } catch (error) {
      console.log(error);
      next(error); 
    }
  };
  

  module.exports={
    getCoupon,
    postCoupon,
    getCouponEdit,
    updateCoupon,
    deleteCoupon,
  }