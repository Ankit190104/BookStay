const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");

const userController = require("../controllers/users.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });


router.route("/signup")
.get( userController.renderSignupForm)
.post(wrapAsync(userController.signup));

router.route("/login")
.get(userController.renderLoginForm)
.post(saveRedirectUrl, passport.authenticate("local", {failureRedirect: '/login', failureFlash: true}), userController.login);


router.get("/logout", userController.logout);

router.post("/wishlist/:id", wrapAsync(userController.toggleWishlist));

router.get("/wishlist", wrapAsync(userController.renderWishlist));

router.get("/profile", isLoggedIn, wrapAsync(userController.renderProfile));

router.get("/profile/edit", isLoggedIn, wrapAsync(userController.renderEditProfile));

router.route("/change-password")
.get(isLoggedIn, userController.renderChangePasswordForm)
.post(isLoggedIn, wrapAsync(userController.changePassword));

router.put("/profile", isLoggedIn, upload.single("image"), wrapAsync(userController.updateProfile));

router.get("/planner", isLoggedIn, userController.renderPlanner);
router.post("/planner/generate", isLoggedIn, wrapAsync(userController.generateItinerary));

router.delete("/profile", isLoggedIn, wrapAsync(userController.deleteAccount));

module.exports = router;