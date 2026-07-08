export const isLoggedIn = (req,res,next)=>{
    if(!req.session.userId){
        return res.redirect("/login");
    }
    next();
}

export const isLoggedOut = (req,res,next)=>{
    if(req.session.userId && req.session.isAuthenticated){
        return res.redirect("/home");
    }
    next();
}

export const canAccessOtp = (req, res, next) => {
    if (!req.session.otpPurpose) {
        return res.redirect("/signup");
    }

    next();
};