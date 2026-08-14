import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: {
      type: [
        {
          _id: false,

          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },

          size: {
            type: String,
            required: true,
            trim: true,
          },

          quantity: {
            type: Number,
            required: true,
            min: 1,
          },

          price: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;