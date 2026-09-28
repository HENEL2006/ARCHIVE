import Referral from "../../models/referral.js";
import Coupon from "../../models/coupon.js";
import User from "../../models/User.js";
import generateReferralCode from "../../utils/generateReferralCode.js";

export const getReferralPageService = async (userId) => {
  const user = await User.findById(userId).select(
    "username email referralCode",
  );

  if (!user) {
    throw new Error("USER NOT FOUND");
  }

  if (!user.referralCode) {
    user.referralCode = await generateReferralCode();
    await user.save();
  }

  const userData = user.toObject();

  return {
    user: userData,
    referralCode: userData.referralCode,
  };
};

const generateReferralCouponCode = async (prefix) => {
  let code;
  let exists = true;

  while (exists) {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    code = `${prefix}-${randomCode}`;

    exists = await Coupon.exists({ code });
  }

  return code;
};

const createReferralCoupon = async (userId, amount, prefix) => {
  const code = await generateReferralCouponCode(prefix);

  return Coupon.create({
    code,
    discountType: "FIXED",
    discountValue: amount,
    minimumPurchase: 0,
    maximumDiscount: null,
    usageLimit: 1,
    usedCount: 0,
    usedBy: [],
    assignedTo: userId,
    startDate: new Date(),
    expiryDate: null,
    isActive: true,
  });
};

export const completeReferralService = async (userId) => {
  const referral = await Referral.findOne({
    referredUser: userId,
    status: "PENDING",
  });

  if (!referral) {
    return;
  }

  let referrerCoupon = null;
  let referredUserCoupon = null;

  if (referral.referrerCoupon) {
    referrerCoupon = await Coupon.findById(referral.referrerCoupon);
  }

  if (!referrerCoupon) {
    referrerCoupon = await createReferralCoupon(
      referral.referrer,
      200,
      "REF200",
    );

    referral.referrerCoupon = referrerCoupon._id;
    await referral.save();
  }

  if (referral.referredUserCoupon) {
    referredUserCoupon = await Coupon.findById(referral.referredUserCoupon);
  }

  if (!referredUserCoupon) {
    referredUserCoupon = await createReferralCoupon(
      referral.referredUser,
      100,
      "REF100",
    );

    referral.referredUserCoupon = referredUserCoupon._id;
    await referral.save();
  }

  referral.status = "COMPLETED";
  referral.completedAt = new Date();

  await referral.save();
};
