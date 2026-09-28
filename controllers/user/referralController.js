import { getReferralPageService } from "../../services/user/referralService.js";

export const loadReferAndEarn = async (req, res) => {
  try {
    const userId = req.session.userId;

    const data = await getReferralPageService(userId);

    const referralUrl = `${req.protocol}://${req.get("host")}/signup?ref=${data.referralCode}`;

    return res.render("user/referAFriend", {
      ...data,
      referralUrl,
      activePage: "referAFriend",
    });
  } catch (error) {
    console.log(error.message);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/profile");
  }
};
