const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/users.js");
const User = require("../models/user.js");
// Use router.route() method

// Combine 1. Render Signup Form & 2. SignUp - POST        Common Path ("/signup")

router.route("/signup")
    .get( userController.renderSignupForm )
    .post( wrapAsync( userController.signup ));


// Combine 3. Render Login From &  4. Login - POST         Common Path = ("/login")

router.route("/login")
    .get( userController.renderLoginForm )
    .post( saveRedirectUrl, passport.authenticate("local", {failureRedirect:"/login", failureFlash: true}), wrapAsync( userController.login ) );

router.get("/logout", userController.logout);

module.exports = router;