import Product from "../../models/product.js";
import Order from "../../models/order.js";
import Category from "../../models/category.js";
import { getBatchBestOffersService } from "./offerService.js";

const getNewArrivals = async () => {
  const products = await Product.find({
    isListed: true,
    isDeleted: false,
  })
    .populate({
      path: "category",
      match: {
        isListed: true,
        isDeleted: false,
      },
      select: "name",
    })
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();

  const validProducts = products.filter((product) => product.category);
  const offerDataList = await getBatchBestOffersService(validProducts);

  return validProducts.map((product, index) => {
    const offerData = offerDataList[index];
    return {
      ...product,
      originalPrice: product.price,
      finalPrice: offerData.finalPrice,
      discountAmount: offerData.discountAmount,
      discountPercentage: offerData.discountPercentage,
      offer: offerData.offer,
    };
  });
};

const getTopSellingProducts = async () => {
  const topSelling = await Order.aggregate([
    {
      $match: {
        orderStatus: {
          $in: ["CONFIRMED", "SHIPPED", "DELIVERED"],
        },
      },
    },

    {
      $unwind: "$items",
    },

    {
      $match: {
        "items.itemStatus": {
          $nin: ["CANCELLED", "RETURNED"],
        },
      },
    },

    {
      $group: {
        _id: "$items.product",
        totalSold: {
          $sum: "$items.quantity",
        },
      },
    },

    {
      $sort: {
        totalSold: -1,
      },
    },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: "$product",
    },

    {
      $match: {
        "product.isListed": true,
        "product.isDeleted": false,
      },
    },

    {
      $lookup: {
        from: "categories",
        localField: "product.category",
        foreignField: "_id",
        as: "category",
      },
    },

    {
      $unwind: "$category",
    },

    {
      $match: {
        "category.isListed": true,
        "category.isDeleted": false,
      },
    },

    {
      $limit: 4,
    },
  ]);

  const mappedProducts = topSelling.map((item) => ({
    ...item.product,
    category: item.category,
    totalSold: item.totalSold,
  }));

  const offerDataList = await getBatchBestOffersService(mappedProducts);

  return mappedProducts.map((product, index) => {
    const offerData = offerDataList[index];
    return {
      ...product,
      originalPrice: product.price,
      finalPrice: offerData.finalPrice,
      discountAmount: offerData.discountAmount,
      discountPercentage: offerData.discountPercentage,
      offer: offerData.offer,
    };
  });
};

const getFeaturedCategories = async () => {
  return Category.find({
    isListed: true,
    isDeleted: false,
  })
    .select("name image")
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();
};

export const getHomeService = async () => {
  const [newArrivals, topSellingProducts, categories] = await Promise.all([
    getNewArrivals(),
    getTopSellingProducts(),
    getFeaturedCategories(),
  ]);

  return {
    newArrivals,
    topSellingProducts,
    categories,
  };
};
