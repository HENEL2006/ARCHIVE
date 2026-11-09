import mongoose from "mongoose";
import {
  ITEM_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
} from "../constants/orderStatus.js";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        name: {
          type: String,
          required: true,
          trim: true,
        },

        image: {
          type: String,
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

        itemTotal: {
          type: Number,
          required: true,
          min: 0,
        },

        finalItemTotal: {
          type: Number,
          required: true,
          min: 0,
        },

        itemStatus: {
          type: String,
          enum: Object.values(ITEM_STATUS),
          default: ITEM_STATUS.PLACED,
        },

        refundStatus: {
          type: String,
          enum: ["NOT_REFUNDED", "REFUNDED"],
          default: "NOT_REFUNDED",
        },

        refundAmount: {
          type: Number,
          default: 0,
          min: 0,
        },

        cancellationSource: {
          type: String,
          enum: ["CUSTOMER", "ADMIN"],
          default: null,
        },

        cancellationReason: {
          type: String,
          trim: true,
        },

        returnReason: {
          type: String,
          trim: true,
        },
      },
    ],

    deliveryAddress: {
      fullName: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        required: true,
      },

      addressLine1: {
        type: String,
        required: true,
      },

      addressLine2: {
        type: String,
      },

      city: {
        type: String,
        required: true,
      },

      state: {
        type: String,
        required: true,
      },

      postalCode: {
        type: String,
        required: true,
      },

      country: {
        type: String,
        required: true,
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shipping: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "RAZORPAY", "WALLET"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    transactionId: {
      type: String,
      trim: true,
      default: null,
    },

    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED,
    },

    cancellationReason: {
      type: String,
      trim: true,
    },

    returnReason: {
      type: String,
      trim: true,
    },
    shippingRefunded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ "items.product": 1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
