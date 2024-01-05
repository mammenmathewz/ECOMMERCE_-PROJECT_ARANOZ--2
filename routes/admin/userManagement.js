
var express = require('express');
const session = require('express-session');
var router = express.Router();
const User = require('/Users/mamme/BROCAMP PROJECTS/ECOMMERCE_ PROJECT/models/users')




router.get('/', async(req,res)=>{
   try {
    if (req.session.admin) {
        let users = await User.find({});
        res.render('admin/usermanag', { users: users });
        
       }else{
        res.redirect('/admin')
       }
   } catch (error) {
    console.error(err);
    res.send('Error occurred while fetching data');
   }
})

// router.post('/blockUser/:userId', async (req, res) => {
//     try {
//         let user = await User.findById(req.params._id);
//         user.block = true;
//         await user.save();
//         res.json({ success: true });
//     } catch(err) {
//         console.error(err);
//         res.json({ success: false });
//     }
// });


module.exports = router;

