import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },  

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },
    variants: [
      {
        size: String,
        stock: Number,
      },
    ],

    images: [
      {
        url: String,
        publicId: String,
      },
    ],

    isListed: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ isListed: 1, isDeleted: 1, category: 1 });
productSchema.index({ isListed: 1, isDeleted: 1, createdAt: -1 });
productSchema.index({ isListed: 1, isDeleted: 1, price: 1 });
productSchema.index({ isListed: 1, isDeleted: 1, name: 1 });
productSchema.index({ brand: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;