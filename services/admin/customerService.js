import User from "../../models/User.js";

export const getCustomersService = async (
  search,
  status,
  sort,
  page,
  limit,
  fromDate,
  toDate,
) => {
  const query = {
    role: "user",
    isDeleted: false,
  };

  if (search) {
    query.$or = [
      {
        username: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
      {
        customerId: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (status === "active") {
    query.isBlocked = false;
  }

  if (status === "blocked") {
    query.isBlocked = true;
  }

  if (status === "not verified") {
    query.isVerified = false;
  }

  if (status === "deleted") {
    query.isDeleted = true;
  }

  if (fromDate || toDate) {
    query.createdAt = {};

    if (fromDate) {
      query.createdAt.$gte = new Date(fromDate);
    }

    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  let sortOption = {};

  switch (sort) {
    case "oldest":
      sortOption = { createdAt: 1 };
      break;
    case "az":
      sortOption = { username: 1 };
      break;
    case "za":
      sortOption = { username: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
      break;
  }

  const totalUsers = await User.countDocuments(query);

  const users = await User.find(query)
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);

  const totalCustomers = await User.countDocuments({ role: "user" });

  const activeCustomers = await User.countDocuments({
    role: "user",
    isBlocked: false,
  });

  const newCustomers = await User.countDocuments({
    role: "user",
    createdAt: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
  });
  return {
    users,
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    totalCustomers,
    activeCustomers,
    newCustomers,
  };
};

export const updateUserStatusService = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("USER NOT FOUND");
  }

  user.isBlocked = !user.isBlocked;

  await user.save();

  return user;
};

export const deleteUserService = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("USER NOT FOUND");
  }

  user.isDeleted = !user.isDeleted;

  await user.save();
  return user;
};
