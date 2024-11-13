const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, isOwner, validateListing, hasCoordinates} = require("../middleware.js");

const listingController = require("../controllers/listings.js");

// Require multer for parsing "multipart/form-data"
const multer = require("multer");
const {storage} = require("../cloudConfig.js");  // Require cloudConfig

// File cloud chya storage la upload krne
const upload = multer({ storage }); 

// 2. New Route

router.get("/new", isLoggedIn, listingController.renderNewForm);

// 5. Edit Route

router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync( listingController.renderEditForm ));


// Use router.route method

// Combine 1. Index Route &  4. Create Route      Common Path ("/")

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn, upload.single('listing[image]'), validateListing, wrapAsync( listingController.createListing ));
    


// Combine 3. Show Route & 6. Update Route & 7. Delete Route        Common Path ("/:id")

router.route("/:id")
    .get(wrapAsync( listingController.showListing ))
    .put(isLoggedIn, isOwner, upload.single('listing[image]') , validateListing, wrapAsync( listingController.updateListing ))
    .delete(isLoggedIn, isOwner, wrapAsync( listingController.destroyListing ));

module.exports = router;