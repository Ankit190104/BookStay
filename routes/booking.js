const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const bookingController = require("../controllers/bookings");
const { isLoggedIn } = require("../middleware.js");

router.post("/listings/:id/book", isLoggedIn, wrapAsync(bookingController.createBooking));
router.get("/bookings", isLoggedIn, wrapAsync(bookingController.renderMyBookings));
router.patch("/bookings/:id/approve", isLoggedIn, wrapAsync(bookingController.approveBooking));
router.patch("/bookings/:id/reject", isLoggedIn, wrapAsync(bookingController.rejectBooking));
router.delete("/bookings/:id", isLoggedIn, wrapAsync(bookingController.destroyBooking));

module.exports = router;
