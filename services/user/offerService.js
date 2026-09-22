import Offer from "../../models/offer.js";

export const getBestOfferService = async (product) => {
  const now = new Date();

  const offers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    expiryDate: { $gte: now },
    $or: [
      { type: "PRODUCT", product: product._id },
      { type: "CATEGORY", category: product.category },
    ],
  }).lean();

  if (!offers.length) {
    return {
      offer: null,
      discountAmount: 0,
      finalPrice: product.price,
    };
  }

  let bestOffer = null;
  let bestDiscount = 0;

  for (const offer of offers) {
    const calculatedDiscount =
      offer.discountType === "PERCENTAGE"
        ? product.price * (offer.discountValue / 100)
        : offer.discountValue;

    const discountAmount = Math.min(calculatedDiscount, product.price);

    if (discountAmount > bestDiscount) {
      bestDiscount = discountAmount;
      bestOffer = offer;
    }
  }

  return {
    offer: bestOffer,
    discountAmount: bestDiscount,
    finalPrice: product.price - bestDiscount,
  };
};
