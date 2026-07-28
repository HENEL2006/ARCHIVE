import User from "../../models/User.js";
import bcrypt from "bcrypt"


export const adminLoginService = async (email, password) => {
  if (!email || !password) {
    throw new Error("ALL FIELDS REQUIRED");
  }

  const admin = await User.findOne({ email, role: "admin" });

  if (!admin) {
    throw new Error("INVALID EMAIL");
  }

  const isPasswordCorrect = await bcrypt.compare(password, admin.password);

  if (!isPasswordCorrect) {
    throw new Error("INVALID PASSWORD");
  }

  return admin;
};