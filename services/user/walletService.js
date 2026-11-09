import Wallet from "../../models/wallet.js";

export const getWalletService = async (userId, page = 1, limit = 10) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.max(1, Number(limit) || 10);
  
  let wallet = await Wallet.findOne({ userId }).lean();

  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balance: 0,
      transactions: [],
    });

    wallet = wallet.toObject();
  }

  const totalTransactions = wallet.transactions.length;

  const totalPages = Math.ceil(totalTransactions / limit);

  const currentPage =
    totalPages === 0 ? 1 : Math.min(Math.max(Number(page), 1), totalPages);

  const startIndex = totalTransactions - currentPage * limit;

  const endIndex = totalTransactions - (currentPage - 1) * limit;

  const transactions =
    startIndex < 0
      ? wallet.transactions.slice(0, endIndex)
      : wallet.transactions.slice(startIndex, endIndex);

  return {
    ...wallet,
    transactions: transactions.reverse(),
    currentPage,
    totalPages,
    totalTransactions,
    limit,
  };
};

export const creditWalletService = async (userId, amount, reason, orderId) => {
  const refundAmount = Number(Number(amount).toFixed(2));

  if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
    throw new Error("INVALID REFUND AMOUNT");
  }

  const transaction = {
    type: "CREDIT",
    amount: refundAmount,
    reason,
    orderId,
    description:
      reason === "ORDER_CANCELLATION_REFUND"
        ? "Refund for cancelled order"
        : "Refund for returned order",
  };

  const duplicateCondition = {
    userId,
    transactions: {
      $not: {
        $elemMatch: {
          type: "CREDIT",
          reason,
          orderId,
        },
      },
    },
  };

  const result = await Wallet.updateOne(duplicateCondition, {
    $inc: { balance: refundAmount },
    $push: { transactions: transaction },
  });

  if (result.modifiedCount === 1) {
    return;
  }

  const existingWallet = await Wallet.findOne({ userId });

  if (existingWallet) {
    throw new Error("REFUND ALREADY PROCESSED");
  }

  try {
    await Wallet.create({
      userId,
      balance: refundAmount,
      transactions: [transaction],
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("WALLET CREATION CONFLICT. RETRY THE OPERATION", {
        cause: error,
      });
    }

    throw error;
  }
};

export const debitWalletService = async (
  userId,
  amount,
  orderId,
  session = null,
) => {
  const debitAmount = Number(Number(amount).toFixed(2));

  if (!Number.isFinite(debitAmount) || debitAmount <= 0) {
    throw new Error("INVALID WALLET AMOUNT");
  }

  if (!orderId) {
    throw new Error("ORDER ID IS REQUIRED");
  }

  const wallet = await Wallet.findOneAndUpdate(
    {
      userId,
      balance: { $gte: debitAmount },
      transactions: {
        $not: {
          $elemMatch: {
            type: "DEBIT",
            reason: "WALLET_PAYMENT",
            orderId,
          },
        },
      },
    },
    {
      $inc: { balance: -debitAmount },
      $push: {
        transactions: {
          type: "DEBIT",
          amount: debitAmount,
          reason: "WALLET_PAYMENT",
          orderId,
          description: "Payment made using wallet balance",
        },
      },
    },
    {
      new: true,
      ...(session ? { session } : {}),
    },
  );

  if (wallet) {
    return wallet;
  }

  const existingWallet = await Wallet.findOne({ userId }).session(session);

  if (!existingWallet) {
    throw new Error("WALLET NOT FOUND");
  }

  const alreadyDebited = existingWallet.transactions.some(
    (transaction) =>
      transaction.type === "DEBIT" &&
      transaction.reason === "WALLET_PAYMENT" &&
      transaction.orderId === orderId,
  );

  if (alreadyDebited) {
    throw new Error("WALLET PAYMENT ALREADY PROCESSED");
  }

  throw new Error("INSUFFICIENT WALLET BALANCE");
};
