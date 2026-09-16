import { getWalletService } from "../../services/user/walletService.js";

export const loadWallet = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const wallet = await getWalletService(req.session.userId, page, 10);

    return res.render("user/wallet", {
      wallet,
    });
  } catch (error) {
    console.log(error);

    req.session.toast = {
      type: "error",
      message: error.message,
    };

    return res.redirect("/");
  }
};
