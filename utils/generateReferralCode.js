import crypto from "crypto";
import User from "../models/User.js";

const generateReferralCode = async () => {
  let referralCode;
  let exists = true;

  while (exists) {
    const randomCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    referralCode = `ARC-${randomCode}`;

    exists = await User.exists({ referralCode });
  }

  return referralCode;
};

export default generateReferralCode;