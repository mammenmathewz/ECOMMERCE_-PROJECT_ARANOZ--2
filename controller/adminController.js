const Admin = require('../models/admins');



const getAdminLogin = async(req,res)=>{
    try{
        res.render('admin/signin')
    } catch (error){
        console.log(error);
        res.send('Error occurred while fetching data')

    }
}

const postAdminLogin = async(req,res)=>{
    try {
        const { email, password } = req.body;
    
        // Find user by email
        const admin = await Admin.findOne({ email });
    
        if (!admin) {
        //   req.flash('info', 'User does not exist');
        //   req.flash('type', 'alert alert-danger');
          return res.status(401).redirect('/admin/');
        }
    
        // Validate password
        if (password !== admin.password) {
        //   req.flash('info', 'Invalide Password');
        //   req.flash('type', 'alert alert-danger');
          return res.status(401).redirect('/admin/');
          
        }
        else {
          // Set user session
          req.session.admin = admin;
          console.log(admin);
    
          // Redirect to account
          res.redirect('/admin/dash');
        }
      } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
      }
}

const getAdminSignup = async(req,res)=>{
    try{
        res.render('admin/signup')
    }  catch (error) {
        console.log(error);
        res.send('Error occurred while fetching data')
      }
}

const postAdminSignup = async(req,res)=>{
    const existingUser = await Admin.findOne({ email: req.body.email });
   if (existingUser) {
    //  req.flash('info', 'Admin already exists');
    //  req.flash('type', 'alert alert-danger');
     return res.redirect('signup');
     
   }
  try {
    // Get the data from the request body
    const { email, password } = req.body;

    // Create a new user with the provided email and password
    const admin = new Admin({
      email: email,
      password: password,
      
    });

    // Save the new user to the database
    await admin.save();

    // Redirect or respond as necessary
    res.redirect('/admin/dash');
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while signing up.');
  }
}

const adminDash = async(req,res)=>{
    try{
        res.render('admin/index')
    } catch (error){
        console.log(error);
        res.send('Error occurred while fetching data')
    }
}

const adminLogout = async(req,res)=>{
    try{
        if (req.session.admin) {
            req.session.admin = null;
            // req.flash('info', 'Logout succesfull');
            // req.flash('type', 'alert alert-primary');
            res.redirect('/admin');
          } else {
            res.redirect('/error');
          }
    } catch (error){
        console.log(error);
        res.send('Error occurred while fetching data')
    }
}

module.exports={
    getAdminLogin,
    postAdminLogin,
    getAdminSignup,
    postAdminSignup,
    adminDash,
    adminLogout

}