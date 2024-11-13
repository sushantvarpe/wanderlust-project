// Require dotenv

if(process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressErrors.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

app.engine("ejs", ejsMate)


// Connect to Database

const db_url = process.env.ATLASDB_URL;

main()
    .then(()=>{
        console.log("connected to database");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    mongoose.connect(db_url);
}


// Ejs la set krnar

app.use(methodOverride("_method"));
app.use(express.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));



// Create Mongo Store

const store = MongoStore.create({
    mongoUrl: db_url,
    crypto: {
        secret: process.env.SECRET     // For encryption
    },
    touchAfter: 3600*24      // in seconds
});


// Error in Mongo Store

store.on("error", () => {
    console.log("ERROR in MONGO SESSION STORE", err);
})


// Create Session Options

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        // 7 days later cookies expire honyasathi
        expires: Date.now() + 1000*60*60*24*7,    // 1 week in mili seconds
        maxAge: 1000*60*60*24*7,
        httpOnly: true                // Prevent from cross scripting attack
    }
}


// Session & Flash la use krnya sathi

app.use(session(sessionOptions));
app.use(flash());


// Implement Passport

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Middleware for flash 

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;        // Store current user information
    next();
});




app.get("/", (req, res) => { res.redirect("/listings"); });


// 1. Listing Route

app.use("/listings", listingsRouter);


//  2. Review Route

app.use("/listings/:id/reviews", reviewsRouter);


// 3. User Route

app.use("/", userRouter);


// 1. Page not found error

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});


// Middleware for handle error

app.use((err, req, res, next) => {

    // de-construct express error
    let {statusCode=500, message="Something went wrong"} = err;
    res.status(statusCode).render("error.ejs", {err});
    // res.status(statusCode).send(message);
});


app.listen("8000", () => {
    console.log("server is listening to port: 8000");
}); 