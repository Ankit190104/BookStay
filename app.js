if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRouter = require("./routes/booking.js");

const dbUrl = process.env.LOCALDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// Session config
const sessionOptions = {
    store: MongoStore.create({
        mongoUrl: dbUrl,
        crypto: {
            secret: process.env.SECRET,
        },
        touchAfter: 24 * 3600,
    }),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

async function main() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to Local DB");
    } catch (err) {
        console.log("Local DB connection error:", err);
        process.exit(1);
    }
}

main().then(() => {
    app.use(session(sessionOptions));
    app.use(flash());

    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(User.authenticate()));

    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    app.use((req, res, next) => {
        res.locals.success = req.flash("success");
        res.locals.error = req.flash("error");
        res.locals.currUser = req.user;
        next();
    });

    // Routes
    app.get("/", (req, res) => {
    res.redirect("/listings");
});

    app.use("/listings", listingRouter);
    app.use("/listings/:id/reviews", reviewRouter);
    app.use("/", userRouter);
    app.use("/", bookingRouter);

    // Static Pages
    app.get("/privacy", (req, res) => res.render("pages/privacy.ejs"));
    app.get("/terms", (req, res) => res.render("pages/terms.ejs"));
    app.get("/contact", (req, res) => res.render("pages/contact.ejs"));

    // Error Handling
    app.use((req, res, next) => {
        next(new ExpressError(404, "Page not found!"));
    });

    app.use((err, req, res, next) => {
        const { statusCode = 500, message = "Something went wrong" } = err;
        res.status(statusCode).render("error.ejs", { message });
    });

    app.listen(8080, () => {
        console.log("server is listening to port 8080");
    });
});