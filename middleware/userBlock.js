const { User } = require("../models/users");

const blockUser = async (req, res, next) => {
    try {
      const userId = req.session.user._id;
      const user = await User.findById(userId);
      if (user.block) {
        // Send a response if user is blocked
        return res.status(403).json({ message: "User is blocked please contact us" });
        
      } else {
        next();
      }
    } catch (error) {
      console.log(error);
    }
  };
  


module.exports={
    blockUser
}