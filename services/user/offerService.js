import Offer from "../../models/offer.js";

/**
 * Calculates the best active offer for a batch of products in a single database query.
 * @param {Array<Object>} products - Array of product objects with _id, category, price
 * @returns {Promise<Array<Object>>} Array of offer calculation results
 */
export const getBatchBestOffersService = async (products) => {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  const now = new Date();
  const productIds = [];
  const categoryIds = [];

  for (const product of products) {
    if (product?._id) {
      productIds.push(product._id);
    }
    const catId = product?.category?._id || product?.category;
    if (catId) {
      categoryIds.push(catId);
    }
  }

  const offers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    expiryDate: { $gte: now },
    $or: [
      { type: "PRODUCT", product: { $in: productIds } },
      { type: "CATEGORY", category: { $in: categoryIds } },
    ],
  }).lean();

  const productOffersMap = new Map();
  const categoryOffersMap = new Map();

  for (const offer of offers) {
    if (offer.type === "PRODUCT" && offer.product) {
      const key = offer.product.toString();
      if (!productOffersMap.has(key)) {
        productOffersMap.set(key, []);
      }
      productOffersMap.get(key).push(offer);
    } else if (offer.type === "CATEGORY" && offer.category) {
      const key = offer.category.toString();
      if (!categoryOffersMap.has(key)) {
        categoryOffersMap.set(key, []);
      }
      categoryOffersMap.get(key).push(offer);
    }
  }

  return products.map((product) => {
    const price = Number(product?.price) || 0;
    const pId = product?._id ? product._id.toString() : null;
    const cId = product?.category?._id
      ? product.category._id.toString()
      : (product?.category ? product.category.toString() : null);

    const applicableOffers = [
      ...(pId && productOffersMap.has(pId) ? productOffersMap.get(pId) : []),
      ...(cId && categoryOffersMap.has(cId) ? categoryOffersMap.get(cId) : []),
    ];

    if (!applicableOffers.length) {
      return {
        offer: null,
        discountAmount: 0,
        discountPercentage: 0,
        finalPrice: price,
      };
    }

    let bestOffer = null;
    let bestDiscount = 0;

    for (const offer of applicableOffers) {
      const calculatedDiscount =
        offer.discountType === "PERCENTAGE"
          ? price * (offer.discountValue / 100)
          : offer.discountValue;

      const discountAmount = Math.min(calculatedDiscount, price);

      if (discountAmount > bestDiscount) {
        bestDiscount = discountAmount;
        bestOffer = offer;
      }
    }

    const finalPrice = Math.max(0, price - bestDiscount);
    const discountPercentage =
      price > 0 ? Math.round((bestDiscount / price) * 100) : 0;

    return {
      offer: bestOffer,
      discountAmount: bestDiscount,
      discountPercentage,
      finalPrice,
    };
  });
};

/**
 * Calculates the best active offer for a single product (delegates to batch service).
 * @param {Object} product
 * @returns {Promise<Object>}
 */
export const getBestOfferService = async (product) => {
  if (!product) {
    return {
      offer: null,
      discountAmount: 0,
      discountPercentage: 0,
      finalPrice: 0,
    };
  }

  const [result] = await getBatchBestOffersService([product]);
  return result;
};
