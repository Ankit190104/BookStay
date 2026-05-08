const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
    initDB();
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  try {
    await Listing.deleteMany({});
    
    // Find the first user in the database to assign as owner
    const existingUser = await User.findOne({});
    let ownerId = "65c3456b8268c7adcb06fe59"; // Fallback ID
    
    if (existingUser) {
      ownerId = existingUser._id;
      console.log("Using existing user ID:", ownerId);
    } else {
      console.log("No users found. Using fallback owner ID. Please sign up and re-run seeding for correct ownership.");
    }

    initData.data = initData.data.map((obj) => ({
      ...obj, 
      owner: ownerId,
      geometry: {
        type: "Point",
        coordinates: [77.209, 28.6139]
      }
    }));

    await Listing.insertMany(initData.data);
    console.log("Data was initialized successfully!");
    process.exit(0);
  } catch (err) {
    console.log("Initialization Error:", err);
    process.exit(1);
  }
};