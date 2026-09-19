import Coupon from "../../models/coupon.js";

export const getCouponsService = async (
  page = 1,
  limit = 5,
  search = "",
  status = "ALL",
) => {
  const query = {};

  if (search.trim()) {
    query.code = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  const now = new Date();

  if (status === "ACTIVE") {
    query.isActive = true;
    query.startDate = { $lte: now };
    query.expiryDate = { $gte: now };
  }

  if (status === "EXPIRED") {
    query.expiryDate = { $lt: now };
  }

  if (status === "DISABLED") {
    query.isActive = false;
  }

  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.max(Number(limit) || 5, 1);

  const skip = (currentPage - 1) * currentLimit;

  const [coupons, totalCoupons, activeCoupons, expiredCoupons] =
    await Promise.all([
      Coupon.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(currentLimit)
        .lean(),

      Coupon.countDocuments(query),

      Coupon.countDocuments({
        isActive: true,
        startDate: { $lte: now },
        expiryDate: { $gte: now },
      }),

      Coupon.countDocuments({
        expiryDate: { $lt: now },
      }),
    ]);

  const totalPages = Math.ceil(totalCoupons / currentLimit);

  return {
    coupons,
    totalCoupons,
    activeCoupons,
    expiredCoupons,
    currentPage,
    totalPages,
    limit: currentLimit,
    search: search.trim(),
    status,
  };
};

export const addCouponService = async (couponData) => {
  const {
    code,
    discountType,
    discountValue,
    minimumPurchase,
    maximumDiscount,
    usageLimit,
    startDate,
    expiryDate,
    isActive,
  } = couponData;

  const existingCoupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
  });

  if (existingCoupon) {
    throw new Error("Coupon code already exists");
  }

  const start = new Date(startDate);
  const expiry = new Date(expiryDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(expiry.getTime())) {
    throw new Error("Invalid coupon dates");
  }

  if (expiry <= start) {
    throw new Error("Expiry date must be after start date");
  }

  const value = Number(discountValue);
  const minPurchase = Number(minimumPurchase) || 0;

  if (!value || value <= 0) {
    throw new Error("Discount value must be greater than 0");
  }

  if (discountType === "PERCENTAGE" && value > 100) {
    throw new Error("Percentage discount cannot exceed 100%");
  }

  if (discountType === "FIXED" && value > minPurchase) {
    throw new Error("FIXED DISCOUNT CANNOT BE GREATER THAN MINIMUM PURCHASE");
  }

  let maxDiscount = null;

  if (maximumDiscount !== "" && maximumDiscount !== null) {
    maxDiscount = Number(maximumDiscount);

    if (Number.isNaN(maxDiscount) || maxDiscount < 0) {
      throw new Error("Invalid maximum discount");
    }
  }

  let limit = null;

  if (usageLimit !== "" && usageLimit !== null) {
    limit = Number(usageLimit);

    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("Usage limit must be at least 1");
    }
  }

  const coupon = await Coupon.create({
    code: code.trim().toUpperCase(),
    discountType,
    discountValue: value,
    minimumPurchase: minPurchase,
    maximumDiscount: maxDiscount,
    usageLimit: limit,
    startDate: start,
    expiryDate: expiry,
    isActive: isActive === "true",
  });

  return coupon;
};

export const getCouponByIdService = async (couponId) => {
  const coupon = await Coupon.findById(couponId).lean();

  return coupon;
};

export const updateCouponService = async (couponId, couponData) => {
  const {
    code,
    discountType,
    discountValue,
    minimumPurchase,
    maximumDiscount,
    usageLimit,
    startDate,
    expiryDate,
    isActive,
  } = couponData;

  const existingCoupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    _id: { $ne: couponId },
  });

  if (existingCoupon) {
    throw new Error("Coupon code already exists");
  }

  const start = new Date(startDate);
  const expiry = new Date(expiryDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(expiry.getTime())) {
    throw new Error("Invalid coupon dates");
  }

  if (expiry <= start) {
    throw new Error("Expiry date must be after start date");
  }

  const value = Number(discountValue);
  const minPurchase = Number(minimumPurchase) || 0;

  if (!value || value <= 0) {
    throw new Error("Discount value must be greater than 0");
  }

  if (discountType === "PERCENTAGE" && value > 100) {
    throw new Error("Percentage discount cannot exceed 100%");
  }

  if (discountType === "FIXED" && value > minPurchase) {
    throw new Error("FIXED DISCOUNT CANNOT BE GREATER THAN MINIMUM PURCHASE");
  }

  let maxDiscount = null;

  if (maximumDiscount !== "" && maximumDiscount !== null) {
    maxDiscount = Number(maximumDiscount);

    if (Number.isNaN(maxDiscount) || maxDiscount < 0) {
      throw new Error("Invalid maximum discount");
    }
  }

  let limit = null;

  if (usageLimit !== "" && usageLimit !== null) {
    limit = Number(usageLimit);

    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("Usage limit must be at least 1");
    }
  }

  const coupon = await Coupon.findByIdAndUpdate(
    couponId,
    {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: value,
      minimumPurchase: minPurchase,
      maximumDiscount: maxDiscount,
      usageLimit: limit,
      startDate: start,
      expiryDate: expiry,
      isActive: isActive === "true",
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  return coupon;
};

export const toggleCouponsStatusService = async (couponId) => {
  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new Error("COUPON NOT FOUND");
  }

  coupon.isActive = !coupon.isActive;

  await coupon.save();
  return coupon;
};
