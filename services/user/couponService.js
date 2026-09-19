import Coupon from "../../models/coupon.js";

export const applyCouponService = async (userId, code, subtotal) => {
  if (!code || !code.trim()) {
    throw new Error("PLEASE ENTER A COUPON CODE");
  }

  const couponCode = code.trim().toUpperCase();

  const coupon = await Coupon.findOne({
    code: couponCode,
  });

  if (!coupon) {
    throw new Error("INVAILD COUPON CODE");
  }

  const now = new Date();

  if (!coupon.isActive) {
    throw new Error("COUPON IS DISABLED");
  }

  if (now < coupon.startDate) {
    throw new Error("COUPON IS NOT ACTIVE YET");
  }

  if (now > coupon.expiryDate) {
    throw new Error("COUPON HAS EXPIRED");
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("COUPON USAGE LIMIT REACHED");
  }

  const alreadyUsed = coupon.usedBy.some(
    (usage) => usage.userId.toString() === userId.toString(),
  );

  if (alreadyUsed) {
    throw new Error("YOU HAVE ALREADY USED THIS COUPON");
  }

  if (subtotal < coupon.minimumPurchase) {
    throw new Error(`MINIMUM PURCHASE OF ₹${coupon.minimumPurchase} REQUIRED`);
  }

  let discount = 0;

  if (coupon.discountType === "PERCENTAGE") {
    discount = (subtotal * coupon.discountValue) / 100;

    if (coupon.maximumDiscount !== null && discount > coupon.maximumDiscount) {
      discount = coupon.maximumDiscount;
    }
  } else if (coupon.discountType === "FIXED") {
    discount = coupon.discountValue;
  }

  discount = Math.min(discount, subtotal);

  return {
    couponId: coupon._id,
    code: coupon.code,
    discount,
  };
};

export const getAppliedCouponService = async (
  userId,
  appliedCoupon,
  subtotal,
) => {
  if (!appliedCoupon) {
    return {
      coupon: null,
      discount: 0,
    };
  }

  const coupon = await Coupon.findById(appliedCoupon.couponId);

  if (!coupon) {
    throw new Error("COUPON NO LONGER EXISTS");
  }

  const now = new Date();

  if (!coupon.isActive) {
    throw new Error("COUPON IS DISABLED");
  }

  if (now < coupon.startDate) {
    throw new Error("COUPON IS NOT ACTIVE YET");
  }

  if (now > coupon.expiryDate) {
    throw new Error("COUPON HAS EXPIRED");
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("COUPON USAGE LIMIT REACHED");
  }

  const alreadyUsed = coupon.usedBy.some(
    (usage) => usage.userId.toString() === userId.toString(),
  );

  if (alreadyUsed) {
    throw new Error("YOU HAVE ALREADY USED THIS COUPON");
  }

  if (subtotal < coupon.minimumPurchase) {
    throw new Error(`MINIMUM PURCHASE OF ₹${coupon.minimumPurchase} REQUIRED`);
  }

  let discount = 0;

  if (coupon.discountType === "PERCENTAGE") {
    discount = (subtotal * coupon.discountValue) / 100;

    if (coupon.maximumDiscount !== null && discount > coupon.maximumDiscount) {
      discount = coupon.maximumDiscount;
    }
  }

  if (coupon.discountType === "FIXED") {
    discount = coupon.discountValue;
  }

  discount = Math.min(discount, subtotal);

  return {
    coupon,
    discount,
  };
};

export const getAvailableCouponsService = async (userId, subtotal) => {
  const now = new Date();

  const coupons = await Coupon.find({
    isActive: true,
    startDate: { $lte: now },
    expiryDate: { $gte: now },
    minimumPurchase: { $lte: subtotal },
  })
    .sort({ createdAt: -1 })
    .lean();

  const availableCoupons = coupons.filter((coupon) => {
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return false;
    }

    const alreadyUsed = coupon.usedBy?.some(
      (usage) => usage.userId.toString() === userId.toString(),
    );

    if (alreadyUsed) {
      return false;
    }

    return true;
  });

  return availableCoupons;  
};
