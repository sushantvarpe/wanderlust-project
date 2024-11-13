const Listing = require("../models/listing");
const Review = require("../models/review");

// Reviews Route

// 1. POST Review Route

// 1. Create Review Route

module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let review=  req.body.review;
    review.comment = review.comment.trim();
    let newReview = new Review(review);

    // Author of Review

    newReview.author = req.user._id;
    listing.reviews.push(newReview);
    
    await newReview.save();
    await listing.save();

    // Flash
    req.flash("success", "Review Created");

    console.log("new Reveiw saved");
    res.redirect(`/listings/${listing._id}`);
};


// 2. Delete Review Route

module.exports.destroyReview = async (req, res) => {
    let {id, reviewId} = req.params;

    // Listing madhil review id delete krnyasathi
    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
   
    // Flash
    req.flash("success", "Review Deleted");

    res.redirect(`/listings/${id}`);
};