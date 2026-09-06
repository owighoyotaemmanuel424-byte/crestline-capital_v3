import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", "demo@crestline.capital")).unique();
    if (existing) return { userId: existing._id };
    const now = Date.now();
    const userId = await ctx.db.insert("users", { email: "demo@crestline.capital", name: "Demo Customer", role: "customer", kycStatus: "verified", twoFactorEnabled: true, createdAt: now });
    const accountId = await ctx.db.insert("accounts", { userId, type: "checking", balance: 24850.75, availableBalance: 24850.75, currency: "USD", accountNumberMasked: "•••• 4821", status: "active", createdAt: now });
    const savingsId = await ctx.db.insert("accounts", { userId, type: "savings", balance: 12500, availableBalance: 12500, currency: "USD", accountNumberMasked: "•••• 9017", status: "active", createdAt: now });
    await ctx.db.insert("cards", { accountId, userId, last4: "4821", brand: "Crestline", isFrozen: false, expiryMonth: 8, expiryYear: 2029, createdAt: now });
    const samples = [
      { accountId, amount: 3200, category: "Salary", type: "credit" as const, description: "Payroll deposit", reference: "SAL-10001" },
      { accountId, amount: 84.2, category: "Dining", type: "debit" as const, description: "Harbor Kitchen", reference: "TXN-10002" },
      { accountId, amount: 145, category: "Utilities", type: "debit" as const, description: "Electric bill", reference: "TXN-10003" },
      { accountId, amount: 600, category: "Transfer", type: "debit" as const, description: "Transfer to savings", reference: "TXN-10004" },
      { accountId: savingsId, amount: 600, category: "Transfer", type: "credit" as const, description: "Transfer from checking", reference: "TXN-10004" },
    ];
    for (const item of samples) {
      const transactionId = await ctx.db.insert("transactions", { ...item, userId, currency: "USD", status: "completed", createdAt: now });
      await ctx.db.insert("ledgerEntries", { transactionId, accountId: item.accountId, direction: item.type, amount: item.amount, currency: "USD", createdAt: now });
    }
    await ctx.db.insert("notifications", { userId, title: "Welcome to Crestline Capital", body: "Your demo banking workspace is ready.", read: false, createdAt: now });
    return { userId };
  },
});
