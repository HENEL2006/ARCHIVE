import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["PRODUCT", "CATEGORY"],
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    startDate: {
      type: Date,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

offerSchema.index({ isActive: 1, startDate: 1, expiryDate: 1 });
offerSchema.index({ product: 1, isActive: 1 });
offerSchema.index({ category: 1, isActive: 1 });

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
