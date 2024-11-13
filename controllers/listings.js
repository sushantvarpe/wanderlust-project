const Listing = require("../models/listing");

// Require Geocoding service

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const ExpressError = require("../utils/ExpressErrors");

// Require Access Token

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


// Add Coordinate after edit location

const addCoordinates = async (listing) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: listing.location,
      limit: 1,
    })
    .send();

  listing.geometry = response.body.features[0].geometry;
  return listing;
};


// 1. Index Route Callback


module.exports.index = async (req, res) => {

// Search Listing

  let search = req.query.search || "";
  let category = req.query.category || "";
  let allListings = [];

  if (category != "") {
    allListings = await Listing.find({ category: `${category}` });
  }
 else if (search !== "") {
    // allListings = await Listing.find({ title: { $regex: `\\b${search}`, $options: 'i' } }).populate("owner");
    // allListings = await Listing.find({
    //     $or: [
    //       { title: { $regex: `\\b${search}`, $options: 'i' } },
    //       { location: { $regex: `\\b${search}`, $options: 'i' } },
    //       { country: { $regex: `\\b${search}`, $options: 'i' } },
    //       { 'owner.username': { $regex: `\\b${search}`, $options: 'i' } }
    //     ]
    //   }).populate("owner").populate("reviews");
    allListings = await Listing.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "result",
        },
      },
      {
        $match: {
          $or: [
            { title: { $regex: `\\b${search}`, $options: "i" } },
            { location: { $regex: `\\b${search}`, $options: "i" } },
            { country: { $regex: `\\b${search}`, $options: "i" } },
            { "result.username": { $regex: `\\b${search}`, $options: "i" } },
            { category: { $regex: `\\b${search}`, $options: "i" } },
          ],
        },
      },
    ]);

    if (allListings.length === 0) {
      throw new ExpressError(404, "No match found");
    }
  } else {
    allListings = await Listing.find({});
  }

  res.render("listings/index.ejs", { allListings });
};



// 2. New Route

module.exports.renderNewForm = (req, res) => {

  res.render("listings/new.ejs");

};


// 3. Show Route

module.exports.showListing = async (req, res) => {
  

  let { id } = req.params;

  let listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

// Error Flash

  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
  return res.redirect("/listings");

  }

  // listing = await addCoordinates(listing);

  res.render("listings/show.ejs", { listing });

};
       
       
// 4. Create Route


module.exports.createListing = async (req, res, next) => {
  // let {title, description, image, price, country, location} = req.body;
  // if(!req.body.listing) {
  //     throw new ExpressError(400, "Send Valid Data");
  // }

// Cloudinary URL / Link save in MongoDb

  let url = req.file.path;
  let filename = req.file.filename;

  let newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = {
    url,
    filename,
  };

// Location che Co-ordinates Database madhe store krne

  newListing = await addCoordinates(newListing);
  await newListing.save();

  //console.log(listing);

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};


// 5. Edit Route


module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);

// Error Flash
  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
    res.redirect("/listings");
  }

// Change in Image Quality ( Edit Image )
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};


// 6. Update Route

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  // let {title, description, image, price, country, location} = req.body;
 
    // Update listing fields first
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });
 
 // If a new image is uploaded, update the image fields
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {
      url,
      filename,
    };
  }

  // Call addCoordinates only after updating listing fields
  listing = await addCoordinates(listing);
  await listing.save();

// Flash

  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
};


// 7. Delete Route

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  // let {title, description, image, price, country, location} = req.body;
  let deleted = await Listing.findByIdAndDelete(id);
  console.log(deleted);
  req.flash("success", "Listing Deleted");
  res.redirect(`/listings`);
};

