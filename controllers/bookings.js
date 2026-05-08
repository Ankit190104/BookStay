const Listing = require("../models/listing");
const Booking = require("../models/booking");

module.exports.createBooking = async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to book a stay!");
        return res.redirect("/login");
    }

    const { id } = req.params;
    const { checkIn, checkOut, guests } = req.body;
    
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    if (listing.owner && listing.owner.equals(req.user._id)) {
        req.flash("error", "You cannot book your own listing!");
        return res.redirect(`/listings/${id}`);
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    // Check availability
    const existingBookings = await Booking.find({
        listing: id,
        $or: [
            { checkIn: { $lt: end }, checkOut: { $gt: start } }
        ]
    });

    if (existingBookings.length > 0) {
        req.flash("error", "These dates are already booked. Please choose different dates!");
        return res.redirect(`/listings/${id}`);
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
        req.flash("error", "Invalid dates selected!");
        return res.redirect(`/listings/${id}`);
    }

    const totalPrice = (diffDays * listing.price) + 1700; // base + fees

    const newBooking = new Booking({
        listing: id,
        user: req.user._id,
        checkIn: start,
        checkOut: end,
        totalPrice,
        guests: parseInt(guests) || 1
    });

    await newBooking.save();
    req.flash("success", "Booking request sent! Waiting for host approval.");
    res.redirect("/bookings");
};

module.exports.renderMyBookings = async (req, res) => {
    let bookings = await Booking.find({ user: req.user._id }).populate("listing");
    // Filter out bookings whose listings have been deleted
    bookings = bookings.filter(booking => booking.listing !== null);
    res.render("users/bookings.ejs", { bookings });
};

module.exports.approveBooking = async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate("listing");
    
    if (!booking || !booking.listing) {
        req.flash("error", "Booking or listing not found!");
        return res.redirect("/listings/dashboard");
    }

    if (!booking.listing.owner.equals(req.user._id)) {
        req.flash("error", "You don't have permission to do that!");
        return res.redirect("/listings/dashboard");
    }

    booking.status = "confirmed";
    await booking.save();
    req.flash("success", "Booking approved!");
    res.redirect("/listings/dashboard");
};

module.exports.rejectBooking = async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate("listing");
    
    if (!booking || !booking.listing) {
        req.flash("error", "Booking or listing not found!");
        return res.redirect("/listings/dashboard");
    }

    if (!booking.listing.owner.equals(req.user._id)) {
        req.flash("error", "You don't have permission to do that!");
        return res.redirect("/listings/dashboard");
    }

    booking.status = "rejected";
    await booking.save();
    req.flash("success", "Booking rejected.");
    res.redirect("/listings/dashboard");
};

module.exports.destroyBooking = async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/bookings");
    }

    if (!booking.user.equals(req.user._id)) {
        req.flash("error", "You don't have permission to cancel this booking!");
        return res.redirect("/bookings");
    }

    await Booking.findByIdAndDelete(id);
    req.flash("success", "Booking cancelled successfully.");
    res.redirect("/bookings");
};
