import Wallet from "../../models/wallet.js";

export const getWalletService = async (userId, page = 1, limit = 10) => {
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
  if (!amount || amount <= 0) {
    return;
  }

  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    wallet = new Wallet({
      userId,
      balance: 0,
      transactions: [],
    });
  }

  wallet.balance += amount;

  wallet.transactions.push({
    type: "CREDIT",
    amount,
    reason,
    orderId,
    description:
      reason === "ORDER_CANCELLATION_REFUND"
        ? "Refund for cancelled order"
        : "Refund for returned order",
  });

  await wallet.save();
};

export const debitWalletService = async (userId, amount, orderId) => {
  if (!amount || amount <= 0) {
    throw new Error("INVALID WALLET AMOUNT");
  }

  const wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    throw new Error("WALLET NOT FOUND");
  }

  if (wallet.balance < amount) {
    throw new Error("INSUFFICIENT WALLET BALANCE");
  }

  wallet.balance -= amount;

  wallet.transactions.push({
    type: "DEBIT",
    amount,
    reason: "WALLET_PAYMENT",
    orderId,
    description: "payment made using the wallet balance",
  });

  await wallet.save();
  return wallet;
};
