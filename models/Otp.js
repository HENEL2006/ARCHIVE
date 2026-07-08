import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    otp:{
        type: String,
        required: true,
    },

    createdAt:{
        type: Date,
        default: Date.now,
        expires: 60,
    },
});

const Otp = mongoose.model("Otp",otpSchema);

export default Otp;