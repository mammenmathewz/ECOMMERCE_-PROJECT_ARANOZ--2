var express = require('express');
var router = express.Router();
const Brand = require('/Users/mamme/BROCAMP PROJECTS/ECOMMERCE_ PROJECT/models/brand') 

router.use(express.json());
router.use(express.urlencoded({ extended: true }));



router.get('/', async (req, res) => {
    try {
      // Fetch the brands from the database
      const brands = await Brand.find();
  
      // Render the view and pass the brands to it
      res.render('admin/brand', { brands: brands });
    } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred while fetching the brands.');
    }
  });
  



router.post('/addBrand', async (req, res) => {

    console.log(req.body);
    const brandName = req.body.name;

    
 // make sure 'name' matches the form input field name
  
    // Create a new brand
    const brand = new Brand({ name: brandName });
  
    try {
      // Save the brand to the database
      await brand.save();
  
      // Fetch the updated list of brands
      const brands = await Brand.find();
  
      // Send the updated list of brands back to the client
      res.json(brands);
    } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred while saving the brand.');
    }
  });


  router.post('/delete/:id', async (req, res) => {
    try {
      await Brand.findByIdAndDelete(req.params.id);
      res.redirect('/admin/brand');
    } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred while deleting the brand.');
    }
});

  


module.exports = router;
