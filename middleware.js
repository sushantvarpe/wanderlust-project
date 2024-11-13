const Listing = require("./models/listing");
const Review = require("./models/review.js");
const ExpressError = require("./utils/ExpressErrors.js");
const { listingSchema, reviewSchema } = require("./schema.js");


// 1. Middleware for Check Authenticate

module.exports.isLoggedIn = (req, res, next) => {
    // console.log(req.path, "..", req.originalUrl);
    if(!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to create Listing");
        res.redirect("/login");
    }else next();
}


// 2. Save redirectUrl to locals

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}


// 3. For Listing Authorization

module.exports.isOwner = async (req, res, next) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if(res.locals.currUser && !listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error", "You are not the Owner of the listing");
        return res.redirect(`/listings/${id}`);
    }else next();
}


// 4. Server side Validation for Listing ( Middleware )

module.exports.validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
    if(error) {
        // let errMsg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, error);
    }else next();
}


// 5. Server side validation for Review

module.exports.validateReview = (req, res, next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error) {
        // let errMsg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, error);
    }else next();
}


// 6. For Review Authorization

module.exports.isReviewAuthor = async (req, res, next) => {
    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId);
    if(!review.author._id.equals(res.locals.currUser._id)){
        req.flash("error", "You are not the Author of the Review");
        return res.redirect(`/listings/${id}`);
    }else next();
}