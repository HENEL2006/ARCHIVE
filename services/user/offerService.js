import Offer from "../../models/offer.js";

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

    const pId = product?._id?.toString() || null;

    const cId = product?.category?._id
      ? product.category._id.toString()
      : product?.category?.toString() || null;

    const applicableOffers = [
      ...(pId ? productOffersMap.get(pId) || [] : []),
      ...(cId ? categoryOffersMap.get(cId) || [] : []),
    ];

    const defaultResult = {
      offer: null,
      discountAmount: 0,
      discountPercentage: 0,
      finalPrice: price,
    };

    if (price <= 0 || !applicableOffers.length) {
      return defaultResult;
    }

    let bestOffer = null;
    let bestDiscount = 0;

    for (const offer of applicableOffers) {
      const discountValue = Number(offer.discountValue);

      if (!Number.isFinite(discountValue) || discountValue <= 0) {
        continue;
      }

      let calculatedDiscount;

      if (offer.discountType === "PERCENTAGE") {
        if (discountValue >= 100) {
          continue;
        }
        calculatedDiscount = price * (discountValue / 100);
      } else {
        // Flat discount must always be strictly less than product's original price
        if (discountValue >= price) {
          continue;
        }
        calculatedDiscount = discountValue;
      }

      // Safety check: Never allow a product's final price to become zero or negative
      if (calculatedDiscount >= price || price - calculatedDiscount <= 0) {
        continue;
      }

      if (calculatedDiscount > bestDiscount) {
        bestDiscount = calculatedDiscount;
        bestOffer = offer;
      }
    }

    if (!bestOffer) {
      return defaultResult;
    }

    const finalPrice = price - bestDiscount;

    const discountPercentage = Math.round((bestDiscount / price) * 100);

    return {
      offer: bestOffer,
      discountAmount: bestDiscount,
      discountPercentage,
      finalPrice,
    };
  });
};

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
