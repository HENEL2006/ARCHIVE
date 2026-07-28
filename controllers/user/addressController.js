import Address from "../../models/address.js";
import {
  getUserAddresses,
  addAddressService,
  editAddressService,
  setDefaultAddressService,
  deleteAddressService,
} from "../../services/user/addressService.js";

export const loadAddressPage = async (req, res) => {
  const addresses = await getUserAddresses(req.session.userId);
  res.render("user/address", {
    addresses,
    error: null,
  });
};

export const loadAddAddress = (req, res) => {
  res.render("user/addAddress", {
    errors: {},
    oldData: {},
  });
};

export const addAddress = async (req, res) => {
  try {
    await addAddressService(req.session.userId, req.body);

    req.session.toast = "ADDRESS ADDED";

    res.redirect("/address");
  } catch (error) {
    console.log(error);
    res.render("user/addAddress", {
      errors: {},
      oldData: req.body,
      error: error.message,
    });
  }
};

export const loadEditAddress = async (req, res) => {
  const address = await Address.findById(req.params.id);
  res.render("user/editAddress", {
    address,
    oldData: {},
    errors: {},
  });
};

export const editAddress = async (req, res) => {
  try {
    await editAddressService(req.params.id, req.session.userId, req.body);

    req.session.toast = "ADDRESS UPDATED";

    res.redirect("/address");
  } catch (error) {
    console.log(error);
    res.redirect("/address");
  }
};

export const setAsDefault = async (req, res) => {
  try {
    await setDefaultAddressService(req.params.id, req.session.userId);

    req.session.toast = "DEFAULT ADDRESS UPDATED";

    res.redirect("/address");
  } catch (error) {
    console.log(error);
    res.redirect("/address");
  }
};

export const deleteAddress = async (req, res) => {
  try {
    await deleteAddressService(req.params.id, req.session.userId);

    req.session.toast = "ADDRESS DELETED";

    res.redirect("/address");
  } catch (error) {
    console.log(error);
    res.redirect("/address");
  }
};
