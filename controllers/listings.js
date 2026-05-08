const Listing = require("../models/listing");
const Booking = require("../models/booking");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
    let { category, search, minPrice, maxPrice, minRating } = req.query;
    let filter = {};
    
    if (category && category !== "All") filter.category = category;
    
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { country: { $regex: search, $options: "i" } }
        ];
    }

    // Advanced Filters
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let allListings = await Listing.find(filter).populate("reviews");

    // Filter by rating if requested
    if (minRating) {
        allListings = allListings.filter(listing => {
            if (listing.reviews.length === 0) return false;
            let avg = listing.reviews.reduce((s, r) => s + r.rating, 0) / listing.reviews.length;
            return avg >= Number(minRating);
        });
    }
  
  if (req.xhr || req.query.ajax) {
      return res.render("listings/listing_grid.ejs", { allListings, layout: false });
  }

  res.render("listings/index.ejs", { allListings, category: category || "All", mapToken: process.env.MAP_TOKEN });
};

module.exports.renderDashboard = async (req, res) => {
  const myListings = await Listing.find({ owner: req.user._id });
  const listingIds = myListings.map(l => l._id);
  
  const receivedBookings = await Booking.find({ listing: { $in: listingIds } })
      .populate("listing")
      .populate("user");

  // Calculate monthly earnings for chart
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  const last6Months = [];
  const earningsData = [];

  for (let i = 5; i >= 0; i--) {
      let m = (currentMonth - i + 12) % 12;
      last6Months.push(months[m]);
      
      const monthlyTotal = receivedBookings
          .filter(b => b.createdAt.getMonth() === m && b.createdAt.getFullYear() === new Date().getFullYear())
          .reduce((acc, curr) => acc + curr.totalPrice, 0);
      earningsData.push(monthlyTotal);
  }
  
  res.render("listings/dashboard.ejs", { 
      myListings, 
      receivedBookings, 
      chartLabels: JSON.stringify(last6Months), 
      chartData: JSON.stringify(earningsData) 
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)  
   .populate({ path: "reviews", populate: {
             path: "author",
           },
        })
        .populate("owner");;
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
   return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient
  .forwardGeocode({
  query: req.body.listing.location,
  limit: 1,
})
  .send()


  let url = req.file.path;
  let filename = req.file.filename;
  
  const newListing = new Listing(req.body.listing);
   newListing.owner = req.user._id;
   newListing.image = {url, filename};

   newListing.geometry = response.body.features[0].geometry;

  let savedListing = await newListing.save();
  console.log(savedListing);
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250");

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if(typeof req.file !=="undefined") {
  let url = req.file.path;
  let filename = req.file.filename;
  listing.image = { url, filename };
  await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
   req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

module.exports.handleChat = async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    const listing = await Listing.findById(id);

    if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
    }

    const context = `
        You are a helpful travel assistant for a property listing on WanderLust.
        Property: ${listing.title}
        Details: ${listing.description}
        Price: ₹${listing.price}
        Location: ${listing.location}

        Question: ${message}

        Answer concisely (max 2 sentences) based ONLY on these details. If unsure, say you don't have that info.
    `;

    try {
        console.log("Attempting AI request for listing:", id);
        
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: context }],
                temperature: 0.5,
                max_tokens: 100
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            console.log("AI responded successfully");
            res.json({ reply: data.choices[0].message.content });
        } else {
            console.error("AI Service Error Detail:", JSON.stringify(data));
            res.status(500).json({ error: data.error?.message || "AI service is currently busy." });
        }
    } catch (error) {
        console.error("Critical Connection Error:", error.message);
        res.status(500).json({ error: "Server could not reach AI. Check your internet." });
    }
};

module.exports.generateDescription = async (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Please provide a title first!" });

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ 
                    role: "user", 
                    content: `Write a catchy, high-converting property description for a stay titled: "${title}". Make it around 3-4 sentences. Focus on luxury and experience.` 
                }],
                temperature: 0.7,
                max_tokens: 200
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
            res.json({ description: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: "AI failed to generate description." });
        }
    } catch (error) {
        res.status(500).json({ error: "AI connection error." });
    }
};

module.exports.summarizeReviews = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");

    if (!listing || listing.reviews.length === 0) {
        return res.status(400).json({ error: "No reviews to summarize!" });
    }

    const reviewsText = listing.reviews.map(r => r.comment).join("\n");
    const prompt = `
        Summarize the following guest reviews for a property titled "${listing.title}".
        Focus on the overall sentiment, common pros, and common cons mentioned.
        Keep it to 3-4 bullet points. Be honest and concise.
        
        Reviews:
        ${reviewsText}
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
                temperature: 0.5,
                max_tokens: 300
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
            res.json({ summary: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: "AI failed to summarize reviews." });
        }
    } catch (error) {
        res.status(500).json({ error: "AI connection error." });
    }
};

module.exports.renderSitemap = (req, res) => {
    res.render("listings/sitemap.ejs");
};