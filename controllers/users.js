const User = require("../models/user.js");
const Booking = require("../models/booking.js");


module.exports.renderSignupForm =  (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password, role } = req.body;
        
        // Basic validation
        if (!username || !email || !password) {
            req.flash("error", "All fields are required!");
            return res.redirect("/signup");
        }

        const newUser = new User({ email, username, role: role || "guest" });
        
        const registeredUser = await User.register(newUser, password);
        
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", `Welcome to WanderLust, ${username}!`);
            res.redirect("/listings");
        });
    } catch (e) {
        console.error("Signup Error:", e.message);
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async(req, res) => {
    req.flash("success", "Welcome back to wanderlust!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout =(req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "you are logged out!");
        res.redirect("/listings");
    });
};

module.exports.toggleWishlist = async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to wishlist listings!");
        return res.redirect("/login");
    }

    let { id } = req.params;
    let user = await User.findById(req.user._id);

    // Initialize wishlist if it doesn't exist
    if (!user.wishlist) {
        user.wishlist = [];
    }

    const index = user.wishlist.findIndex(wishlistId => wishlistId.toString() === id);

    if (index !== -1) {
        user.wishlist.splice(index, 1);
        req.flash("success", "Removed from wishlist!");
    } else {
        user.wishlist.push(id);
        req.flash("success", "Added to wishlist!");
    }

    await user.save();
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ 
            success: true, 
            added: index === -1,
            wishlistCount: user.wishlist.length 
        });
    }

    res.redirect("back");
};

module.exports.renderWishlist = async (req, res) => {
    let user = await User.findById(req.user._id).populate("wishlist");
    res.render("users/wishlist.ejs", { wishlist: user.wishlist });
};

module.exports.renderProfile = async (req, res) => {
    const user = await User.findById(req.user._id).populate("wishlist");
    const bookingsCount = await Booking.countDocuments({ user: req.user._id });
    res.render("users/profile.ejs", { user, bookingsCount });
};

module.exports.renderEditProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    res.render("users/edit_profile.ejs", { user });
};

module.exports.updateProfile = async (req, res) => {
    let { username, email } = req.body;
    let user = await User.findByIdAndUpdate(req.user._id, { username, email });

    if (req.file) {
        user.image = {
            url: req.file.path,
            filename: req.file.filename
        };
        await user.save();
    }

    req.flash("success", "Profile updated successfully!");
    res.redirect("/profile");
};

module.exports.renderChangePasswordForm = (req, res) => {
    res.render("users/change_password.ejs");
};

module.exports.changePassword = async (req, res) => {
    let { oldPassword, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
        req.flash("error", "New passwords do not match!");
        return res.redirect("/change-password");
    }

    const user = await User.findById(req.user._id);
    await user.changePassword(oldPassword, newPassword);
    
    req.flash("success", "Password changed successfully!");
    res.redirect("/profile");
};

module.exports.deleteAccount = async (req, res) => {
    await User.findByIdAndDelete(req.user._id);
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "Your account has been permanently deleted.");
        res.redirect("/listings");
    });
};

module.exports.renderPlanner = (req, res) => {
    res.render("users/planner.ejs");
};

module.exports.generateItinerary = async (req, res) => {
    const { destination } = req.body;
    if (!destination) {
        return res.status(400).json({ error: "Destination is required!" });
    }

    const prompt = `
        Create a detailed and exciting 3-day travel itinerary for a trip to "${destination}".
        Format the response in clear HTML sections for Day 1, Day 2, and Day 3.
        Use <h4> for day titles and <ul> for activity lists.
        Include some emojis and brief descriptions of why each place is worth visiting.
        Keep the tone helpful and inspiring.
    `;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        const data = await response.json();
        if (response.ok && data.choices && data.choices[0]) {
            res.json({ itinerary: data.choices[0].message.content });
        } else {
            console.error("Groq API Error:", data);
            res.status(response.status || 500).json({ error: data.error?.message || "AI failed to generate itinerary." });
        }
    } catch (error) {
        console.error("AI Trip Planner Error:", error);
        res.status(500).json({ error: "AI connection error. Please check your internet or API key." });
    }
};