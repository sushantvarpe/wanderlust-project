const User = require("../models/user");


// 1. Render SignUp Form

// 1. SignUp - GET

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

// 2. Sign Up Route

// 2. SignUp - POST

module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        let newUser = new User({email, username});
        let registerdUser = await User.register(newUser, password);
        console.log(registerdUser);
        req.login(registerdUser, (err) => {
            if(err) return next(err);
            else{
                req.flash("success", "Welcome to Wanderlust!");
                res.redirect("/listings");
            }
        }) 
    }catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
};

    
// 3. Render Login Form

// 3. Login - GET


module.exports.renderLoginForm = (req, res)=> {
    res.render("users/login.ejs");
};

// 4. Login - POST

module.exports.login = async (req, res, next) => {

    // Flash
    req.flash("success", "Welcome to Wanderlust! you are logged in");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};


// 5. LogOut Route

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if(err) next(err);
        else {
            req.flash("success", "You are logged out now");
            res.redirect("/listings");
        }
    });
};