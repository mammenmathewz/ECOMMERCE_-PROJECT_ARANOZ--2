require("dotenv").config();
const { User } = require("../models/users");
const Product = require("../models/products");
const Brand = require("../models/brand");
const Order = require("../models/checkout");
const fs = require("fs");
const path = require("path");
const { json } = require("express");

const getProducts = async (req, res,next) => {
    try {
      const page = req.query.page || 1; // Get the page number from the query parameters
      const limit = 10; // Set the number of products per page
      const skip = (page - 1) * limit; // Calculate the number of products to skip
  
      // Fetch the products for the current page
      let product = await Product.find({ deleted: false })
        .skip(skip)
        .limit(limit)
        .populate("brand");
  
      // Calculate the total number of pages
      const count = await Product.countDocuments({ deleted: false });
      const pages = Math.ceil(count / limit);
  
      let brands = await Brand.find(); // Fetch the brands
  
      // Get the most ordered products
      const mostOrderedProducts = await getMostOrderedProducts();
  
      // Pass the products, current page, total pages, and most ordered products to the view
      res.render("admin/manageproducts", {
        product: product,
        brands: brands,
        active: "productmanagement",
        currentPage: page,
        pages,
        mostOrderedProducts: mostOrderedProducts.map((p) => p._id.toString()),
      });
    }   catch (error) {
      console.log(error);
      next(error); 
    }
  };
  
  const getMostOrderedProducts = async () => {
    return await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", total: { $sum: "$items.quantity" } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);
  };
  
  const editProduct = async (req, res,next) => {
    try {
      const id = req.params.id;
      const product = await Product.findById(id).populate("brand");
      const brands = await Brand.find();
      if (!product) {
        return res.status(404).send("Product not found");
      }
      res.render("admin/editproduct", {
        product: product,
        brands: brands,
        active: "productmanagement",
        selectedCategory: product.category,
      });
    }   catch (error) {
      console.log(error);
      next(error); 
    }
  };
  
  const updateProduct = async (req, res,next) => {
    try {
      console.log(req.body);
      // Validate the brand ID
      const brand = await Brand.findById(req.body.brand);
      if (!brand) {
        return res.status(400).send("Invalid brand ID.");
      }
  
      // Find the product by id
      const product = await Product.findById(req.params.productId);
      if (!product) {
        return res.status(404).send("Product not found.");
      }
  
      // Update the product details
      product.brand = req.body.brand;
      product.productname = req.body.productname;
      product.description = req.body.description;
      product.category = req.body.category;
      product.regularprice = req.body.regularprice;
      product.saleprice = req.body.saleprice;
      product.number = req.body.number;
  
      // If there are new images, add them to the product
      if (req.body.croppedImage) {
        // Check if req.body.croppedImage is an array
        if (Array.isArray(req.body.croppedImage)) {
          // If it's an array, iterate over it with forEach
          req.body.croppedImage.forEach((imageData) => {
            // Check if imageData is not empty
            if (imageData.trim() !== "") {
              // Save the image data to a file and get the file path
              const filePath = saveImageToFile(imageData);
  
              // Add the file path to the product images
              product.images.push("/user/img/product/" + filePath);
            }
          });
        } else {
          // If it's not an array, directly process the single image
          if (req.body.croppedImage.trim() !== "") {
            // Save the image data to a file and get the file path
            const filePath = saveImageToFile(req.body.croppedImage);
  
            // Add the file path to the product images
            product.images.push("/user/img/product/" + filePath);
          }
        }
      }
  
      // Save the updated product
      await product.save();
  
      res.redirect("/admin/productmanagement");
    }  catch (error) {
      console.log(error);
      next(error); 
    }
  };
  
  const addProduct = async (req, res,next) => {
    try {
      const brands = await Brand.find();
      res.render("admin/addproducts", { brands: brands, active: "addproduct" });
    }   catch (error) {
      console.log(error);
      next(error); 
    }
  };
  
  
  function saveImageToFile(base64String) {
    // Remove header from base64 string
    const base64Image = base64String.split(";base64,").pop();
  
    // Generate a unique filename
    const filename = Date.now() + ".png";
  
    // Create the path to the output file
    const filepath = path.join(
      __dirname,
      "../public/user/img/product/",
      filename
    );
  
    // Write the image file
    fs.writeFileSync(filepath, base64Image, { encoding: "base64" });
  
    return filename;
  }
  const uploadProduct = async (req, res,next) => {
    try {
      // Validate the brand ID
      const brand = await Brand.findById(req.body.brand);
      if (!brand) {
        return res.status(400).send("Invalid brand ID.");
      }
  
   
  
      const product = new Product({
        brand: req.body.brand,
        productname: req.body.productname,
        description: req.body.description,
        category: req.body.category,
        regularprice: req.body.regularprice,
        saleprice: req.body.saleprice,
        number: req.body.number,
        createdon: Date.now(),
      });
  
      if (req.body.croppedImage) {
        // Check if req.body.croppedImage is an array
        if (Array.isArray(req.body.croppedImage)) {
          // If it's an array, iterate over it with forEach
          req.body.croppedImage.forEach((imageData) => {
            // Check if imageData is not empty
            if (imageData.trim() !== "") {
              // Save the image data to a file and get the file path
              const filePath = saveImageToFile(imageData);
  
              // Add the file path to the product images
              product.images.push("/user/img/product/" + filePath);
            }
          });
        } else {
          // If it's not an array, directly process the single image
          if (req.body.croppedImage.trim() !== "") {
            // Save the image data to a file and get the file path
            const filePath = saveImageToFile(req.body.croppedImage);
  
            // Add the file path to the product images
            product.images.push("/user/img/product/" + filePath);
          }
        }
      }
  
      await product.save();
      res.redirect("/admin/addproduct");
    }   catch (error) {
      console.log(error);
      next(error); 
    }
  };
  
  const deleteImage = async (req, res,next) => {
    try {
      const productId = req.params.productId;
      const imageIndex = req.params.imageIndex;
  
      // Find the product by id
      const product = await Product.findById(productId);
  
      if (product) {
        // Remove the image at the specified index
        product.images.splice(imageIndex, 1);
  
        // Save the product with the updated images array
        await product.save();
  
        // Send a JSON response
        res.json({ message: "Image deleted successfully" });
      } else {
        res.status(404).json({ message: "Product not found" });
      }
    }  catch (error) {
      console.log(error);
      next(error); 
    }
  };
  
  const deleteProduct = async (req, res,next) => {
    try {
      const id = req.params.id;
      const product = await Product.findById(id);
      if (product) {
        product.deleted = true;
        await product.save();
        res.redirect("/admin/productmanagement");
      } else {
        res.send("Product not found");
      }
    }   catch (error) {
      console.log(error);
      next(error); 
    }
  };

  
  module.exports={
    getProducts,
    editProduct,
    updateProduct,
    addProduct,
    uploadProduct,
    deleteImage,
    deleteProduct,
  }