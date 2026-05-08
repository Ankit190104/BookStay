const express =require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing, isHost } = require("../middleware.js");

const listingController = require("../controllers/listings.js");
const multer = require('multer');

const {storage} = require("../cloudConfig.js");
const upload = multer({storage});




router.get("/dashboard", isLoggedIn, isHost, wrapAsync(listingController.renderDashboard));

// AI Chat Route
router.post("/:id/chat", wrapAsync(listingController.handleChat));
router.post("/:id/summarize-reviews", wrapAsync(listingController.summarizeReviews));

router.get("/sitemap", listingController.renderSitemap);

router.post("/generate-description", isLoggedIn, wrapAsync(listingController.generateDescription));

router.route("/")
.get(wrapAsync(listingController.index))
.post(
    isLoggedIn,
    isHost,
    upload.single("listing[image]"),
    validateListing, 
    wrapAsync(listingController.createListing));

// New Route
router.get("/new",isLoggedIn, isHost, listingController.renderNewForm);

router.route("/:id")
.get( wrapAsync(listingController.showListing))
.put(isLoggedIn, isOwner, isHost, upload.single("listing[image]"), validateListing, wrapAsync(listingController.updateListing))
.delete(isLoggedIn, isOwner, isHost, wrapAsync(listingController.destroyListing));




// Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, isHost, wrapAsync(listingController.renderEditForm));


module.exports = router;