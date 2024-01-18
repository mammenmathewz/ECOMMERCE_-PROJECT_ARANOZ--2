
const isUserLogin = async(req,res,next)=>{
    try {
        if(req.session.user){
            next()
        }else{
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
    }
}
const isUserLogout = async(req,res,next)=>{
    try {
        if(req.session.user){
            res.redirect('/')
        }else{
            next()
        }
    } catch (error) {
        console.log(error.message);
    }
}
const isAdminLogin = async(req,res,next)=>{
    try {
        if(req.session.admin){
            next()
        }else{
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error.message);
    }
}
const isAdminLogout = async(req,res,next)=>{
    try {
        if(req.session.admin){
            res.redirect('/admin/dash')
        }else{
            next()
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isUserLogin,
    isUserLogout,
    isAdminLogin,
    isAdminLogout
}