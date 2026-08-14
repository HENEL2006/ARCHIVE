import User from "../../models/User.js";
import cloudinary from "../../config/cloudinary.js";
import streamifier from "streamifier";
import {
  removeProfileImageService,
} from "../../services/user/profileService.js";

export const loadProfilePage = async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render("user/profile", {
    user,
    activePage: "profile"
  });
};

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      req.session.toast = "PLEASE SELECT AN IMAGE";
      return res.redirect("/profile");
    }

    const user = await User.findById(req.session.userId);

    if (user.profileImagePublicId) {
      await cloudinary.uploader.destroy(user.profileImagePublicId);
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "archive/profile-images",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    await User.findByIdAndUpdate(req.session.userId, {
      profileImage: result.secure_url,
      profileImagePublicId: result.public_id,
    });

    req.session.toast = "PROFILE IMAGE UPDATED";

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    req.session.toast = "FAILED TO UPDATE PROFILE IMAGE";

    return res.status(500).json({
      success: false,
    });
  }
};

export const removeProfileImage = async (req, res) => {
  try {
    await removeProfileImageService(req.session.userId);

    req.session.toast = "PROFILE IMAGE REMOVED";

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    req.session.toast = error.message;

    return res.status(500).json({
      success: false,
    });
  }
};
