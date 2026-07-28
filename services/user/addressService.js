import Address from "../../models/address.js";

export const getUserAddresses = async (userId) => {
  return Address.find({ userId }).sort({
    isDefault: -1,
    createdAt: -1,
  });
};

export const addAddressService = async (userId, data) => {
  data.isDefault = data.isDefault === "on";

  if (data.isDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  }

  await Address.create({
    ...data,
    userId,
  });
};

export const editAddressService = async (id, userId, data) => {
    
  data.isDefault = data.isDefault === "on";

  if (data.isDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  }

  await Address.findOneAndUpdate({ _id: id, userId }, data, { new: true });
};

export const setDefaultAddressService = async (id, userId) => {
  await Address.updateMany({ userId }, { isDefault: false });

  await Address.findOneAndUpdate({ _id: id, userId }, { isDefault: true });
};

export const deleteAddressService = async (id, userId) => {
  const address = await Address.findOne({
    _id: id,
    userId,
  });

  if (!address) {
    return;
  }

  const wasDefault = address.isDefault;

  await Address.deleteOne({
    _id: id,
    userId,
  });

  if (wasDefault) {
    const anotherAddress = await Address.findOne({
      userId,
    }).sort({ createdAt: -1 });

    if (anotherAddress) {
      anotherAddress.isDefault = true;
      await anotherAddress.save();
    }
  }
};

