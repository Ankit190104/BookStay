const { required } = require("joi");
const mongoose = require("mongoose");
const passport = require("passport");
const Schema = mongoose.Schema;

const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["guest", "host"],
        default: "guest"
    },
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
        }
    ],
    image: {
        url: {
            type: String,
            default: "https://res.cloudinary.com/dqhmd76vt/image/upload/v1711100000/default_user_avatar.png"
        },
        filename: String
    }
}, { timestamps: true });

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);