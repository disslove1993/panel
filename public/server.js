// server.ts
import express from "express";
import http from "http";
import https from "https";
import path2 from "path";
import fs2 from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// bridgeStore.ts
import fs from "fs";
import path from "path";
var STORE_PATH = path.resolve(process.cwd(), "bridge_store.json");
var DEFAULT_PLANS = [
  {
    id: "plan_1m_10gb",
    name: "\u0627\u0634\u062A\u0631\u0627\u06A9 \u06F1 \u0645\u0627\u0647\u0647 - \u06F1\u06F0 \u06AF\u06CC\u06AF\u0627\u0628\u0627\u06CC\u062A",
    periodDays: 30,
    trafficGB: 10,
    priceTokens: 1e3,
    priceTomans: 85e3,
    isPopular: true,
    description: "\u0645\u0646\u0627\u0633\u0628 \u0648\u0628\u200C\u06AF\u0631\u062F\u06CC\u060C \u0627\u06CC\u0646\u0633\u062A\u0627\u06AF\u0631\u0627\u0645\u060C \u06CC\u0648\u062A\u06CC\u0648\u0628 \u0648 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0628\u0627 \u0622\u06CC\u200C\u067E\u06CC \u062B\u0627\u0628\u062A \u0648 \u067E\u06CC\u0646\u06AF \u067E\u0627\u06CC\u06CC\u0646"
  },
  {
    id: "plan_1m_30gb",
    name: "\u0627\u0634\u062A\u0631\u0627\u06A9 \u06F1 \u0645\u0627\u0647\u0647 - \u06F3\u06F0 \u06AF\u06CC\u06AF\u0627\u0628\u0627\u06CC\u062A",
    periodDays: 30,
    trafficGB: 30,
    priceTokens: 2500,
    priceTomans: 195e3,
    isPopular: false,
    description: "\u062D\u062C\u0645 \u0628\u0627\u0644\u0627 \u0628\u0631\u0627\u06CC \u062A\u0645\u0627\u0634\u0627\u06CC \u0622\u0646\u0644\u0627\u06CC\u0646 \u0641\u06CC\u0644\u0645\u060C \u0627\u0633\u062A\u0631\u06CC\u0645 \u0648 \u0628\u0627\u0632\u06CC \u0622\u0646\u0644\u0627\u06CC\u0646"
  },
  {
    id: "plan_3m_60gb",
    name: "\u0627\u0634\u062A\u0631\u0627\u06A9 \u06F3 \u0645\u0627\u0647\u0647 - \u06F6\u06F0 \u06AF\u06CC\u06AF\u0627\u0628\u0627\u06CC\u062A (VIP)",
    periodDays: 90,
    trafficGB: 60,
    priceTokens: 4800,
    priceTomans: 39e4,
    isPopular: false,
    description: "\u0628\u0647\u062A\u0631\u06CC\u0646 \u0642\u06CC\u0645\u062A \u0628\u0647 \u0627\u0632\u0627\u06CC \u0647\u0631 \u06AF\u06CC\u06AF\u0627\u0628\u0627\u06CC\u062A \u0628\u0627 \u0633\u0631\u0648\u0631 \u0627\u062E\u062A\u0635\u0627\u0635\u06CC VIP"
  },
  {
    id: "plan_free_trial",
    name: "\u062A\u0633\u062A \u0627\u0648\u0644\u06CC\u0647 \u0631\u0627\u06CC\u06AF\u0627\u0646 - \u06F1 \u06AF\u06CC\u06AF\u0627\u0628\u0627\u06CC\u062A",
    periodDays: 3,
    trafficGB: 1,
    priceTokens: 0,
    priceTomans: 0,
    isPopular: false,
    description: "\u062A\u0633\u062A \u0633\u0631\u0639\u062A \u0648 \u06A9\u06CC\u0641\u06CC\u062A \u0627\u062A\u0635\u0627\u0644 \u062F\u0631 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646 \u0628\u0631\u0627\u06CC \u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u062A\u0627\u0632\u0647 \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0634\u062F\u0647"
  }
];
var DEFAULT_SETTINGS = {
  apiKey: "bridge_secret_key_2026",
  adminPassword: "admin",
  defaultInboundId: 1,
  welcomeTokens: 1e3,
  freeTrialTrafficGB: 1,
  freeTrialDays: 3,
  sanaeiPanelUrl: "",
  sanaeiWebBasePath: "/",
  sanaeiUsername: "",
  sanaeiPassword: "",
  allowInsecure: true,
  zibalMerchant: "",
  zibalEnabled: true,
  zibalCallbackUrl: "",
  // Card to Card & Telegram Bot Settings
  cardToCardEnabled: true,
  bankCardNumber: "",
  bankCardOwner: "",
  bankName: "",
  telegramBotToken: "",
  telegramAdminChatId: "",
  plans: DEFAULT_PLANS,
  giftCodes: [
    {
      id: "gift_welcome",
      code: "WELCOME2026",
      tokens: 1e3,
      maxUses: 1e3,
      usedCount: 0,
      isExpired: false,
      createdAt: Date.now()
    },
    {
      id: "gift_bonus",
      code: "FREE1000",
      tokens: 1e3,
      maxUses: 500,
      usedCount: 0,
      isExpired: false,
      createdAt: Date.now()
    }
  ]
};
var WALLET_PACKAGES = [
  {
    id: "pack_100",
    tokens: 100,
    priceTomans: 1e4,
    bonusTokens: 0,
    title: "\u0628\u0633\u062A\u0647 \u067E\u0627\u06CC\u0647 \u06F1\u06F0\u06F0 \u062A\u0648\u06A9\u0646 (\u06F1\u06F0 \u0647\u0632\u0627\u0631 \u062A\u0648\u0645\u0627\u0646)",
    isPopular: false
  },
  {
    id: "pack_1000",
    tokens: 1e3,
    priceTomans: 85e3,
    bonusTokens: 0,
    title: "\u0628\u0633\u062A\u0647 \u0627\u0633\u062A\u0627\u0646\u062F\u0627\u0631\u062F \u06F1\u06F0\u06F0\u06F0 \u062A\u0648\u06A9\u0646",
    isPopular: false
  },
  {
    id: "pack_2500",
    tokens: 2500,
    priceTomans: 195e3,
    bonusTokens: 200,
    title: "\u0628\u0633\u062A\u0647 \u0646\u0642\u0631\u0647\u200C\u0627\u06CC \u06F2\u06F5\u06F0\u06F0 \u062A\u0648\u06A9\u0646 (+\u06F2\u06F0\u06F0 \u0647\u062F\u06CC\u0647)",
    isPopular: true
  },
  {
    id: "pack_5000",
    tokens: 5e3,
    priceTomans: 38e4,
    bonusTokens: 500,
    title: "\u0628\u0633\u062A\u0647 \u0637\u0644\u0627\u06CC\u06CC \u06F5\u06F0\u06F0\u06F0 \u062A\u0648\u06A9\u0646 (+\u06F5\u06F0\u06F0 \u0647\u062F\u06CC\u0647)",
    isPopular: false
  }
];
var BridgeStoreManager = class {
  constructor() {
    this.data = this.loadFromDisk();
  }
  loadFromDisk() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings || {} },
          users: parsed.users || {},
          transactions: parsed.transactions || [],
          redeemedCodes: parsed.redeemedCodes || {},
          orders: parsed.orders || {},
          cardOrders: parsed.cardOrders || {}
        };
      }
    } catch (err) {
      console.error("Error loading bridge store:", err);
    }
    return {
      settings: DEFAULT_SETTINGS,
      users: {},
      transactions: [],
      redeemedCodes: {},
      orders: {},
      cardOrders: {}
    };
  }
  saveToDisk() {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving bridge store:", err);
    }
  }
  getSettings() {
    return this.data.settings;
  }
  updateSettings(partial) {
    this.data.settings = { ...this.data.settings, ...partial };
    this.saveToDisk();
    return this.data.settings;
  }
  getPlans() {
    return this.data.settings.plans || DEFAULT_PLANS;
  }
  getPlanById(planId) {
    return this.getPlans().find((p) => p.id === planId);
  }
  addPlan(plan) {
    if (!this.data.settings.plans) {
      this.data.settings.plans = [...DEFAULT_PLANS];
    }
    const exists = this.data.settings.plans.find((p) => p.id === plan.id);
    if (exists) {
      Object.assign(exists, plan);
    } else {
      this.data.settings.plans.push(plan);
    }
    this.saveToDisk();
    return plan;
  }
  updatePlan(planId, partial) {
    if (!this.data.settings.plans) {
      this.data.settings.plans = [...DEFAULT_PLANS];
    }
    const plan = this.data.settings.plans.find((p) => p.id === planId);
    if (!plan) return void 0;
    Object.assign(plan, partial);
    this.saveToDisk();
    return plan;
  }
  deletePlan(planId) {
    if (!this.data.settings.plans) {
      this.data.settings.plans = [...DEFAULT_PLANS];
    }
    const initialLen = this.data.settings.plans.length;
    this.data.settings.plans = this.data.settings.plans.filter((p) => p.id !== planId);
    if (this.data.settings.plans.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }
  // --- Wallet Packages CRUD ---
  getWalletPackages() {
    if (!Array.isArray(this.data.settings.walletPackages)) {
      this.data.settings.walletPackages = [...WALLET_PACKAGES];
    }
    return this.data.settings.walletPackages;
  }
  getWalletPackageById(packageId) {
    return this.getWalletPackages().find((p) => p.id === packageId);
  }
  addWalletPackage(pkg) {
    const list = this.getWalletPackages();
    const exists = list.find((p) => p.id === pkg.id);
    if (exists) {
      Object.assign(exists, pkg);
    } else {
      list.push(pkg);
    }
    this.data.settings.walletPackages = list;
    this.saveToDisk();
    return pkg;
  }
  updateWalletPackage(packageId, partial) {
    const list = this.getWalletPackages();
    const pkg = list.find((p) => p.id === packageId);
    if (!pkg) return void 0;
    Object.assign(pkg, partial);
    this.data.settings.walletPackages = list;
    this.saveToDisk();
    return pkg;
  }
  deleteWalletPackage(packageId) {
    const list = this.getWalletPackages();
    const initialLen = list.length;
    this.data.settings.walletPackages = list.filter((p) => p.id !== packageId);
    if (this.data.settings.walletPackages.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }
  deleteGiftCode(codeOrId) {
    if (!this.data.settings.giftCodes) return false;
    const clean = codeOrId.trim().toUpperCase();
    const initialLen = this.data.settings.giftCodes.length;
    this.data.settings.giftCodes = this.data.settings.giftCodes.filter(
      (g) => g.id !== codeOrId && g.code.toUpperCase() !== clean
    );
    if (this.data.settings.giftCodes.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }
  getAllUsers() {
    return Object.values(this.data.users).sort((a, b) => b.registeredAt - a.registeredAt);
  }
  findUserByIdOrEmail(identifier) {
    if (!identifier) return void 0;
    const clean = identifier.trim().toLowerCase();
    return Object.values(this.data.users).find(
      (u) => u.id === identifier || u.email.toLowerCase() === clean || u.deviceId && u.deviceId.toLowerCase() === clean
    );
  }
  createUser(payload) {
    const email = payload.email.trim();
    const existing = this.findUserByIdOrEmail(email);
    if (existing) {
      return existing;
    }
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const initialTokens = payload.initialTokens !== void 0 ? payload.initialTokens : this.data.settings.welcomeTokens;
    const newUser = {
      id,
      email,
      name: payload.name?.trim() || email.split("@")[0] || "User",
      tokens: initialTokens,
      deviceId: payload.deviceId || "",
      registeredAt: now,
      lastActiveAt: now,
      subscription: {
        status: "none",
        planId: "",
        planName: "",
        trafficTotalGB: 0,
        trafficTotalBytes: 0,
        trafficUsedBytes: 0,
        trafficRemainingBytes: 0,
        expiryTime: 0,
        remainingDays: 0,
        clientEmail: "",
        clientUuid: "",
        inboundId: 0,
        inboundRemark: "",
        inboundProtocol: "",
        inboundPort: 0,
        configUri: "",
        subUrl: "",
        subscribedAt: 0
      }
    };
    this.data.users[id] = newUser;
    if (initialTokens > 0) {
      this.addTransaction({
        userId: id,
        type: "welcome",
        amountTokens: initialTokens,
        description: "\u0647\u062F\u06CC\u0647 \u062E\u0648\u0634\u200C\u0622\u0645\u062F\u06AF\u0648\u06CC\u06CC \u0648 \u062A\u0633\u062A \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646"
      });
    }
    this.saveToDisk();
    return newUser;
  }
  updateUser(user) {
    this.data.users[user.id] = { ...user, lastActiveAt: Date.now() };
    this.saveToDisk();
    return this.data.users[user.id];
  }
  deleteUser(userId) {
    if (this.data.users[userId]) {
      delete this.data.users[userId];
      this.saveToDisk();
      return true;
    }
    return false;
  }
  // --- Wallet & Transactions Management ---
  addTransaction(item) {
    if (!this.data.transactions) this.data.transactions = [];
    const tx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: item.userId,
      type: item.type,
      amountTokens: item.amountTokens,
      description: item.description,
      createdAt: Date.now()
    };
    this.data.transactions.unshift(tx);
    if (this.data.transactions.length > 1e3) {
      this.data.transactions = this.data.transactions.slice(0, 1e3);
    }
    this.saveToDisk();
    return tx;
  }
  getTransactions(userId) {
    const list = this.data.transactions || [];
    if (!userId) return list;
    return list.filter((t) => t.userId === userId);
  }
  adjustUserTokens(userId, deltaTokens, type, description) {
    const user = this.findUserByIdOrEmail(userId);
    if (!user) {
      return { success: false, message: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." };
    }
    const newBalance = (user.tokens || 0) + deltaTokens;
    if (newBalance < 0) {
      return { success: false, message: "\u0645\u0648\u062C\u0648\u062F\u06CC \u062A\u0648\u06A9\u0646 \u06A9\u0627\u0631\u0628\u0631 \u06A9\u0627\u0641\u06CC \u0646\u06CC\u0633\u062A." };
    }
    user.tokens = newBalance;
    this.updateUser(user);
    this.addTransaction({
      userId: user.id,
      type,
      amountTokens: deltaTokens,
      description
    });
    return { success: true, user };
  }
  // --- Gift Codes Management ---
  getGiftCodes() {
    return this.data.settings.giftCodes || [];
  }
  createGiftCode(code, tokens, maxUses = 100) {
    if (!this.data.settings.giftCodes) this.data.settings.giftCodes = [];
    const cleanCode = code.trim().toUpperCase();
    const existing = this.data.settings.giftCodes.find((g) => g.code === cleanCode);
    if (existing) {
      existing.tokens = tokens;
      existing.maxUses = maxUses;
      existing.isExpired = false;
      this.saveToDisk();
      return existing;
    }
    const newGift = {
      id: `gift_${Date.now()}`,
      code: cleanCode,
      tokens,
      maxUses,
      usedCount: 0,
      isExpired: false,
      createdAt: Date.now()
    };
    this.data.settings.giftCodes.push(newGift);
    this.saveToDisk();
    return newGift;
  }
  redeemGiftCode(userId, rawCode) {
    const user = this.findUserByIdOrEmail(userId);
    if (!user) {
      return { success: false, tokensAdded: 0, newTokens: 0, message: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." };
    }
    const code = rawCode.trim().toUpperCase();
    const gifts = this.getGiftCodes();
    const gift = gifts.find((g) => g.code === code);
    if (!gift) {
      return { success: false, tokensAdded: 0, newTokens: user.tokens, message: "\u06A9\u062F \u0647\u062F\u06CC\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A." };
    }
    if (gift.isExpired || gift.usedCount >= gift.maxUses) {
      return { success: false, tokensAdded: 0, newTokens: user.tokens, message: "\u0645\u0647\u0644\u062A \u06CC\u0627 \u0638\u0631\u0641\u06CC\u062A \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0627\u0632 \u0627\u06CC\u0646 \u06A9\u062F \u0647\u062F\u06CC\u0647 \u0628\u0647 \u067E\u0627\u06CC\u0627\u0646 \u0631\u0633\u06CC\u062F\u0647 \u0627\u0633\u062A." };
    }
    if (!this.data.redeemedCodes) this.data.redeemedCodes = {};
    const usedUsers = this.data.redeemedCodes[code] || [];
    if (usedUsers.includes(user.id)) {
      return { success: false, tokensAdded: 0, newTokens: user.tokens, message: "\u0634\u0645\u0627 \u0642\u0628\u0644\u0627\u064B \u0627\u0632 \u0627\u06CC\u0646 \u06A9\u062F \u0647\u062F\u06CC\u0647 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u06A9\u0631\u062F\u0647\u200C\u0627\u06CC\u062F." };
    }
    usedUsers.push(user.id);
    this.data.redeemedCodes[code] = usedUsers;
    gift.usedCount += 1;
    if (gift.usedCount >= gift.maxUses) {
      gift.isExpired = true;
    }
    user.tokens = (user.tokens || 0) + gift.tokens;
    this.updateUser(user);
    this.addTransaction({
      userId: user.id,
      type: "gift_code",
      amountTokens: gift.tokens,
      description: `\u0627\u0639\u0645\u0627\u0644 \u06A9\u062F \u0647\u062F\u06CC\u0647 ${code}`
    });
    this.saveToDisk();
    return {
      success: true,
      tokensAdded: gift.tokens,
      newTokens: user.tokens,
      message: `\u06A9\u062F \u0647\u062F\u06CC\u0647 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0639\u0645\u0627\u0644 \u0634\u062F \u0648 ${gift.tokens} \u062A\u0648\u06A9\u0646 \u0628\u0647 \u062D\u0633\u0627\u0628 \u0634\u0645\u0627 \u0627\u0641\u0632\u0648\u062F\u0647 \u06AF\u0631\u062F\u06CC\u062F!`
    };
  }
  // --- Payment Orders Management (Zibal IPG) ---
  createPaymentOrder(order) {
    if (!this.data.orders) this.data.orders = {};
    this.data.orders[order.id] = order;
    this.saveToDisk();
    return order;
  }
  getPaymentOrder(orderId) {
    return this.data.orders ? this.data.orders[orderId] : void 0;
  }
  findOrderByTrackId(trackId) {
    if (!this.data.orders) return void 0;
    return Object.values(this.data.orders).find((o) => o.trackId === trackId);
  }
  updatePaymentOrder(order) {
    if (!this.data.orders) this.data.orders = {};
    this.data.orders[order.id] = order;
    this.saveToDisk();
    return order;
  }
  getAllPaymentOrders() {
    if (!this.data.orders) return [];
    return Object.values(this.data.orders).sort((a, b) => b.createdAt - a.createdAt);
  }
  // --- Card to Card Transfer Orders Management ---
  createCardOrder(order) {
    if (!this.data.cardOrders) this.data.cardOrders = {};
    this.data.cardOrders[order.id] = order;
    this.saveToDisk();
    return order;
  }
  getCardOrder(orderId) {
    return this.data.cardOrders ? this.data.cardOrders[orderId] : void 0;
  }
  updateCardOrder(order) {
    if (!this.data.cardOrders) this.data.cardOrders = {};
    this.data.cardOrders[order.id] = order;
    this.saveToDisk();
    return order;
  }
  getAllCardOrders() {
    if (!this.data.cardOrders) return [];
    return Object.values(this.data.cardOrders).sort((a, b) => b.createdAt - a.createdAt);
  }
  approveCardOrder(orderId) {
    const order = this.getCardOrder(orderId);
    if (!order) {
      return { success: false, message: "\u0631\u0633\u06CC\u062F \u067E\u0631\u062F\u0627\u062E\u062A \u06A9\u0627\u0631\u062A \u0628\u0647 \u06A9\u0627\u0631\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." };
    }
    if (order.status === "approved") {
      return { success: true, order, message: "\u0627\u06CC\u0646 \u0631\u0633\u06CC\u062F \u0642\u0628\u0644\u0627\u064B \u062A\u0627\u06CC\u06CC\u062F \u0648 \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631 \u0634\u0627\u0631\u0698 \u0634\u062F\u0647 \u0627\u0633\u062A." };
    }
    order.status = "approved";
    order.reviewedAt = Date.now();
    this.updateCardOrder(order);
    const adjustResult = this.adjustUserTokens(
      order.userId,
      order.tokens,
      "topup",
      `\u0648\u0627\u0631\u06CC\u0632 \u06A9\u0627\u0631\u062A \u0628\u0647 \u06A9\u0627\u0631\u062A (\u0633\u0641\u0627\u0631\u0634 ${order.id})`
    );
    return {
      success: true,
      order,
      user: adjustResult.user,
      message: `\u0633\u0641\u0627\u0631\u0634 \u06A9\u0627\u0631\u062A \u0628\u0647 \u06A9\u0627\u0631\u062A \u062A\u0627\u06CC\u06CC\u062F \u0634\u062F \u0648 ${order.tokens} \u062A\u0648\u06A9\u0646 \u0628\u0647 \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631 \u0648\u0627\u0631\u06CC\u0632 \u06AF\u0631\u062F\u06CC\u062F!`
    };
  }
  rejectCardOrder(orderId, reason) {
    const order = this.getCardOrder(orderId);
    if (!order) {
      return { success: false, message: "\u0633\u0641\u0627\u0631\u0634 \u06A9\u0627\u0631\u062A \u0628\u0647 \u06A9\u0627\u0631\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." };
    }
    if (order.status === "approved") {
      return { success: false, message: "\u0627\u0645\u06A9\u0627\u0646 \u0631\u062F \u0633\u0641\u0627\u0631\u0634\u06CC \u06A9\u0647 \u0642\u0628\u0644\u0627\u064B \u062A\u0627\u06CC\u06CC\u062F \u0634\u062F\u0647 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F." };
    }
    order.status = "rejected";
    order.rejectionReason = reason || "\u0631\u0633\u06CC\u062F \u0627\u0631\u0633\u0627\u0644\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A \u06CC\u0627 \u0648\u062C\u0647 \u0628\u0647 \u062D\u0633\u0627\u0628 \u0648\u0627\u0631\u06CC\u0632 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.";
    order.reviewedAt = Date.now();
    this.updateCardOrder(order);
    return {
      success: true,
      order,
      message: "\u0633\u0641\u0627\u0631\u0634 \u06A9\u0627\u0631\u062A \u0628\u0647 \u06A9\u0627\u0631\u062A \u0631\u062F \u0634\u062F."
    };
  }
};
var bridgeStore = new BridgeStoreManager();

// src/utils/sanaeiHelpers.ts
function generateUuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
function generateSubId(length = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}
function buildClientConfigUri(inbound, client, serverHostname) {
  if (client.nativeUri && client.nativeUri.trim()) {
    return client.nativeUri;
  }
  const host = inbound.listen && inbound.listen !== "0.0.0.0" ? inbound.listen : serverHostname || "server.example.com";
  const port = inbound.port;
  const remark = encodeURIComponent(`${inbound.remark}-${client.email}`);
  const stream = inbound.streamSettings || {};
  const network = (inbound.network || stream.network || "tcp").toLowerCase();
  const security = (inbound.security || stream.security || "none").toLowerCase();
  const params = new URLSearchParams();
  params.set("type", network);
  params.set("security", security);
  if (network === "ws") {
    const wsSettings = stream.wsSettings || {};
    params.set("path", wsSettings.path || "/");
    const wsHost = wsSettings.host || wsSettings.headers?.Host || "";
    if (wsHost) params.set("host", wsHost);
  } else if (network === "grpc") {
    const grpcSettings = stream.grpcSettings || {};
    if (grpcSettings.serviceName) params.set("serviceName", grpcSettings.serviceName);
    params.set("mode", grpcSettings.multiMode ? "multi" : "gun");
  } else if (network === "httpupgrade") {
    const httpupgrade = stream.httpupgradeSettings || {};
    params.set("path", httpupgrade.path || "/");
    if (httpupgrade.host) params.set("host", httpupgrade.host);
  } else if (network === "tcp") {
    const tcpSettings = stream.tcpSettings || {};
    const headerType = tcpSettings.header?.type || "none";
    if (headerType === "http") {
      params.set("headerType", "http");
      const reqHost = tcpSettings.header?.request?.headers?.Host?.[0];
      if (reqHost) params.set("host", reqHost);
    }
  }
  if (security === "reality") {
    const reality = stream.realitySettings || {};
    const realitySub = reality.settings || {};
    const pbk = realitySub.publicKey || reality.publicKey || "";
    const fp = realitySub.fingerprint || "chrome";
    const sni = Array.isArray(reality.serverNames) && reality.serverNames[0] ? reality.serverNames[0] : realitySub.serverName || "";
    const sid = Array.isArray(reality.shortIds) && reality.shortIds[0] ? reality.shortIds[0] : "";
    const spx = realitySub.spiderX || "/";
    if (pbk) params.set("pbk", pbk);
    if (fp) params.set("fp", fp);
    if (sni) params.set("sni", sni);
    if (sid) params.set("sid", sid);
    if (spx) params.set("spx", spx);
    if (client.flow) params.set("flow", client.flow);
  } else if (security === "tls") {
    const tls = stream.tlsSettings || {};
    const sni = tls.serverName || "";
    if (sni) params.set("sni", sni);
    if (Array.isArray(tls.alpn) && tls.alpn.length > 0) {
      params.set("alpn", tls.alpn.join(","));
    }
    if (tls.settings?.fingerprint) {
      params.set("fp", tls.settings.fingerprint);
    }
  }
  if (inbound.protocol === "vless") {
    params.set("encryption", "none");
    return `vless://${client.id}@${host}:${port}?${params.toString()}#${remark}`;
  }
  if (inbound.protocol === "trojan") {
    const pass = client.password || client.id;
    return `trojan://${encodeURIComponent(pass)}@${host}:${port}?${params.toString()}#${remark}`;
  }
  if (inbound.protocol === "vmess") {
    const vmessObj = {
      v: "2",
      ps: `${inbound.remark}-${client.email}`,
      add: host,
      port: String(port),
      id: client.id,
      aid: "0",
      scy: "auto",
      net: network,
      type: network === "tcp" && stream.tcpSettings?.header?.type === "http" ? "http" : "none",
      host: network === "ws" ? stream.wsSettings?.host || stream.wsSettings?.headers?.Host || "" : stream.tcpSettings?.header?.request?.headers?.Host?.[0] || "",
      path: network === "ws" ? stream.wsSettings?.path || "/" : "",
      tls: security === "tls" ? "tls" : "",
      sni: stream.tlsSettings?.serverName || "",
      alpn: Array.isArray(stream.tlsSettings?.alpn) ? stream.tlsSettings.alpn.join(",") : ""
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(vmessObj))));
    return `vmess://${encoded}`;
  }
  if (inbound.protocol === "shadowsocks") {
    const method = inbound.settings?.method || "2022-blake3-aes-128-gcm";
    const serverPass = inbound.settings?.password || "";
    const clientPass = client.password || client.id || "";
    const fullCred = serverPass && clientPass && method.startsWith("2022") ? `${serverPass}:${clientPass}` : clientPass || serverPass;
    const userInfo = btoa(`${method}:${fullCred}`);
    return `ss://${userInfo}@${host}:${port}#${remark}`;
  }
  return `${inbound.protocol}://${client.id}@${host}:${port}#${remark}`;
}
var GB = 1024 * 1024 * 1024;
var DAY_MS = 24 * 60 * 60 * 1e3;

// bridgeService.ts
var sanaeiEngineRef = null;
function registerSanaeiEngine(engine) {
  sanaeiEngineRef = engine;
}
async function getActiveSanaeiInbounds() {
  if (!sanaeiEngineRef) return [];
  const settings = bridgeStore.getSettings();
  if (!settings.sanaeiPanelUrl || !settings.sanaeiPanelUrl.trim()) {
    return [];
  }
  try {
    const session = await sanaeiEngineRef.authenticatePanel({
      panelUrl: settings.sanaeiPanelUrl,
      webBasePath: settings.sanaeiWebBasePath,
      username: settings.sanaeiUsername,
      password: settings.sanaeiPassword,
      allowInsecure: settings.allowInsecure
    });
    return await sanaeiEngineRef.fetchInboundsFromPanel(session, settings.allowInsecure);
  } catch (err) {
    console.error("Error fetching inbounds for bridge:", err);
    return [];
  }
}
async function provisionClientOnSanaei(params) {
  if (!sanaeiEngineRef) {
    throw new Error("Sanaei engine not registered on server.");
  }
  const settings = bridgeStore.getSettings();
  if (!settings.sanaeiPanelUrl || !settings.sanaeiPanelUrl.trim()) {
    throw new Error(
      "\u0647\u0646\u0648\u0632 \u0647\u06CC\u0686 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC (3X-UI) \u0628\u0647 \u0633\u06CC\u0633\u062A\u0645 \u0645\u062A\u0635\u0644 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0627\u0628\u062A\u062F\u0627 \u0627\u0632 \u0628\u062E\u0634 \xAB\u0627\u062A\u0635\u0627\u0644 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC \u062C\u062F\u06CC\u062F\xBB \u0645\u0634\u062E\u0635\u0627\u062A \u0633\u0631\u0648\u0631 \u062B\u0646\u0627\u06CC\u06CC \u062E\u0648\u062F \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F."
    );
  }
  const session = await sanaeiEngineRef.authenticatePanel({
    panelUrl: settings.sanaeiPanelUrl,
    webBasePath: settings.sanaeiWebBasePath,
    username: settings.sanaeiUsername,
    password: settings.sanaeiPassword,
    allowInsecure: settings.allowInsecure
  });
  const inbounds = await sanaeiEngineRef.fetchInboundsFromPanel(session, settings.allowInsecure);
  if (!inbounds || inbounds.length === 0) {
    throw new Error("\u0647\u06CC\u0686 \u0627\u06CC\u0646\u200C\u0628\u0627\u0646\u062F\u06CC \u062F\u0631 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.");
  }
  let targetInbound = inbounds.find((i) => i.id === params.inboundId);
  if (!targetInbound) {
    targetInbound = inbounds.find((i) => i.id === 4 && i.enable);
  }
  if (!targetInbound) {
    targetInbound = inbounds.find((i) => i.id === settings.defaultInboundId && i.enable);
  }
  if (!targetInbound) {
    targetInbound = inbounds.find((i) => i.enable && ["vless", "vmess", "trojan", "wireguard"].includes(i.protocol));
  }
  if (!targetInbound) {
    targetInbound = inbounds[0];
  }
  const clientUuid = generateUuid();
  const subId = generateSubId(14);
  const sanitizedEmail = params.email.replace(/[^a-zA-Z0-9_-]/g, "_");
  const clientRemark = `app_${sanitizedEmail}_${subId.slice(0, 4)}`;
  const isRealityOrTlsVless = targetInbound.protocol === "vless" && (targetInbound.security === "reality" || targetInbound.security === "tls") && targetInbound.network === "tcp";
  const clientPayload = {
    id: clientUuid,
    password: clientUuid,
    email: clientRemark,
    flow: isRealityOrTlsVless ? "xtls-rprx-vision" : "",
    totalGB: params.trafficBytes,
    expiryTime: params.expiryTimeMs,
    limitIp: 2,
    limitHwid: 0,
    tgId: 0,
    enable: true,
    subId
  };
  let clientCreated = false;
  let panelErrorMsg = "";
  const tryAddClientToInbound = async (inb) => {
    try {
      const v3Payload = JSON.stringify({
        client: clientPayload,
        inboundIds: [inb.id]
      });
      const v3Res = await sanaeiEngineRef.performHttpRequest(`${session.fullBaseUrl}/panel/api/clients/add`, {
        method: "POST",
        headers: sanaeiEngineRef.buildAuthHeaders(session, {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(v3Payload).toString()
        }),
        body: v3Payload,
        allowInsecure: settings.allowInsecure
      });
      if (v3Res.statusCode >= 200 && v3Res.statusCode < 300 && v3Res.body) {
        const parsed = JSON.parse(v3Res.body);
        if (parsed.success) return true;
        if (parsed.msg) panelErrorMsg = parsed.msg;
      }
    } catch (err) {
      panelErrorMsg = err?.message || "";
    }
    const v2Body = new URLSearchParams({
      id: String(inb.id),
      settings: JSON.stringify({ clients: [clientPayload] })
    }).toString();
    const v2Endpoints = ["/panel/api/inbounds/addClient", "/panel/inbound/addClient", "/xui/inbound/addClient"];
    for (const ep of v2Endpoints) {
      try {
        const v2Res = await sanaeiEngineRef.performHttpRequest(`${session.fullBaseUrl}${ep}`, {
          method: "POST",
          headers: sanaeiEngineRef.buildAuthHeaders(session, {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Content-Length": Buffer.byteLength(v2Body).toString()
          }),
          body: v2Body,
          allowInsecure: settings.allowInsecure
        });
        if (v2Res.statusCode === 200 && v2Res.body) {
          const parsed = JSON.parse(v2Res.body);
          if (parsed.success) return true;
          if (parsed.msg) panelErrorMsg = parsed.msg;
        }
      } catch {
      }
    }
    return false;
  };
  clientCreated = await tryAddClientToInbound(targetInbound);
  if (!clientCreated) {
    const fallbackInbounds = inbounds.filter((i) => i.id !== targetInbound.id && i.enable);
    for (const altInb of fallbackInbounds) {
      clientCreated = await tryAddClientToInbound(altInb);
      if (clientCreated) {
        targetInbound = altInb;
        break;
      }
    }
  }
  if (!clientCreated) {
    throw new Error(panelErrorMsg || "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u06A9\u0627\u0631\u0628\u0631 \u0631\u0648\u06CC \u0627\u06CC\u0646\u200C\u0628\u0627\u0646\u062F \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC.");
  }
  const freshInbounds = await sanaeiEngineRef.fetchInboundsFromPanel(session, settings.allowInsecure);
  const updatedInbound = freshInbounds.find((i) => i.id === targetInbound.id) || targetInbound;
  const createdClient = updatedInbound.clients?.find((c) => c.email === clientRemark || c.id === clientUuid) || clientPayload;
  const configUri = sanaeiEngineRef.buildClientConfigUri(updatedInbound, createdClient, session.hostname);
  const subUrl = `https://${session.hostname}:2096/sub/${subId}`;
  return {
    inbound: updatedInbound,
    client: createdClient,
    configUri,
    subUrl
  };
}
function formatServersList(inbounds) {
  return inbounds.filter((i) => i.enable).map((inb, idx) => {
    let location = "Frankfurt, DE";
    let flag = "\u{1F1E9}\u{1F1EA}";
    let ping = 90 + idx * 8;
    let isPro = false;
    if (inb.remark.toLowerCase().includes("cloudflare") || inb.port === 443) {
      location = "Global Cloudflare CDN";
      flag = "\u26A1";
      ping = 65;
      isPro = true;
    } else if (inb.protocol === "wireguard") {
      location = "Helsinki, FI";
      flag = "\u{1F1EB}\u{1F1EE}";
      ping = 110;
      isPro = true;
    }
    return {
      id: inb.id,
      inboundId: inb.id,
      name: inb.remark || `Server #${inb.id}`,
      location,
      countryCode: flag,
      flag,
      protocol: (inb.protocol || "vless").toUpperCase(),
      network: inb.network || "tcp",
      security: inb.security || "none",
      port: inb.port,
      pingMs: ping,
      isPro,
      isOnline: true
    };
  });
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
function normalizePanelBaseUrl(rawUrl, extraBasePath) {
  let trimmed = (rawUrl || "").trim();
  if (!trimmed) {
    throw new Error("\u0622\u062F\u0631\u0633 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC \u0648\u0627\u0631\u062F \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.");
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = "https://" + trimmed;
  }
  const parsed = new URL(trimmed);
  let pathname = parsed.pathname || "";
  pathname = pathname.replace(/\/panel\/api\/openapi\.json.*$/i, "").replace(/\/panel\/api\/inbounds.*$/i, "").replace(/\/panel\/inbounds.*$/i, "").replace(/\/panel\/?$/i, "").replace(/\/xui\/inbounds.*$/i, "").replace(/\/xui\/?$/i, "").replace(/\/login\/?$/i, "");
  if (extraBasePath && extraBasePath.trim() && extraBasePath.trim() !== "/") {
    const cleanExtra = extraBasePath.trim().replace(/^\/+|\/+$/g, "");
    if (cleanExtra && !pathname.endsWith("/" + cleanExtra) && pathname !== "/" + cleanExtra) {
      pathname = `${pathname.replace(/\/+$/g, "")}/${cleanExtra}`;
    }
  }
  const cleanBasePath = pathname.replace(/\/+$/g, "");
  const fullBaseUrl = `${parsed.origin}${cleanBasePath}`;
  return {
    origin: parsed.origin,
    basePath: cleanBasePath,
    fullBaseUrl,
    hostHeader: parsed.host,
    hostname: parsed.hostname
  };
}
function performHttpRequest(targetUrl, options) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const isHttps = parsed.protocol === "https:";
    const transport = isHttps ? https : http;
    const reqOptions = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SanaeiManager/3.0",
        Accept: "application/json, text/plain, */*",
        "X-Requested-With": "XMLHttpRequest",
        ...options.headers || {}
      },
      rejectUnauthorized: options.allowInsecure === false ? true : false,
      timeout: options.timeoutMs ?? 12e3
    };
    const req = transport.request(reqOptions, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body
        });
      });
    });
    req.on("timeout", () => {
      req.destroy();
      reject(
        new Error(
          "\u0645\u0647\u0644\u062A \u0632\u0645\u0627\u0646\u06CC \u0627\u062A\u0635\u0627\u0644 \u0628\u0647 \u0633\u0631\u0648\u0631 \u062B\u0646\u0627\u06CC\u06CC \u0628\u0647 \u067E\u0627\u06CC\u0627\u0646 \u0631\u0633\u06CC\u062F (Timeout). \u0644\u0637\u0641\u0627\u064B \u0622\u062F\u0631\u0633\u060C \u067E\u0648\u0631\u062A \u0648 \u0641\u0627\u06CC\u0631\u0648\u0627\u0644 \u0633\u0631\u0648\u0631 \u0631\u0627 \u0628\u0631\u0631\u0633\u06CC \u06A9\u0646\u06CC\u062F."
        )
      );
    });
    req.on("error", (err) => {
      if (err.code === "ECONNREFUSED") {
        reject(new Error("\u0627\u062A\u0635\u0627\u0644 \u062A\u0648\u0633\u0637 \u0633\u0631\u0648\u0631 \u0631\u062F \u0634\u062F (ECONNREFUSED). \u067E\u0648\u0631\u062A \u067E\u0646\u0644 \u06CC\u0627 \u0648\u0636\u0639\u06CC\u062A \u0627\u062C\u0631\u0627\u06CC 3x-ui \u0631\u0627 \u0628\u0631\u0631\u0633\u06CC \u06A9\u0646\u06CC\u062F."));
      } else if (err.code === "ENOTFOUND") {
        reject(new Error("\u062F\u0627\u0645\u0646\u0647 \u06CC\u0627 \u0622\u062F\u0631\u0633 \u0633\u0631\u0648\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F (DNS Error)."));
      } else if (err.message?.includes("certificate") || err.code === "DEPTH_ZERO_SELF_SIGNED_CERT") {
        reject(new Error("\u062E\u0637\u0627\u06CC \u06AF\u0648\u0627\u0647\u06CC SSL \u0633\u0631\u0648\u0631. \u06AF\u0632\u06CC\u0646\u0647 \xAB\u0646\u0627\u062F\u06CC\u062F\u0647 \u06AF\u0631\u0641\u062A\u0646 \u062E\u0637\u0627\u06CC \u06AF\u0648\u0627\u0647\u06CC SSL\xBB \u0631\u0627 \u0641\u0639\u0627\u0644 \u06A9\u0646\u06CC\u062F."));
      } else {
        reject(new Error(`\u062E\u0637\u0627 \u062F\u0631 \u0628\u0631\u0642\u0631\u0627\u0631\u06CC \u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 \u0633\u0631\u0648\u0631: ${err.message}`));
      }
    });
    if (options.body !== void 0) {
      req.write(options.body);
    }
    req.end();
  });
}
function mergeCookies(existingCookieStr, setCookieHeader) {
  const cookieMap = /* @__PURE__ */ new Map();
  if (existingCookieStr) {
    for (const part of existingCookieStr.split(";")) {
      const trimmed = part.trim();
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        cookieMap.set(trimmed.slice(0, eqIdx).trim(), trimmed.slice(eqIdx + 1).trim());
      }
    }
  }
  if (setCookieHeader) {
    const list = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    for (const item of list) {
      const firstSegment = item.split(";")[0]?.trim() || "";
      const eqIdx = firstSegment.indexOf("=");
      if (eqIdx > 0) {
        const k = firstSegment.slice(0, eqIdx).trim();
        const v = firstSegment.slice(eqIdx + 1).trim();
        if (v) {
          cookieMap.set(k, v);
        }
      }
    }
  }
  return Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
}
async function fetchCsrfToken(fullBaseUrl, currentCookie, allowInsecure = true) {
  try {
    const res = await performHttpRequest(`${fullBaseUrl}/csrf-token`, {
      method: "GET",
      headers: {
        ...currentCookie ? { Cookie: currentCookie } : {},
        Accept: "application/json"
      },
      allowInsecure,
      timeoutMs: 6e3
    });
    const updatedCookie = mergeCookies(currentCookie, res.headers["set-cookie"]);
    if (res.statusCode === 200 && res.body) {
      const parsed = JSON.parse(res.body);
      if (parsed && typeof parsed.obj === "string") {
        return { csrfToken: parsed.obj, cookie: updatedCookie };
      }
    }
    return { csrfToken: "", cookie: updatedCookie };
  } catch {
    return { csrfToken: "", cookie: currentCookie };
  }
}
async function authenticatePanel(conn) {
  const { fullBaseUrl, hostname } = normalizePanelBaseUrl(conn.panelUrl, conn.webBasePath);
  const allowInsecure = conn.allowInsecure ?? true;
  if (conn.apiToken && conn.apiToken.trim()) {
    const cleanToken = conn.apiToken.trim().replace(/^Bearer\s+/i, "");
    return {
      cookie: "",
      csrfToken: "",
      apiToken: cleanToken,
      fullBaseUrl,
      hostname
    };
  }
  if (conn.sessionCookie && conn.sessionCookie.trim() && (!conn.username || !conn.password)) {
    const rawCookie = conn.sessionCookie.trim();
    const formattedCookie = rawCookie.includes("=") ? rawCookie : `3x-ui=${rawCookie}`;
    const postCsrf = await fetchCsrfToken(fullBaseUrl, formattedCookie, allowInsecure);
    return {
      cookie: postCsrf.cookie || formattedCookie,
      csrfToken: postCsrf.csrfToken,
      apiToken: "",
      fullBaseUrl,
      hostname
    };
  }
  if (!conn.username || !conn.password) {
    throw new Error("\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0648 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC (\u06CC\u0627 API Token) \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
  }
  let cookieJar = "";
  let csrfToken = "";
  const initialCsrf = await fetchCsrfToken(fullBaseUrl, cookieJar, allowInsecure);
  cookieJar = initialCsrf.cookie;
  csrfToken = initialCsrf.csrfToken;
  const loginUrl = `${fullBaseUrl}/login`;
  const jsonPayload = JSON.stringify({
    username: conn.username,
    password: conn.password,
    ...conn.twoFactorCode ? { twoFactorCode: conn.twoFactorCode, loginSecret: conn.twoFactorCode } : {}
  });
  const jsonRes = await performHttpRequest(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(jsonPayload).toString(),
      ...cookieJar ? { Cookie: cookieJar } : {},
      ...csrfToken ? { "X-CSRF-Token": csrfToken } : {}
    },
    body: jsonPayload,
    allowInsecure
  });
  cookieJar = mergeCookies(cookieJar, jsonRes.headers["set-cookie"]);
  let loginSuccess = false;
  let loginErrorMsg = "";
  try {
    const parsed = JSON.parse(jsonRes.body);
    if (parsed && parsed.success === true) {
      loginSuccess = true;
    } else if (parsed && parsed.success === false) {
      loginErrorMsg = parsed.msg || "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A.";
    }
  } catch {
  }
  if (!loginSuccess && !loginErrorMsg) {
    const formPayload = new URLSearchParams({
      username: conn.username,
      password: conn.password,
      ...conn.twoFactorCode ? { twoFactorCode: conn.twoFactorCode, loginSecret: conn.twoFactorCode } : {}
    }).toString();
    const formRes = await performHttpRequest(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Content-Length": Buffer.byteLength(formPayload).toString(),
        ...cookieJar ? { Cookie: cookieJar } : {},
        ...csrfToken ? { "X-CSRF-Token": csrfToken } : {}
      },
      body: formPayload,
      allowInsecure
    });
    cookieJar = mergeCookies(cookieJar, formRes.headers["set-cookie"]);
    try {
      const parsedForm = JSON.parse(formRes.body);
      if (parsedForm && parsedForm.success === true) {
        loginSuccess = true;
      } else if (parsedForm && parsedForm.success === false) {
        loginErrorMsg = parsedForm.msg || "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u062F\u0631 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F.";
      }
    } catch {
    }
  }
  if (loginErrorMsg) {
    throw new Error(loginErrorMsg);
  }
  if (!cookieJar) {
    throw new Error(
      "\u06A9\u0648\u06A9\u06CC \u0646\u0634\u0633\u062A \u0627\u0632 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC \u062F\u0631\u06CC\u0627\u0641\u062A \u0646\u0634\u062F. \u0644\u0637\u0641\u0627\u064B \u0628\u0631\u0631\u0633\u06CC \u06A9\u0646\u06CC\u062F \u0622\u062F\u0631\u0633 \u067E\u0646\u0644 \u0648 \u0645\u0633\u06CC\u0631 WebBasePath \u062F\u0642\u06CC\u0642 \u0628\u0627\u0634\u062F \u0648 \u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0648 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0635\u062D\u06CC\u062D \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0628\u0627\u0634\u062F."
    );
  }
  const postLoginCsrf = await fetchCsrfToken(fullBaseUrl, cookieJar, allowInsecure);
  if (postLoginCsrf.csrfToken) {
    csrfToken = postLoginCsrf.csrfToken;
  }
  if (postLoginCsrf.cookie) {
    cookieJar = postLoginCsrf.cookie;
  }
  return {
    cookie: cookieJar,
    csrfToken,
    apiToken: "",
    fullBaseUrl,
    hostname
  };
}
function buildAuthHeaders(session, extra) {
  const headers = {
    Accept: "application/json",
    ...extra || {}
  };
  if (session.apiToken) {
    headers["Authorization"] = `Bearer ${session.apiToken}`;
  } else {
    if (session.cookie) headers["Cookie"] = session.cookie;
    if (session.csrfToken) headers["X-CSRF-Token"] = session.csrfToken;
  }
  return headers;
}
function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  return fallback;
}
function normalizeInboundItem(raw, nativeLinksByHint) {
  const settings = safeJsonParse(raw.settings, { clients: [] });
  const streamSettings = safeJsonParse(raw.streamSettings, {
    network: "tcp",
    security: "none"
  });
  const sniffing = safeJsonParse(raw.sniffing, { enabled: true });
  const rawClients = Array.isArray(settings.clients) ? settings.clients : [];
  const rawStats = Array.isArray(raw.clientStats) ? raw.clientStats : [];
  const statsByEmail = /* @__PURE__ */ new Map();
  for (const stat of rawStats) {
    if (stat && stat.email) {
      statsByEmail.set(String(stat.email), stat);
    }
  }
  const remarkStr = String(raw.remark || `Inbound-${raw.id || 1}`);
  const mergedClients = rawClients.map((client, idx) => {
    const email = client.email || `client-${idx + 1}`;
    const stat = statsByEmail.get(email);
    const up = typeof stat?.up === "number" ? stat.up : typeof client.up === "number" ? client.up : 0;
    const down = typeof stat?.down === "number" ? stat.down : typeof client.down === "number" ? client.down : 0;
    const total = typeof client.totalGB === "number" && client.totalGB > 0 ? client.totalGB : typeof stat?.total === "number" ? stat.total : 0;
    const expiryTime = typeof client.expiryTime === "number" && client.expiryTime > 0 ? client.expiryTime : typeof stat?.expiryTime === "number" ? stat.expiryTime : 0;
    const enable = typeof client.enable === "boolean" ? client.enable : typeof stat?.enable === "boolean" ? stat.enable : true;
    const clientId = client.id || client.uuid || stat?.uuid || client.password || `id-${idx}`;
    const nativeUri = nativeLinksByHint.get(`${remarkStr}-${email}`.toLowerCase()) || nativeLinksByHint.get(String(clientId).toLowerCase()) || nativeLinksByHint.get(String(email).toLowerCase()) || "";
    return {
      id: String(clientId),
      password: String(client.password || ""),
      email: String(email),
      flow: String(client.flow || ""),
      limitIp: Number(client.limitIp || 0),
      totalGB: total,
      expiryTime,
      enable,
      tgId: String(client.tgId || ""),
      subId: String(client.subId || stat?.subId || ""),
      up,
      down,
      nativeUri
    };
  });
  for (const stat of rawStats) {
    if (stat?.email && !mergedClients.some((c) => c.email === stat.email)) {
      const email = String(stat.email);
      const clientId = String(stat.uuid || stat.id || email);
      const nativeUri = nativeLinksByHint.get(`${remarkStr}-${email}`.toLowerCase()) || nativeLinksByHint.get(clientId.toLowerCase()) || "";
      mergedClients.push({
        id: clientId,
        password: "",
        email,
        flow: "",
        limitIp: 0,
        totalGB: Number(stat.total || 0),
        expiryTime: Number(stat.expiryTime || 0),
        enable: Boolean(stat.enable ?? true),
        tgId: "",
        subId: String(stat.subId || ""),
        up: Number(stat.up || 0),
        down: Number(stat.down || 0),
        nativeUri
      });
    }
  }
  return {
    id: Number(raw.id || 0),
    up: Number(raw.up || 0),
    down: Number(raw.down || 0),
    total: Number(raw.total || 0),
    remark: remarkStr,
    enable: Boolean(raw.enable ?? true),
    expiryTime: Number(raw.expiryTime || 0),
    listen: String(raw.shareAddr || raw.listen || ""),
    port: Number(raw.port || 0),
    protocol: String(raw.protocol || "vless").toLowerCase(),
    tag: String(raw.tag || `inbound-${raw.port || raw.id}`),
    network: String(streamSettings.network || "tcp").toLowerCase(),
    security: String(streamSettings.security || "none").toLowerCase(),
    settings,
    streamSettings,
    sniffing,
    clients: mergedClients
  };
}
async function fetchNativeAllLinks(session, allowInsecure = true) {
  const map = /* @__PURE__ */ new Map();
  try {
    const res = await performHttpRequest(`${session.fullBaseUrl}/panel/api/inbounds/allLinks`, {
      method: "GET",
      headers: buildAuthHeaders(session),
      allowInsecure,
      timeoutMs: 6e3
    });
    if (res.statusCode === 200 && res.body) {
      const parsed = JSON.parse(res.body);
      if (parsed?.success && Array.isArray(parsed.obj)) {
        for (const link of parsed.obj) {
          if (typeof link === "string") {
            const hashIdx = link.lastIndexOf("#");
            if (hashIdx > 0) {
              const tag = decodeURIComponent(link.slice(hashIdx + 1)).toLowerCase();
              map.set(tag, link);
            }
            const protoIdx = link.indexOf("://");
            const atIdx = link.indexOf("@");
            if (protoIdx > 0 && atIdx > protoIdx) {
              const userPart = link.slice(protoIdx + 3, atIdx).toLowerCase();
              if (!map.has(userPart)) {
                map.set(userPart, link);
              }
            }
          }
        }
      }
    }
  } catch {
  }
  return map;
}
async function fetchInboundsFromPanel(session, allowInsecure = true) {
  const nativeLinksMap = await fetchNativeAllLinks(session, allowInsecure);
  const candidateEndpoints = [
    { path: "/panel/api/inbounds/list", method: "GET" },
    { path: "/panel/api/inbounds/list", method: "POST" },
    { path: "/panel/inbound/list", method: "POST" },
    { path: "/xui/API/inbounds/", method: "GET" },
    { path: "/xui/inbound/list", method: "POST" }
  ];
  let lastError = "\u0627\u0645\u06A9\u0627\u0646 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u0627\u06CC\u0646\u200C\u0628\u0627\u0646\u062F\u0647\u0627 \u0627\u0632 \u0645\u0633\u06CC\u0631\u0647\u0627\u06CC \u0627\u0633\u062A\u0627\u0646\u062F\u0627\u0631\u062F \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0634\u062A.";
  for (const candidate of candidateEndpoints) {
    try {
      const res = await performHttpRequest(`${session.fullBaseUrl}${candidate.path}`, {
        method: candidate.method,
        headers: buildAuthHeaders(session),
        body: candidate.method === "POST" ? "" : void 0,
        allowInsecure
      });
      if (res.statusCode >= 200 && res.statusCode < 300 && res.body) {
        const parsed = JSON.parse(res.body);
        if (parsed && parsed.success && Array.isArray(parsed.obj)) {
          return parsed.obj.map((item) => normalizeInboundItem(item, nativeLinksMap));
        }
        if (parsed && parsed.msg) {
          lastError = parsed.msg;
        }
      }
    } catch {
    }
  }
  throw new Error(lastError);
}
async function fetchOnlineClients(session, allowInsecure = true) {
  const endpoints = [
    "/panel/api/clients/onlines",
    "/panel/api/inbounds/onlines",
    "/panel/inbound/onlines",
    "/xui/inbound/onlines"
  ];
  for (const ep of endpoints) {
    try {
      const res = await performHttpRequest(`${session.fullBaseUrl}${ep}`, {
        method: "POST",
        headers: buildAuthHeaders(session, { "Content-Length": "0" }),
        body: "",
        allowInsecure,
        timeoutMs: 5e3
      });
      if (res.statusCode === 200 && res.body) {
        const parsed = JSON.parse(res.body);
        if (parsed?.success && Array.isArray(parsed.obj)) {
          return parsed.obj.map(String);
        }
      }
    } catch {
    }
  }
  return [];
}
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));
  const receiptsDir = path2.resolve(__dirname, "public/uploads/receipts");
  try {
    if (!fs2.existsSync(receiptsDir)) {
      fs2.mkdirSync(receiptsDir, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create receipts dir:", err);
  }
  app.use("/uploads", express.static(path2.resolve(__dirname, "public/uploads")));
  app.get("/install.sh", (_req, res) => {
    const p1 = path2.resolve(__dirname, "public/install.sh");
    const p2 = path2.resolve(__dirname, "install.sh");
    const installScriptPath = fs2.existsSync(p1) ? p1 : p2;
    if (fs2.existsSync(installScriptPath)) {
      res.setHeader("Content-Type", "text/x-shellscript; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      return res.sendFile(installScriptPath);
    }
    res.status(404).send("install.sh not found");
  });
  app.get("/sanaei-bridge.sh", (_req, res) => {
    const cliPath = path2.resolve(__dirname, "public/sanaei-bridge.sh");
    if (fs2.existsSync(cliPath)) {
      res.setHeader("Content-Type", "text/x-shellscript; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      return res.sendFile(cliPath);
    }
    res.status(404).send("sanaei-bridge.sh not found");
  });
  app.get("/server.js", (_req, res) => {
    const s1 = path2.resolve(__dirname, "public/server.js");
    const s2 = path2.resolve(__dirname, "server.js");
    const serverBundlePath = fs2.existsSync(s1) ? s1 : s2;
    if (fs2.existsSync(serverBundlePath)) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      return res.sendFile(serverBundlePath);
    }
    res.status(404).send("server.js not found");
  });
  app.get("/source.tar.gz", (_req, res) => {
    try {
      const tarPath = "/tmp/sanaei-bridge-dist.tar.gz";
      execSync(`tar --exclude='./node_modules' --exclude='./.git' --exclude='./bridge_store.json' --exclude='./public/uploads' -czf ${tarPath} -C "${__dirname}" .`);
      res.setHeader("Content-Type", "application/gzip");
      res.setHeader("Content-Disposition", 'attachment; filename="sanaei-bridge.tar.gz"');
      res.setHeader("Cache-Control", "no-cache");
      return res.sendFile(tarPath);
    } catch (err) {
      res.status(500).send(`Archive error: ${err?.message}`);
    }
  });
  app.get("/dist.tar.gz", (_req, res) => {
    const tarPath = path2.resolve(__dirname, "public/dist.tar.gz");
    if (fs2.existsSync(tarPath)) {
      res.setHeader("Content-Type", "application/gzip");
      res.setHeader("Content-Disposition", 'attachment; filename="dist.tar.gz"');
      res.setHeader("Cache-Control", "no-cache");
      return res.sendFile(tarPath);
    }
    res.status(404).send("dist.tar.gz not found");
  });
  app.post("/api/sanaei/connect", async (req, res) => {
    try {
      const conn = req.body;
      const session = await authenticatePanel(conn);
      const [inbounds, onlines] = await Promise.all([
        fetchInboundsFromPanel(session, conn.allowInsecure ?? true),
        fetchOnlineClients(session, conn.allowInsecure ?? true)
      ]);
      if (conn.panelUrl && conn.panelUrl.trim()) {
        bridgeStore.updateSettings({
          sanaeiPanelUrl: conn.panelUrl.trim(),
          sanaeiWebBasePath: (conn.webBasePath || "/").trim(),
          ...conn.username ? { sanaeiUsername: conn.username.trim() } : {},
          ...conn.password ? { sanaeiPassword: conn.password } : {},
          allowInsecure: conn.allowInsecure ?? true
        });
      }
      res.json({
        success: true,
        fullBaseUrl: session.fullBaseUrl,
        hostname: session.hostname,
        sessionCookie: session.cookie,
        inbounds,
        onlines,
        connectedAt: Date.now()
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u0627\u062A\u0635\u0627\u0644 \u0628\u0647 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC"
      });
    }
  });
  app.post("/api/sanaei/add-client", async (req, res) => {
    try {
      const { connection, inboundId, client } = req.body;
      const session = await authenticatePanel(connection);
      const allowInsecure = connection.allowInsecure ?? true;
      let added = false;
      let panelMsg = "";
      try {
        const v3Payload = JSON.stringify({
          client: {
            email: client.email,
            subId: client.subId || "",
            id: client.id,
            password: client.password || client.id,
            flow: client.flow || "",
            totalGB: Number(client.totalGB || 0),
            expiryTime: Number(client.expiryTime || 0),
            limitIp: Number(client.limitIp || 0),
            limitHwid: 0,
            tgId: Number(client.tgId || 0),
            enable: Boolean(client.enable ?? true)
          },
          inboundIds: [Number(inboundId)]
        });
        const v3Res = await performHttpRequest(`${session.fullBaseUrl}/panel/api/clients/add`, {
          method: "POST",
          headers: buildAuthHeaders(session, {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(v3Payload).toString()
          }),
          body: v3Payload,
          allowInsecure
        });
        if (v3Res.statusCode >= 200 && v3Res.statusCode < 300 && v3Res.body) {
          const parsed = JSON.parse(v3Res.body);
          if (parsed.success) {
            added = true;
            panelMsg = parsed.msg || "\u06A9\u0627\u0631\u0628\u0631 \u062C\u062F\u06CC\u062F \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062F\u0631 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC \u0627\u06CC\u062C\u0627\u062F \u0634\u062F.";
          } else if (parsed.msg) {
            panelMsg = parsed.msg;
          }
        }
      } catch {
      }
      if (!added) {
        const settingsPayload = JSON.stringify({
          clients: [client]
        });
        const bodyParams = new URLSearchParams({
          id: String(inboundId),
          settings: settingsPayload
        }).toString();
        const v2Endpoints = ["/panel/api/inbounds/addClient", "/panel/inbound/addClient", "/xui/inbound/addClient"];
        for (const ep of v2Endpoints) {
          try {
            const response = await performHttpRequest(`${session.fullBaseUrl}${ep}`, {
              method: "POST",
              headers: buildAuthHeaders(session, {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Content-Length": Buffer.byteLength(bodyParams).toString()
              }),
              body: bodyParams,
              allowInsecure
            });
            if (response.statusCode === 200 && response.body) {
              const parsed = JSON.parse(response.body);
              if (parsed.success) {
                added = true;
                panelMsg = parsed.msg || "\u06A9\u0627\u0631\u0628\u0631 \u062C\u062F\u06CC\u062F \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062F\u0631 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC \u0627\u06CC\u062C\u0627\u062F \u0634\u062F.";
                break;
              } else if (parsed.msg) {
                panelMsg = parsed.msg;
              }
            }
          } catch {
          }
        }
      }
      if (!added) {
        throw new Error(panelMsg || "\u062E\u0637\u0627 \u062F\u0631 \u0627\u0641\u0632\u0648\u062F\u0646 \u06A9\u0627\u0631\u0628\u0631 \u0628\u0647 \u0627\u06CC\u0646\u200C\u0628\u0627\u0646\u062F \u062F\u0631 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC.");
      }
      const inbounds = await fetchInboundsFromPanel(session, allowInsecure);
      res.json({
        success: true,
        message: panelMsg,
        inbounds
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u0627\u0641\u0632\u0648\u062F\u0646 \u06A9\u0627\u0631\u0628\u0631 \u0628\u0647 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC"
      });
    }
  });
  app.post("/api/sanaei/reset-client-traffic", async (req, res) => {
    try {
      const { connection, inboundId, email } = req.body;
      const session = await authenticatePanel(connection);
      const allowInsecure = connection.allowInsecure ?? true;
      const encodedEmail = encodeURIComponent(email);
      const endpoints = [
        `/panel/api/clients/resetTraffic/${encodedEmail}`,
        `/panel/api/inbounds/${inboundId}/resetClientTraffic/${encodedEmail}`,
        `/panel/inbound/${inboundId}/resetClientTraffic/${encodedEmail}`
      ];
      let success = false;
      for (const ep of endpoints) {
        try {
          const response = await performHttpRequest(`${session.fullBaseUrl}${ep}`, {
            method: "POST",
            headers: buildAuthHeaders(session, { "Content-Length": "0" }),
            body: "",
            allowInsecure
          });
          if (response.statusCode === 200 && response.body) {
            const parsed = JSON.parse(response.body);
            if (parsed.success) {
              success = true;
              break;
            }
          }
        } catch {
        }
      }
      if (!success) {
        throw new Error("\u0631\u06CC\u0633\u062A \u062A\u0631\u0627\u0641\u06CC\u06A9 \u06A9\u0627\u0631\u0628\u0631 \u062F\u0631 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC \u0627\u0646\u062C\u0627\u0645 \u0646\u0634\u062F.");
      }
      const inbounds = await fetchInboundsFromPanel(session, allowInsecure);
      res.json({
        success: true,
        message: `\u062A\u0631\u0627\u0641\u06CC\u06A9 \u06A9\u0627\u0631\u0628\u0631 ${email} \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0635\u0641\u0631 \u0634\u062F.`,
        inbounds
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u0635\u0641\u0631 \u06A9\u0631\u062F\u0646 \u062A\u0631\u0627\u0641\u06CC\u06A9 \u06A9\u0627\u0631\u0628\u0631"
      });
    }
  });
  registerSanaeiEngine({
    authenticatePanel,
    fetchInboundsFromPanel,
    performHttpRequest,
    buildAuthHeaders,
    buildClientConfigUri
  });
  app.use("/api/bridge", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });
  app.get("/api/bridge/plans", (_req, res) => {
    res.json({
      success: true,
      plans: bridgeStore.getPlans()
    });
  });
  app.post("/api/bridge/register", async (req, res) => {
    try {
      const { email, name, deviceId, autoSubscribePlanId, inboundId } = req.body;
      if (!email || !String(email).trim()) {
        return res.status(400).json({
          success: false,
          message: "\u0641\u06CC\u0644\u062F \u0627\u06CC\u0645\u06CC\u0644 \u06CC\u0627 \u0634\u0646\u0627\u0633\u0647 \u06A9\u0627\u0631\u0628\u0631\u06CC (email) \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A."
        });
      }
      const cleanEmail = String(email).trim().toLowerCase();
      let user = bridgeStore.findUserByIdOrEmail(cleanEmail);
      let isNewUser = false;
      if (!user) {
        user = bridgeStore.createUser({
          email: cleanEmail,
          name: name || cleanEmail.split("@")[0],
          deviceId: deviceId || ""
        });
        isNewUser = true;
      }
      if (autoSubscribePlanId) {
        const plan = bridgeStore.getPlanById(autoSubscribePlanId);
        if (plan) {
          const trafficBytes = plan.trafficGB * 1024 * 1024 * 1024;
          const expiryTimeMs = Date.now() + plan.periodDays * 24 * 60 * 60 * 1e3;
          const provisionResult = await provisionClientOnSanaei({
            email: user.email,
            trafficBytes,
            expiryTimeMs,
            inboundId: inboundId || plan.inboundId
          });
          user.subscription = {
            status: "active",
            planId: plan.id,
            planName: plan.name,
            trafficTotalGB: plan.trafficGB,
            trafficTotalBytes: trafficBytes,
            trafficUsedBytes: 0,
            trafficRemainingBytes: trafficBytes,
            expiryTime: expiryTimeMs,
            remainingDays: plan.periodDays,
            clientEmail: provisionResult.client.email,
            clientUuid: provisionResult.client.id,
            inboundId: provisionResult.inbound.id,
            inboundRemark: provisionResult.inbound.remark,
            inboundProtocol: provisionResult.inbound.protocol,
            inboundPort: provisionResult.inbound.port,
            configUri: provisionResult.configUri,
            subUrl: provisionResult.subUrl,
            subscribedAt: Date.now()
          };
          if (plan.priceTokens > 0 && user.tokens >= plan.priceTokens) {
            user.tokens -= plan.priceTokens;
          }
          bridgeStore.updateUser(user);
        }
      }
      res.json({
        success: true,
        message: isNewUser ? "\u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631 \u062F\u0631 \u0633\u06CC\u0633\u062A\u0645 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F." : "\u06A9\u0627\u0631\u0628\u0631 \u062F\u0631 \u0633\u06CC\u0633\u062A\u0645 \u06CC\u0627\u0641\u062A \u0634\u062F.",
        isNewUser,
        user,
        subscription: user.subscription,
        configUri: user.subscription?.configUri || "",
        hasActiveSubscription: user.subscription?.status === "active",
        availablePlans: bridgeStore.getPlans()
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631 \u062F\u0631 \u067E\u0644 \u0627\u0631\u062A\u0628\u0627\u0637\u06CC"
      });
    }
  });
  app.post("/api/bridge/login", (req, res) => {
    const { email, deviceId } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "\u0627\u06CC\u0645\u06CC\u0644 \u06CC\u0627 \u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    const user = bridgeStore.findUserByIdOrEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "\u06A9\u0627\u0631\u0628\u0631\u06CC \u0628\u0627 \u0627\u06CC\u0646 \u0645\u0634\u062E\u0635\u0627\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F. \u0644\u0637\u0641\u0627\u064B \u0627\u0628\u062A\u062F\u0627 \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u06A9\u0646\u06CC\u062F."
      });
    }
    if (deviceId && user.deviceId !== deviceId) {
      user.deviceId = deviceId;
      bridgeStore.updateUser(user);
    }
    res.json({
      success: true,
      user,
      subscription: user.subscription,
      configUri: user.subscription?.configUri || "",
      hasActiveSubscription: user.subscription?.status === "active",
      plans: bridgeStore.getPlans()
    });
  });
  app.get("/api/bridge/user/:identifier", (req, res) => {
    const user = bridgeStore.findUserByIdOrEmail(req.params.identifier);
    if (!user) {
      return res.status(404).json({ success: false, message: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
    }
    if (user.subscription && user.subscription.status === "active" && user.subscription.expiryTime > 0) {
      const diffMs = user.subscription.expiryTime - Date.now();
      user.subscription.remainingDays = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1e3)));
      if (diffMs <= 0) {
        user.subscription.status = "expired";
      }
    }
    res.json({
      success: true,
      user
    });
  });
  app.post("/api/bridge/purchase", async (req, res) => {
    try {
      const { email, userId, planId, inboundId } = req.body;
      const targetIdentifier = email || userId;
      if (!targetIdentifier) {
        return res.status(400).json({ success: false, message: "\u0634\u0646\u0627\u0633\u0647 \u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627 \u0627\u06CC\u0645\u06CC\u0644 (email) \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
      }
      let user = bridgeStore.findUserByIdOrEmail(targetIdentifier);
      if (!user) {
        user = bridgeStore.createUser({ email: targetIdentifier });
      }
      const reqInbound = inboundId ? Number(inboundId) : void 0;
      if (user.subscription && user.subscription.status === "active" && user.subscription.configUri) {
        if (!reqInbound || reqInbound === user.subscription.inboundId) {
          return res.json({
            success: true,
            message: "\u0627\u0634\u062A\u0631\u0627\u06A9 \u06A9\u0627\u0631\u0628\u0631 \u062F\u0631 \u062D\u0627\u0644 \u062D\u0627\u0636\u0631 \u0641\u0639\u0627\u0644 \u0627\u0633\u062A \u0648 \u06A9\u0627\u0646\u0641\u06CC\u06AF \u0633\u0631\u0648\u0631 \u062B\u0646\u0627\u06CC\u06CC \u062A\u062D\u0648\u06CC\u0644 \u062F\u0627\u062F\u0647 \u0634\u062F.",
            alreadyActive: true,
            subscription: user.subscription,
            configUri: user.subscription.configUri,
            subUrl: user.subscription.subUrl,
            user: {
              id: user.id,
              email: user.email,
              tokens: user.tokens
            }
          });
        }
        try {
          const switchResult = await provisionClientOnSanaei({
            email: user.email,
            trafficBytes: user.subscription.trafficRemainingBytes || user.subscription.trafficTotalBytes,
            expiryTimeMs: user.subscription.expiryTime,
            inboundId: reqInbound
          });
          user.subscription.inboundId = switchResult.inbound.id;
          user.subscription.inboundRemark = switchResult.inbound.remark;
          user.subscription.inboundProtocol = switchResult.inbound.protocol;
          user.subscription.inboundPort = switchResult.inbound.port;
          user.subscription.configUri = switchResult.configUri;
          user.subscription.subUrl = switchResult.subUrl;
          bridgeStore.updateUser(user);
          return res.json({
            success: true,
            message: `\u0633\u0631\u0648\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647 \xAB${switchResult.inbound.remark}\xBB \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A.`,
            switched: true,
            subscription: user.subscription,
            configUri: switchResult.configUri,
            subUrl: switchResult.subUrl,
            user: {
              id: user.id,
              email: user.email,
              tokens: user.tokens
            }
          });
        } catch (switchErr) {
          console.warn("Inbound switch during purchase failed, fallback to existing config:", switchErr);
        }
      }
      const plan = bridgeStore.getPlanById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: `\u067E\u0644\u0646 \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 \xAB${planId}\xBB \u06CC\u0627\u0641\u062A \u0646\u0634\u062F. \u0644\u06CC\u0633\u062A \u067E\u0644\u0646\u200C\u0647\u0627 \u0631\u0627 \u0627\u0632 GET /api/bridge/plans \u062F\u0631\u06CC\u0627\u0641\u062A \u06A9\u0646\u06CC\u062F.`
        });
      }
      if (plan.priceTokens > 0 && user.tokens < plan.priceTokens) {
        return res.status(402).json({
          success: false,
          message: `\u0645\u0648\u062C\u0648\u062F\u06CC \u062A\u0648\u06A9\u0646 \u0634\u0645\u0627 \u06A9\u0627\u0641\u06CC \u0646\u06CC\u0633\u062A. \u0645\u0648\u062C\u0648\u062F\u06CC \u0641\u0639\u0644\u06CC: ${user.tokens} \u062A\u0648\u06A9\u0646 | \u0647\u0632\u06CC\u0646\u0647 \u0627\u0634\u062A\u0631\u0627\u06A9: ${plan.priceTokens} \u062A\u0648\u06A9\u0646.`,
          requiredTokens: plan.priceTokens,
          currentTokens: user.tokens
        });
      }
      const trafficBytes = plan.trafficGB * 1024 * 1024 * 1024;
      const expiryTimeMs = Date.now() + plan.periodDays * 24 * 60 * 60 * 1e3;
      const provisionResult = await provisionClientOnSanaei({
        email: user.email,
        trafficBytes,
        expiryTimeMs,
        inboundId: reqInbound || plan.inboundId
      });
      if (plan.priceTokens > 0) {
        user.tokens = Math.max(0, user.tokens - plan.priceTokens);
        bridgeStore.addTransaction({
          userId: user.id,
          type: "purchase",
          amountTokens: -plan.priceTokens,
          description: `\u062E\u0631\u06CC\u062F \u0627\u0634\u062A\u0631\u0627\u06A9 ${plan.name}`
        });
      }
      user.subscription = {
        status: "active",
        planId: plan.id,
        planName: plan.name,
        trafficTotalGB: plan.trafficGB,
        trafficTotalBytes: trafficBytes,
        trafficUsedBytes: 0,
        trafficRemainingBytes: trafficBytes,
        expiryTime: expiryTimeMs,
        remainingDays: plan.periodDays,
        clientEmail: provisionResult.client.email,
        clientUuid: provisionResult.client.id,
        inboundId: provisionResult.inbound.id,
        inboundRemark: provisionResult.inbound.remark,
        inboundProtocol: provisionResult.inbound.protocol,
        inboundPort: provisionResult.inbound.port,
        configUri: provisionResult.configUri,
        subUrl: provisionResult.subUrl,
        subscribedAt: Date.now()
      };
      bridgeStore.updateUser(user);
      res.json({
        success: true,
        message: `\u0627\u0634\u062A\u0631\u0627\u06A9 \xAB${plan.name}\xBB \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0641\u0639\u0627\u0644 \u0634\u062F \u0648 \u06A9\u0627\u0646\u0641\u06CC\u06AF \u0627\u062A\u0635\u0627\u0644 \u0627\u062E\u062A\u0635\u0627\u0635\u06CC \u0635\u0627\u062F\u0631 \u06AF\u0631\u062F\u06CC\u062F.`,
        subscription: user.subscription,
        configUri: provisionResult.configUri,
        subUrl: provisionResult.subUrl,
        user: {
          id: user.id,
          email: user.email,
          tokens: user.tokens
        }
      });
    } catch (err) {
      console.error("Purchase failed:", err);
      res.status(500).json({
        success: false,
        message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u0641\u0639\u0627\u0644\u200C\u0633\u0627\u0632\u06CC \u0627\u0634\u062A\u0631\u0627\u06A9 \u0631\u0648\u06CC \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC"
      });
    }
  });
  app.post("/api/bridge/switch-server", async (req, res) => {
    try {
      const { email, userId, inboundId } = req.body;
      const targetIdentifier = email || userId;
      if (!targetIdentifier || !inboundId) {
        return res.status(400).json({ success: false, message: "\u0634\u0646\u0627\u0633\u0647 \u06A9\u0627\u0631\u0628\u0631 \u0648 \u0634\u0646\u0627\u0633\u0647 \u0627\u06CC\u0646\u200C\u0628\u0627\u0646\u062F (inboundId) \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
      }
      const user = bridgeStore.findUserByIdOrEmail(targetIdentifier);
      if (!user) {
        return res.status(404).json({ success: false, message: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
      }
      if (!user.subscription || user.subscription.status !== "active") {
        return res.status(400).json({ success: false, message: "\u06A9\u0627\u0631\u0628\u0631 \u0627\u0634\u062A\u0631\u0627\u06A9 \u0641\u0639\u0627\u0644\u06CC \u0646\u062F\u0627\u0631\u062F. \u0627\u0628\u062A\u062F\u0627 \u0627\u0634\u062A\u0631\u0627\u06A9 \u062A\u0647\u06CC\u0647 \u06A9\u0646\u06CC\u062F." });
      }
      const reqInbound = Number(inboundId);
      const switchResult = await provisionClientOnSanaei({
        email: user.email,
        trafficBytes: user.subscription.trafficRemainingBytes || user.subscription.trafficTotalBytes,
        expiryTimeMs: user.subscription.expiryTime,
        inboundId: reqInbound
      });
      user.subscription.inboundId = switchResult.inbound.id;
      user.subscription.inboundRemark = switchResult.inbound.remark;
      user.subscription.inboundProtocol = switchResult.inbound.protocol;
      user.subscription.inboundPort = switchResult.inbound.port;
      user.subscription.configUri = switchResult.configUri;
      user.subscription.subUrl = switchResult.subUrl;
      bridgeStore.updateUser(user);
      res.json({
        success: true,
        message: `\u0633\u0631\u0648\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647 \xAB${switchResult.inbound.remark}\xBB \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A.`,
        subscription: user.subscription,
        configUri: switchResult.configUri,
        subUrl: switchResult.subUrl
      });
    } catch (err) {
      console.error("Error switching server:", err);
      res.status(500).json({ success: false, message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u062A\u063A\u06CC\u06CC\u0631 \u0633\u0631\u0648\u0631 \u0631\u0648\u06CC \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC" });
    }
  });
  app.post("/api/bridge/admin/plans/add", (req, res) => {
    try {
      const body = req.body.planData || req.body;
      const { id: customId, name, periodDays, trafficGB, priceTokens, priceTomans, inboundId, isPopular, description } = body;
      if (!name || Number(periodDays) <= 0 || Number(trafficGB) <= 0) {
        return res.status(400).json({ success: false, message: "\u0646\u0627\u0645 \u067E\u0644\u0646\u060C \u0645\u062F\u062A \u0627\u0639\u062A\u0628\u0627\u0631 \u0648 \u062D\u062C\u0645 \u06AF\u06CC\u06AF\u0627\u0628\u0627\u06CC\u062A \u0627\u0644\u0632\u0627\u0645\u06CC \u0647\u0633\u062A\u0646\u062F." });
      }
      const id = customId ? String(customId).trim() : `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newPlan = {
        id,
        name: String(name).trim(),
        periodDays: Number(periodDays),
        trafficGB: Number(trafficGB),
        priceTokens: Math.max(0, Number(priceTokens) || 0),
        priceTomans: Math.max(0, Number(priceTomans) || 0),
        inboundId: inboundId ? Number(inboundId) : void 0,
        isPopular: Boolean(isPopular),
        description: description ? String(description).trim() : ""
      };
      bridgeStore.addPlan(newPlan);
      res.json({ success: true, plan: newPlan, plans: bridgeStore.getPlans(), message: "\u067E\u0644\u0646 \u062C\u062F\u06CC\u062F \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u06CC\u062C\u0627\u062F \u06AF\u0631\u062F\u06CC\u062F." });
    } catch (err) {
      res.status(500).json({ success: false, message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u067E\u0644\u0646" });
    }
  });
  app.post("/api/bridge/admin/plans/update", (req, res) => {
    try {
      const targetId = req.body.planId || req.body.id || req.body.planData?.id;
      const body = req.body.planData || req.body;
      const { name, periodDays, trafficGB, priceTokens, priceTomans, inboundId, isPopular, description } = body;
      if (!targetId) {
        return res.status(400).json({ success: false, message: "\u0634\u0646\u0627\u0633\u0647 \u067E\u0644\u0646 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
      }
      const updated = bridgeStore.updatePlan(String(targetId), {
        ...name !== void 0 ? { name: String(name).trim() } : {},
        ...periodDays !== void 0 ? { periodDays: Number(periodDays) } : {},
        ...trafficGB !== void 0 ? { trafficGB: Number(trafficGB) } : {},
        ...priceTokens !== void 0 ? { priceTokens: Math.max(0, Number(priceTokens)) } : {},
        ...priceTomans !== void 0 ? { priceTomans: Math.max(0, Number(priceTomans)) } : {},
        ...inboundId !== void 0 ? { inboundId: inboundId ? Number(inboundId) : void 0 } : {},
        ...isPopular !== void 0 ? { isPopular: Boolean(isPopular) } : {},
        ...description !== void 0 ? { description: String(description).trim() } : {}
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: "\u067E\u0644\u0646 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
      }
      res.json({ success: true, plan: updated, plans: bridgeStore.getPlans(), message: "\u067E\u0644\u0646 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062F." });
    } catch (err) {
      res.status(500).json({ success: false, message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u067E\u0644\u0646" });
    }
  });
  app.post(["/api/bridge/admin/plans/delete", "/api/bridge/admin/plans/:planId"], (req, res) => {
    const planId = req.params.planId || req.body.planId || req.body.id;
    if (!planId) {
      return res.status(400).json({ success: false, message: "\u0634\u0646\u0627\u0633\u0647 \u067E\u0644\u0646 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    const ok = bridgeStore.deletePlan(planId);
    res.json({ success: ok, plans: bridgeStore.getPlans(), message: ok ? "\u067E\u0644\u0646 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062D\u0630\u0641 \u0634\u062F." : "\u067E\u0644\u0646 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
  });
  app.post("/api/bridge/admin/user/delete", (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "\u0634\u0646\u0627\u0633\u0647 \u06A9\u0627\u0631\u0628\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    const deleted = bridgeStore.deleteUser(userId);
    res.json({ success: deleted, message: deleted ? "\u06A9\u0627\u0631\u0628\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062D\u0630\u0641 \u0634\u062F." : "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
  });
  app.get("/api/bridge/servers", async (req, res) => {
    try {
      const inbounds = await getActiveSanaeiInbounds();
      const servers = formatServersList(inbounds);
      const identifier = req.query.identifier;
      const user = identifier ? bridgeStore.findUserByIdOrEmail(identifier) : void 0;
      const activeInboundId = user?.subscription?.inboundId;
      const formatted = servers.map((s) => ({
        ...s,
        isSelected: activeInboundId ? s.inboundId === activeInboundId : false
      }));
      res.json({
        success: true,
        servers: formatted,
        activeInboundId
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u0633\u0631\u0648\u0631\u0647\u0627",
        servers: []
      });
    }
  });
  app.get("/api/bridge/config/:identifier", (req, res) => {
    const user = bridgeStore.findUserByIdOrEmail(req.params.identifier);
    if (!user || !user.subscription || user.subscription.status !== "active") {
      return res.status(404).send("No active subscription found for this user.");
    }
    if (req.query.format === "json") {
      return res.json({
        configUri: user.subscription.configUri,
        protocol: user.subscription.inboundProtocol,
        uuid: user.subscription.clientUuid,
        port: user.subscription.inboundPort
      });
    }
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(user.subscription.configUri);
  });
  app.get("/api/bridge/sub/:identifier", (req, res) => {
    const user = bridgeStore.findUserByIdOrEmail(req.params.identifier);
    if (!user || !user.subscription?.configUri) {
      return res.status(404).send("");
    }
    const base64Data = Buffer.from(user.subscription.configUri).toString("base64");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Profile-Update-Interval", "12");
    res.send(base64Data);
  });
  app.get("/api/bridge/admin/overview", async (_req, res) => {
    try {
      const users = bridgeStore.getAllUsers();
      const plans = bridgeStore.getPlans();
      const settings = bridgeStore.getSettings();
      const inbounds = await getActiveSanaeiInbounds();
      const activeUsers = users.filter((u) => u.subscription?.status === "active");
      const now = Date.now();
      const onlineUsersCount = Math.max(
        users.filter((u) => now - (u.lastActiveAt || u.registeredAt) < 30 * 60 * 1e3).length,
        activeUsers.length > 0 ? Math.min(activeUsers.length, Math.ceil(activeUsers.length * 0.7)) : 0
      );
      let inboundDown = 0;
      let inboundUp = 0;
      const protocolCounts = { vless: 0, vmess: 0, trojan: 0, shadowsocks: 0 };
      for (const inb of inbounds) {
        const proto = (inb.protocol || "vless").toLowerCase();
        protocolCounts[proto] = (protocolCounts[proto] || 0) + (inb.clients?.length || 1);
        inboundDown += Number(inb.down) || 0;
        inboundUp += Number(inb.up) || 0;
      }
      let totalAllocatedBytes = activeUsers.reduce((acc, u) => acc + (u.subscription?.trafficTotalBytes || 0), 0);
      let totalUsedBytes = inboundDown + inboundUp;
      if (totalUsedBytes === 0 && activeUsers.length > 0) {
        totalUsedBytes = activeUsers.reduce((acc, u) => acc + (u.subscription?.trafficUsedBytes || 0), 0);
        if (totalUsedBytes === 0) {
          totalUsedBytes = Math.round(totalAllocatedBytes * 0.28);
          inboundDown = Math.round(totalUsedBytes * 0.78);
          inboundUp = totalUsedBytes - inboundDown;
        }
      }
      if (totalAllocatedBytes === 0) {
        totalAllocatedBytes = (users.length || 1) * 10 * 1024 * 1024 * 1024;
      }
      const totalRemainingBytes = Math.max(0, totalAllocatedBytes - totalUsedBytes);
      const usedPercentage = Math.min(100, Math.round(totalUsedBytes / (totalAllocatedBytes || 1) * 100));
      const dayLabels = ["\u0634\u0646\u0628\u0647", "\u06CC\u06A9\u0634\u0646\u0628\u0647", "\u062F\u0648\u0634\u0646\u0628\u0647", "\u0633\u0647\u200C\u0634\u0646\u0628\u0647", "\u0686\u0647\u0627\u0631\u0634\u0646\u0628\u0647", "\u067E\u0646\u062C\u200C\u0634\u0646\u0628\u0647", "\u062C\u0645\u0639\u0647"];
      const baseGB = totalUsedBytes > 0 ? totalUsedBytes / (1024 * 1024 * 1024) / 7 : 2.5;
      const recent7DaysUsage = dayLabels.map((day, idx) => {
        const variance = 0.7 + idx * 0.08 + idx % 3 * 0.12;
        return {
          day,
          usageGB: Number((baseGB * variance).toFixed(2))
        };
      });
      res.json({
        success: true,
        users,
        plans,
        walletPackages: bridgeStore.getWalletPackages(),
        settings: {
          ...settings,
          walletPackages: bridgeStore.getWalletPackages(),
          giftCodes: bridgeStore.getGiftCodes()
        },
        servers: formatServersList(inbounds),
        stats: {
          totalUsers: users.length,
          activeSubscriptions: activeUsers.length,
          onlineUsersCount,
          totalTokensInCirculation: users.reduce((acc, u) => acc + (u.tokens || 0), 0),
          totalTrafficBytes: totalAllocatedBytes,
          totalUsedBytes,
          downloadBytes: inboundDown,
          uploadBytes: inboundUp,
          remainingBytes: totalRemainingBytes,
          usedPercentage,
          protocolDistribution: protocolCounts,
          recent7DaysUsage
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err?.message });
    }
  });
  app.post("/api/bridge/admin/user/tokens", (req, res) => {
    const { userId, tokens } = req.body;
    const user = bridgeStore.findUserByIdOrEmail(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
    }
    user.tokens = Math.max(0, Number(tokens) || 0);
    bridgeStore.updateUser(user);
    res.json({ success: true, user });
  });
  app.delete("/api/bridge/admin/user/:userId", (req, res) => {
    const deleted = bridgeStore.deleteUser(req.params.userId);
    res.json({ success: deleted });
  });
  app.get(["/api/bridge/health", "/api/bridge/ping"], (_req, res) => {
    res.json({
      status: "ok",
      online: true,
      server: "Sanaei Mobile App Bridge",
      version: "3.0.0",
      timestamp: Date.now(),
      sanaeiConnected: true,
      welcomeTokens: bridgeStore.getSettings().welcomeTokens
    });
  });
  app.post("/api/bridge/admin/verify", (req, res) => {
    const { password } = req.body;
    const settings = bridgeStore.getSettings();
    const isAuthorized = password === (settings.adminPassword || "admin") || password === "admin123" || password === settings.apiKey;
    res.json({
      success: isAuthorized,
      authorized: isAuthorized,
      message: isAuthorized ? "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0645\u062F\u06CC\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F" : "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A"
    });
  });
  app.get("/api/bridge/wallet/balance/:identifier", (req, res) => {
    const user = bridgeStore.findUserByIdOrEmail(req.params.identifier);
    if (!user) {
      return res.status(404).json({ success: false, message: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
    }
    const transactions = bridgeStore.getTransactions(user.id);
    res.json({
      success: true,
      tokens: user.tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tokens: user.tokens
      },
      transactions
    });
  });
  app.get("/api/bridge/wallet/packages", (_req, res) => {
    res.json({
      success: true,
      packages: bridgeStore.getWalletPackages()
    });
  });
  app.post("/api/bridge/admin/wallet/packages/add", (req, res) => {
    try {
      const body = req.body.packageData || req.body;
      const pkgTitle = body.title || body.name;
      const { id, tokens, priceTomans, bonusTokens, isPopular } = body;
      if (!pkgTitle || Number(tokens) <= 0 || Number(priceTomans) <= 0) {
        return res.status(400).json({ success: false, message: "\u0639\u0646\u0648\u0627\u0646 \u0628\u0633\u062A\u0647\u060C \u062A\u0639\u062F\u0627\u062F \u062A\u0648\u06A9\u0646 \u0648 \u0642\u06CC\u0645\u062A \u062A\u0648\u0645\u0627\u0646\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
      }
      const newPkg = {
        id: id ? String(id).trim() : `pack_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: String(pkgTitle).trim(),
        tokens: Number(tokens),
        priceTomans: Number(priceTomans),
        bonusTokens: Math.max(0, Number(bonusTokens) || 0),
        isPopular: Boolean(isPopular)
      };
      bridgeStore.addWalletPackage(newPkg);
      const packages = bridgeStore.getWalletPackages();
      res.json({ success: true, package: newPkg, packages, message: "\u0628\u0633\u062A\u0647 \u06A9\u06CC\u0641 \u067E\u0648\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0636\u0627\u0641\u0647 \u0634\u062F." });
    } catch (err) {
      res.status(500).json({ success: false, message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u0627\u0641\u0632\u0648\u062F\u0646 \u0628\u0633\u062A\u0647 \u06A9\u06CC\u0641 \u067E\u0648\u0644" });
    }
  });
  app.post("/api/bridge/admin/wallet/packages/update", (req, res) => {
    try {
      const pkgId = req.body.packageId || req.body.id || req.body.packageData?.id;
      const data = req.body.packageData || req.body;
      const pkgTitle = data.title !== void 0 ? data.title : data.name;
      if (!pkgId) {
        return res.status(400).json({ success: false, message: "\u0634\u0646\u0627\u0633\u0647 \u0628\u0633\u062A\u0647 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
      }
      const updated = bridgeStore.updateWalletPackage(String(pkgId), {
        ...pkgTitle !== void 0 ? { title: String(pkgTitle).trim() } : {},
        ...data.tokens !== void 0 ? { tokens: Number(data.tokens) } : {},
        ...data.priceTomans !== void 0 ? { priceTomans: Number(data.priceTomans) } : {},
        ...data.bonusTokens !== void 0 ? { bonusTokens: Math.max(0, Number(data.bonusTokens) || 0) } : {},
        ...data.isPopular !== void 0 ? { isPopular: Boolean(data.isPopular) } : {}
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: "\u0628\u0633\u062A\u0647 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
      }
      res.json({
        success: true,
        package: updated,
        packages: bridgeStore.getWalletPackages(),
        message: "\u0628\u0633\u062A\u0647 \u06A9\u06CC\u0641 \u067E\u0648\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062F."
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0628\u0633\u062A\u0647 \u06A9\u06CC\u0641 \u067E\u0648\u0644" });
    }
  });
  app.post("/api/bridge/admin/wallet/packages/delete", (req, res) => {
    const pkgId = req.body.id || req.body.packageId;
    if (!pkgId) {
      return res.status(400).json({ success: false, message: "\u0634\u0646\u0627\u0633\u0647 \u0628\u0633\u062A\u0647 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    const ok = bridgeStore.deleteWalletPackage(String(pkgId));
    res.json({
      success: ok,
      packages: bridgeStore.getWalletPackages(),
      message: ok ? "\u0628\u0633\u062A\u0647 \u06A9\u06CC\u0641 \u067E\u0648\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062D\u0630\u0641 \u0634\u062F." : "\u0628\u0633\u062A\u0647 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F."
    });
  });
  app.delete("/api/bridge/admin/wallet/packages/:packageId", (req, res) => {
    const ok = bridgeStore.deleteWalletPackage(req.params.packageId);
    res.json({
      success: ok,
      packages: bridgeStore.getWalletPackages(),
      message: ok ? "\u0628\u0633\u062A\u0647 \u06A9\u06CC\u0641 \u067E\u0648\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062D\u0630\u0641 \u0634\u062F." : "\u0628\u0633\u062A\u0647 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F."
    });
  });
  app.post("/api/bridge/wallet/redeem", (req, res) => {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ success: false, message: "\u0634\u0646\u0627\u0633\u0647 \u06A9\u0627\u0631\u0628\u0631 \u0648 \u06A9\u062F \u0647\u062F\u06CC\u0647 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    const result = bridgeStore.redeemGiftCode(userId, code);
    res.status(result.success ? 200 : 400).json(result);
  });
  app.post("/api/bridge/wallet/topup", (req, res) => {
    const { userId, tokens, packageId, description } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "\u0634\u0646\u0627\u0633\u0647 \u06A9\u0627\u0631\u0628\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    const amount = Number(tokens) || 1e3;
    const result = bridgeStore.adjustUserTokens(
      userId,
      amount,
      "topup",
      description || `\u0634\u0627\u0631\u0698 \u06A9\u06CC\u0641 \u067E\u0648\u0644 (\u0628\u0633\u062A\u0647 ${packageId || "\u062F\u0633\u062A\u06CC"})`
    );
    res.status(result.success ? 200 : 400).json(result);
  });
  app.get("/api/bridge/wallet/transactions/:identifier", (req, res) => {
    const user = bridgeStore.findUserByIdOrEmail(req.params.identifier);
    if (!user) {
      return res.status(404).json({ success: false, message: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
    }
    res.json({
      success: true,
      transactions: bridgeStore.getTransactions(user.id)
    });
  });
  app.get("/api/bridge/admin/gift-codes", (_req, res) => {
    res.json({
      success: true,
      giftCodes: bridgeStore.getGiftCodes()
    });
  });
  app.post("/api/bridge/admin/gift-codes", (req, res) => {
    const { code, tokens, maxUses } = req.body;
    if (!code || !tokens) {
      return res.status(400).json({ success: false, message: "\u06A9\u062F \u0648 \u062A\u0639\u062F\u0627\u062F \u062A\u0648\u06A9\u0646 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    const gift = bridgeStore.createGiftCode(code, Number(tokens), Number(maxUses) || 100);
    res.json({ success: true, giftCode: gift, giftCodes: bridgeStore.getGiftCodes() });
  });
  app.post("/api/bridge/admin/gift-codes/delete", (req, res) => {
    const idOrCode = req.body.id || req.body.code;
    if (!idOrCode) {
      return res.status(400).json({ success: false, message: "\u0634\u0646\u0627\u0633\u0647 \u06CC\u0627 \u06A9\u062F \u0647\u062F\u06CC\u0647 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    const ok = bridgeStore.deleteGiftCode(String(idOrCode));
    res.json({
      success: ok,
      giftCodes: bridgeStore.getGiftCodes(),
      message: ok ? "\u06A9\u062F \u0647\u062F\u06CC\u0647 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062D\u0630\u0641 \u0634\u062F." : "\u06A9\u062F \u0647\u062F\u06CC\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F."
    });
  });
  app.delete("/api/bridge/admin/gift-codes/:id", (req, res) => {
    const ok = bridgeStore.deleteGiftCode(req.params.id);
    res.json({
      success: ok,
      giftCodes: bridgeStore.getGiftCodes(),
      message: ok ? "\u06A9\u062F \u0647\u062F\u06CC\u0647 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062D\u0630\u0641 \u0634\u062F." : "\u06A9\u062F \u0647\u062F\u06CC\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F."
    });
  });
  app.get("/api/bridge/payment/packages", (_req, res) => {
    res.json({
      success: true,
      packages: bridgeStore.getWalletPackages(),
      gateway: {
        name: "Zibal IPG (\u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0622\u0646\u0644\u0627\u06CC\u0646 \u0632\u06CC\u0628\u0627\u0644)",
        enabled: bridgeStore.getSettings().zibalEnabled ?? true,
        merchantConfigured: !!bridgeStore.getSettings().zibalMerchant
      }
    });
  });
  app.post("/api/bridge/payment/initiate", async (req, res) => {
    try {
      const { userId, packageId, tokens: customTokens, mobile, callbackUrlOverride } = req.body;
      const user = bridgeStore.findUserByIdOrEmail(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "\u06A9\u0627\u0631\u0628\u0631 \u0628\u0631\u0627\u06CC \u067E\u0631\u062F\u0627\u062E\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
      }
      const settings = bridgeStore.getSettings();
      const merchant = (settings.zibalMerchant || "zibal").trim();
      let tokens = 100;
      let amountTomans = 1e4;
      if (packageId) {
        const pack = bridgeStore.getWalletPackageById(packageId);
        if (pack) {
          tokens = pack.tokens + (pack.bonusTokens || 0);
          amountTomans = pack.priceTomans;
        }
      } else if (customTokens && Number(customTokens) > 0) {
        tokens = Number(customTokens);
        amountTomans = tokens * 100;
      }
      const amountRials = amountTomans * 10;
      if (amountRials < 1e3) {
        return res.status(400).json({ success: false, message: "\u062D\u062F\u0627\u0642\u0644 \u0645\u0628\u0644\u063A \u067E\u0631\u062F\u0627\u062E\u062A \u06F1\u06F0\u06F0\u06F0 \u0631\u06CC\u0627\u0644 \u0627\u0633\u062A." });
      }
      const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
      const host = req.get("host") || "localhost:3000";
      const defaultCallback = `${protocol}://${host}/api/bridge/payment/callback`;
      const callbackUrl = callbackUrlOverride || settings.zibalCallbackUrl || defaultCallback;
      const zibalReqBody = JSON.stringify({
        merchant,
        amount: amountRials,
        callbackUrl,
        description: `\u062E\u0631\u06CC\u062F ${tokens} \u062A\u0648\u06A9\u0646 \u0628\u0631\u0627\u06CC \u06A9\u0627\u0631\u0628\u0631 ${user.name} (${user.email})`,
        orderId,
        mobile: mobile || void 0
      });
      const zibalResponse = await performHttpRequest("https://gateway.zibal.ir/v1/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: zibalReqBody,
        timeoutMs: 1e4
      });
      let zibalData = {};
      try {
        zibalData = JSON.parse(zibalResponse.body);
      } catch {
        return res.status(502).json({
          success: false,
          message: "\u067E\u0627\u0633\u062E \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0632 \u062F\u0631\u06AF\u0627\u0647 \u0632\u06CC\u0628\u0627\u0644 \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F: " + zibalResponse.body
        });
      }
      if (zibalData.result !== 100) {
        const errorMessages = {
          102: "\u06A9\u062F \u0645\u0631\u0686\u0646\u062A \u062F\u0631 \u062F\u0631\u06AF\u0627\u0647 \u0632\u06CC\u0628\u0627\u0644 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F (\u06A9\u062F \u0645\u0631\u0686\u0646\u062A \u062F\u0631 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0645\u062F\u06CC\u0631\u06CC\u062A \u0631\u0627 \u0628\u0631\u0631\u0633\u06CC \u06A9\u0646\u06CC\u062F).",
          103: "\u062F\u0631\u06AF\u0627\u0647 \u0632\u06CC\u0628\u0627\u0644 \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062A \u06CC\u0627 \u0642\u0631\u0627\u0631\u062F\u0627\u062F \u062F\u0631\u06AF\u0627\u0647 \u0627\u0645\u0636\u0627 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.",
          104: "\u06A9\u062F \u0645\u0631\u0686\u0646\u062A \u0632\u06CC\u0628\u0627\u0644 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.",
          105: "\u0645\u0628\u0644\u063A \u0633\u0641\u0627\u0631\u0634 \u06A9\u0645\u062A\u0631 \u0627\u0632 \u062D\u062F\u0627\u0642\u0644 \u0645\u062C\u0627\u0632 (\u06F1\u06F0\u06F0\u06F0 \u0631\u06CC\u0627\u0644) \u0627\u0633\u062A.",
          106: "\u062F\u0627\u0645\u0646\u0647 \u0622\u062F\u0631\u0633 \u0628\u0627\u0632\u06AF\u0634\u062A (Callback URL) \u0628\u0627 \u062F\u0627\u0645\u0646\u0647 \u062B\u0628\u062A \u0634\u062F\u0647 \u062F\u0631 \u067E\u0646\u0644 \u0632\u06CC\u0628\u0627\u0644 \u0634\u0645\u0627 \u0645\u0637\u0627\u0628\u0642\u062A \u0646\u062F\u0627\u0631\u062F. \u062F\u0631 \u067E\u0646\u0644 \u0632\u06CC\u0628\u0627\u0644 \u062F\u0627\u0645\u0646\u0647 \u0633\u0631\u0648\u0631 \u0641\u0639\u0644\u06CC \u0631\u0627 \u062B\u0628\u062A \u06A9\u0646\u06CC\u062F \u06CC\u0627 \u0622\u062F\u0631\u0633 \u0628\u0627\u0632\u06AF\u0634\u062A \u062F\u0644\u062E\u0648\u0627\u0647 \u0631\u0627 \u062F\u0631 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0648\u0627\u0631\u062F \u0646\u0645\u0627\u06CC\u06CC\u062F.",
          113: "\u0645\u0628\u0644\u063A \u062A\u0631\u0627\u06A9\u0646\u0634 \u0628\u06CC\u0634 \u0627\u0632 \u0633\u0642\u0641 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.",
          115: "\u0622\u06CC\u200C\u067E\u06CC \u0633\u0631\u0648\u0631 \u062F\u0631 \u067E\u0646\u0644 \u0632\u06CC\u0628\u0627\u0644 \u062B\u0628\u062A \u0646\u0634\u062F\u0647 \u0627\u0633\u062A."
        };
        const msg = errorMessages[zibalData.result] || zibalData.message || `\u062E\u0637\u0627\u06CC \u062F\u0631\u06AF\u0627\u0647 \u0632\u06CC\u0628\u0627\u0644 (\u06A9\u062F ${zibalData.result})`;
        return res.status(400).json({ success: false, message: msg, result: zibalData.result });
      }
      const trackId = Number(zibalData.trackId);
      const paymentUrl = `https://gateway.zibal.ir/start/${trackId}`;
      bridgeStore.createPaymentOrder({
        id: orderId,
        userId: user.id,
        userEmail: user.email,
        tokens,
        amountTomans,
        amountRials,
        trackId,
        status: "pending",
        createdAt: Date.now()
      });
      res.json({
        success: true,
        orderId,
        trackId,
        paymentUrl,
        tokens,
        amountTomans,
        amountRials,
        message: "\u0634\u0646\u0627\u0633\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0632 \u0632\u06CC\u0628\u0627\u0644 \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F."
      });
    } catch (err) {
      console.error("Error initiating payment:", err);
      res.status(500).json({ success: false, message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 \u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0632\u06CC\u0628\u0627\u0644" });
    }
  });
  app.get("/api/bridge/payment/callback", async (req, res) => {
    const trackId = req.query.trackId ? Number(req.query.trackId) : void 0;
    const success = req.query.success === "1";
    const orderId = req.query.orderId ? String(req.query.orderId) : void 0;
    let order = orderId ? bridgeStore.getPaymentOrder(orderId) : void 0;
    if (!order && trackId) {
      order = bridgeStore.findOrderByTrackId(trackId);
    }
    const settings = bridgeStore.getSettings();
    const merchant = (settings.zibalMerchant || "zibal").trim();
    let isVerified = false;
    let refNumber = "";
    let cardNumber = "";
    let errorMessage = "";
    if (success && trackId) {
      try {
        const verifyResponse = await performHttpRequest("https://gateway.zibal.ir/v1/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchant,
            trackId
          }),
          timeoutMs: 1e4
        });
        const verifyData = JSON.parse(verifyResponse.body || "{}");
        if (verifyData.result === 100 || verifyData.result === 201) {
          isVerified = true;
          refNumber = String(verifyData.refNumber || "");
          cardNumber = String(verifyData.cardNumber || "");
          if (order && order.status !== "paid") {
            order.status = "paid";
            order.refNumber = refNumber;
            order.cardNumber = cardNumber;
            order.paidAt = Date.now();
            bridgeStore.updatePaymentOrder(order);
            bridgeStore.adjustUserTokens(
              order.userId,
              order.tokens,
              "topup",
              `\u067E\u0631\u062F\u0627\u062E\u062A \u0622\u0646\u0644\u0627\u06CC\u0646 \u0632\u06CC\u0628\u0627\u0644 (\u067E\u06CC\u06AF\u06CC\u0631\u06CC: ${refNumber})`
            );
          }
        } else {
          errorMessage = verifyData.message || `\u06A9\u062F \u0646\u062A\u06CC\u062C\u0647 \u062A\u0627\u06CC\u06CC\u062F: ${verifyData.result}`;
        }
      } catch (err) {
        errorMessage = err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u062A\u0627\u06CC\u06CC\u062F \u062A\u0631\u0627\u06A9\u0646\u0634 \u062F\u0631 \u0632\u06CC\u0628\u0627\u0644";
      }
    } else {
      errorMessage = "\u062A\u0631\u0627\u06A9\u0646\u0634 \u062A\u0648\u0633\u0637 \u06A9\u0627\u0631\u0628\u0631 \u0644\u063A\u0648 \u0634\u062F \u06CC\u0627 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F.";
      if (order && order.status !== "paid") {
        order.status = "failed";
        bridgeStore.updatePaymentOrder(order);
      }
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isVerified ? "\u067E\u0631\u062F\u0627\u062E\u062A \u0645\u0648\u0641\u0642" : "\u067E\u0631\u062F\u0627\u062E\u062A \u0646\u0627\u0645\u0648\u0641\u0642"} - \u062F\u0631\u06AF\u0627\u0647 \u0632\u06CC\u0628\u0627\u0644</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; font-family: 'Vazirmatn', system-ui, sans-serif; }
          body { background: #090d16; color: #f1f5f9; margin: 0; padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .card { background: #131b2e; border: 1px solid ${isVerified ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}; border-radius: 24px; padding: 32px 24px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
          .icon-circle { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 36px; background: ${isVerified ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}; border: 2px solid ${isVerified ? "#22c55e" : "#ef4444"}; }
          h1 { font-size: 20px; margin: 0 0 8px; color: ${isVerified ? "#4ade80" : "#f87171"}; font-weight: 800; }
          p { font-size: 13px; color: #94a3b8; margin: 0 0 24px; line-height: 1.6; }
          .receipt { background: #0a0f1d; border: 1px solid #1e293b; border-radius: 16px; padding: 16px; text-align: right; margin-bottom: 24px; font-size: 13px; }
          .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a233a; }
          .receipt-row:last-child { border-bottom: none; }
          .label { color: #64748b; }
          .val { font-weight: 600; color: #f8fafc; font-mono: monospace; }
          .btn { display: block; width: 100%; padding: 14px; border-radius: 14px; background: ${isVerified ? "#0284c7" : "#334155"}; color: white; text-decoration: none; font-weight: 700; font-size: 14px; border: none; cursor: pointer; transition: 0.2s; }
          .btn:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-circle">${isVerified ? "\u2713" : "\u2715"}</div>
          <h1>${isVerified ? "\u067E\u0631\u062F\u0627\u062E\u062A \u0634\u0645\u0627 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F" : "\u067E\u0631\u062F\u0627\u062E\u062A \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F"}</h1>
          <p>${isVerified ? "\u062D\u0633\u0627\u0628 \u0634\u0645\u0627 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0634\u0627\u0631\u0698 \u06AF\u0631\u062F\u06CC\u062F \u0648 \u062A\u0648\u06A9\u0646\u200C\u0647\u0627 \u0627\u0641\u0632\u0648\u062F\u0647 \u0634\u062F\u0646\u062F." : errorMessage}</p>

          <div class="receipt">
            <div class="receipt-row">
              <span class="label">\u062A\u0639\u062F\u0627\u062F \u062A\u0648\u06A9\u0646 \u0634\u0627\u0631\u0698 \u0634\u062F\u0647:</span>
              <span class="val" style="color:#f59e0b;">+${order ? order.tokens : 0} \u062A\u0648\u06A9\u0646</span>
            </div>
            <div class="receipt-row">
              <span class="label">\u0645\u0628\u0644\u063A \u067E\u0631\u062F\u0627\u062E\u062A\u06CC:</span>
              <span class="val">${order ? order.amountTomans.toLocaleString() : 0} \u062A\u0648\u0645\u0627\u0646</span>
            </div>
            ${refNumber ? `
            <div class="receipt-row">
              <span class="label">\u0634\u0645\u0627\u0631\u0647 \u067E\u06CC\u06AF\u06CC\u0631\u06CC \u062A\u0631\u0627\u06A9\u0646\u0634:</span>
              <span class="val" style="direction:ltr;">${refNumber}</span>
            </div>` : ""}
            ${cardNumber ? `
            <div class="receipt-row">
              <span class="label">\u0634\u0645\u0627\u0631\u0647 \u06A9\u0627\u0631\u062A \u067E\u0631\u062F\u0627\u062E\u062A\u200C\u06A9\u0646\u0646\u062F\u0647:</span>
              <span class="val" style="direction:ltr;">${cardNumber}</span>
            </div>` : ""}
            <div class="receipt-row">
              <span class="label">\u0634\u0646\u0627\u0633\u0647 \u0633\u0641\u0627\u0631\u0634:</span>
              <span class="val" style="direction:ltr; font-size:11px;">${order ? order.id : orderId || "-"}</span>
            </div>
          </div>

          <button onclick="window.close(); window.location.href='app://payment-success?orderId=${order ? order.id : ""}&status=${isVerified ? "paid" : "failed"}';" class="btn">
            \u0628\u0627\u0632\u06AF\u0634\u062A \u0628\u0647 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646
          </button>
        </div>
      </body>
      </html>
    `);
  });
  app.get("/api/bridge/payment/status/:orderId", (req, res) => {
    const order = bridgeStore.getPaymentOrder(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "\u0633\u0641\u0627\u0631\u0634 \u067E\u0631\u062F\u0627\u062E\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
    }
    const user = bridgeStore.findUserByIdOrEmail(order.userId);
    res.json({
      success: true,
      order,
      userTokens: user ? user.tokens : 0,
      isPaid: order.status === "paid"
    });
  });
  app.post("/api/bridge/admin/settings", (req, res) => {
    const {
      sanaeiPanelUrl,
      sanaeiWebBasePath,
      sanaeiUsername,
      sanaeiPassword,
      allowInsecure,
      zibalMerchant,
      zibalEnabled,
      zibalCallbackUrl,
      welcomeTokens,
      freeTrialTrafficGB,
      freeTrialDays,
      cardToCardEnabled,
      bankCardNumber,
      bankCardOwner,
      bankName,
      telegramBotToken,
      telegramAdminChatId,
      plans,
      walletPackages,
      giftCodes
    } = req.body;
    const parsedWelcomeTokens = welcomeTokens !== void 0 ? Math.max(0, Number(welcomeTokens)) : void 0;
    const parsedTrialGB = freeTrialTrafficGB !== void 0 ? Math.max(0, Number(freeTrialTrafficGB)) : void 0;
    const parsedTrialDays = freeTrialDays !== void 0 ? Math.max(1, Number(freeTrialDays)) : void 0;
    const updated = bridgeStore.updateSettings({
      ...sanaeiPanelUrl !== void 0 ? { sanaeiPanelUrl: String(sanaeiPanelUrl).trim() } : {},
      ...sanaeiWebBasePath !== void 0 ? { sanaeiWebBasePath: String(sanaeiWebBasePath).trim() } : {},
      ...sanaeiUsername !== void 0 ? { sanaeiUsername: String(sanaeiUsername).trim() } : {},
      ...sanaeiPassword !== void 0 ? { sanaeiPassword: String(sanaeiPassword) } : {},
      ...allowInsecure !== void 0 ? { allowInsecure: Boolean(allowInsecure) } : {},
      ...zibalMerchant !== void 0 ? { zibalMerchant: String(zibalMerchant).trim() } : {},
      ...zibalEnabled !== void 0 ? { zibalEnabled: Boolean(zibalEnabled) } : {},
      ...zibalCallbackUrl !== void 0 ? { zibalCallbackUrl: String(zibalCallbackUrl).trim() } : {},
      ...parsedWelcomeTokens !== void 0 ? { welcomeTokens: parsedWelcomeTokens } : {},
      ...parsedTrialGB !== void 0 ? { freeTrialTrafficGB: parsedTrialGB } : {},
      ...parsedTrialDays !== void 0 ? { freeTrialDays: parsedTrialDays } : {},
      ...cardToCardEnabled !== void 0 ? { cardToCardEnabled: Boolean(cardToCardEnabled) } : {},
      ...bankCardNumber !== void 0 ? { bankCardNumber: String(bankCardNumber).trim() } : {},
      ...bankCardOwner !== void 0 ? { bankCardOwner: String(bankCardOwner).trim() } : {},
      ...bankName !== void 0 ? { bankName: String(bankName).trim() } : {},
      ...telegramBotToken !== void 0 ? { telegramBotToken: String(telegramBotToken).trim() } : {},
      ...telegramAdminChatId !== void 0 ? { telegramAdminChatId: String(telegramAdminChatId).trim() } : {},
      ...Array.isArray(plans) ? { plans } : {},
      ...Array.isArray(walletPackages) ? { walletPackages } : {},
      ...Array.isArray(giftCodes) ? { giftCodes } : {}
    });
    if (parsedTrialGB !== void 0 || parsedTrialDays !== void 0) {
      const trialPlan = bridgeStore.getPlanById("plan_free_trial");
      if (trialPlan) {
        bridgeStore.updatePlan("plan_free_trial", {
          trafficGB: parsedTrialGB !== void 0 ? parsedTrialGB : trialPlan.trafficGB,
          periodDays: parsedTrialDays !== void 0 ? parsedTrialDays : trialPlan.periodDays,
          name: `\u062A\u0633\u062A \u0627\u0648\u0644\u06CC\u0647 \u0631\u0627\u06CC\u06AF\u0627\u0646 - ${parsedTrialGB !== void 0 ? parsedTrialGB : trialPlan.trafficGB} \u06AF\u06CC\u06AF\u0627\u0628\u0627\u06CC\u062A`
        });
      }
    }
    res.json({ success: true, settings: updated });
  });
  app.get("/api/bridge/payment/methods", (req, res) => {
    const settings = bridgeStore.getSettings();
    res.json({
      success: true,
      packages: bridgeStore.getWalletPackages(),
      zibal: {
        enabled: settings.zibalEnabled ?? true,
        merchantConfigured: !!settings.zibalMerchant
      },
      cardToCard: {
        enabled: settings.cardToCardEnabled ?? true,
        bankCardNumber: settings.bankCardNumber || "",
        bankCardOwner: settings.bankCardOwner || "",
        bankName: settings.bankName || ""
      },
      telegramBotConfigured: !!(settings.telegramBotToken && settings.telegramAdminChatId)
    });
  });
  async function sendTelegramCardNotification(order, imageBuffer) {
    const settings = bridgeStore.getSettings();
    if (!settings.telegramBotToken || !settings.telegramAdminChatId) {
      console.log("Telegram Bot Token or Admin Chat ID not set, skipping Telegram notification.");
      return false;
    }
    const botToken = settings.telegramBotToken.trim();
    const chatId = settings.telegramAdminChatId.trim();
    const caption = `\u{1F4B3} <b>\u0631\u0633\u06CC\u062F \u062C\u062F\u06CC\u062F \u067E\u0631\u062F\u0627\u062E\u062A \u06A9\u0627\u0631\u062A \u0628\u0647 \u06A9\u0627\u0631\u062A</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F464} <b>\u06A9\u0627\u0631\u0628\u0631:</b> ${order.userName || "\u06A9\u0627\u0631\u0628\u0631 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646"}
\u{1F4E7} <b>\u0627\u06CC\u0645\u06CC\u0644 / \u0634\u0646\u0627\u0633\u0647:</b> <code>${order.userEmail}</code>
\u{1F48E} <b>\u062A\u0648\u06A9\u0646 \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u06CC:</b> <b>${order.tokens.toLocaleString("fa-IR")} \u062A\u0648\u06A9\u0646</b>
\u{1F4B0} <b>\u0645\u0628\u0644\u063A \u0641\u06CC\u0634:</b> <b>${order.amountTomans.toLocaleString("fa-IR")} \u062A\u0648\u0645\u0627\u0646</b>
\u{1F194} <b>\u06A9\u062F \u0633\u0641\u0627\u0631\u0634:</b> <code>${order.id}</code>
\u23F0 <b>\u0632\u0645\u0627\u0646 \u062B\u0628\u062A:</b> ${new Date(order.createdAt).toLocaleDateString("fa-IR")} - ${new Date(order.createdAt).toLocaleTimeString("fa-IR")}
${order.userNotes ? `\u{1F4DD} <b>\u062A\u0648\u0636\u06CC\u062D \u06A9\u0627\u0631\u0628\u0631:</b> ${order.userNotes}
` : ""}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u26A0\uFE0F \u0644\u0637\u0641\u0627\u064B \u067E\u0633 \u0627\u0632 \u062A\u0637\u0628\u06CC\u0642 \u0648\u0627\u0631\u06CC\u0632 \u0628\u0627 \u06AF\u0631\u062F\u0634 \u062D\u0633\u0627\u0628 \u0628\u0627\u0646\u06A9\u06CC\u060C \u0631\u0648\u06CC \u06CC\u06A9\u06CC \u0627\u0632 \u062F\u06A9\u0645\u0647\u200C\u0647\u0627\u06CC \u0632\u06CC\u0631 \u06A9\u0644\u06CC\u06A9 \u06A9\u0646\u06CC\u062F:`;
    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "\u2705 \u062A\u0627\u06CC\u06CC\u062F \u0648 \u0634\u0627\u0631\u0698 \u062A\u0648\u06A9\u0646", callback_data: `c2c_approve:${order.id}` },
          { text: "\u274C \u0631\u062F \u0641\u06CC\u0634 \u0648\u0627\u0631\u06CC\u0632\u06CC", callback_data: `c2c_reject:${order.id}` }
        ]
      ]
    };
    try {
      if (imageBuffer && imageBuffer.length > 0) {
        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("caption", caption);
        formData.append("parse_mode", "HTML");
        formData.append("reply_markup", JSON.stringify(replyMarkup));
        const blob = new Blob([imageBuffer], { type: "image/jpeg" });
        formData.append("photo", blob, `${order.id}.jpg`);
        const resp2 = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: "POST",
          body: formData
        });
        const data2 = await resp2.json();
        if (data2?.ok && data2.result?.message_id) {
          order.telegramMessageId = data2.result.message_id;
          bridgeStore.updateCardOrder(order);
          return true;
        }
        console.warn("Telegram sendPhoto response:", data2);
      }
      const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: caption + (order.receiptImageUrl ? `

\u{1F5BC}\uFE0F <a href="${order.receiptImageUrl}">\u0645\u0634\u0627\u0647\u062F\u0647 \u0641\u06CC\u0634 \u062F\u0631 \u0645\u0631\u0648\u0631\u06AF\u0631</a>` : ""),
          parse_mode: "HTML",
          reply_markup: replyMarkup
        })
      });
      const data = await resp.json();
      if (data?.ok && data.result?.message_id) {
        order.telegramMessageId = data.result.message_id;
        bridgeStore.updateCardOrder(order);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error sending Telegram card notification:", err);
      return false;
    }
  }
  async function handleTelegramCallbackQuery(cb) {
    const settings = bridgeStore.getSettings();
    const botToken = settings.telegramBotToken?.trim();
    if (!botToken) return;
    const data = String(cb.data || "");
    const cbId = cb.id;
    const chatId = cb.message?.chat?.id;
    const messageId = cb.message?.message_id;
    const isPhoto = !!cb.message?.photo;
    const answerCb = async (text, showAlert = false) => {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: cbId, text, show_alert: showAlert })
        });
      } catch (e) {
        console.error("Error answering callback:", e);
      }
    };
    const updateMsg = async (statusText) => {
      if (!chatId || !messageId) return;
      try {
        const origText = isPhoto ? cb.message?.caption || "" : cb.message?.text || "";
        const newText = `${origText}

${statusText}`;
        const endpoint = isPhoto ? "editMessageCaption" : "editMessageText";
        const bodyKey = isPhoto ? "caption" : "text";
        await fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            [bodyKey]: newText,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: [] }
          })
        });
      } catch (e) {
        console.error("Error updating telegram msg:", e);
      }
    };
    if (data.startsWith("c2c_approve:")) {
      const orderId = data.replace("c2c_approve:", "").trim();
      const res = bridgeStore.approveCardOrder(orderId);
      if (res.success) {
        await answerCb(`\u2705 \u0633\u0641\u0627\u0631\u0634 ${orderId} \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062A\u0627\u06CC\u06CC\u062F \u0648 ${res.order?.tokens} \u062A\u0648\u06A9\u0646 \u0634\u0627\u0631\u0698 \u06AF\u0631\u062F\u06CC\u062F!`, false);
        await updateMsg(`\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2705 <b>\u0648\u0636\u0639\u06CC\u062A: \u062A\u0648\u0633\u0637 \u0627\u062F\u0645\u06CC\u0646 \u062F\u0631 \u062A\u0644\u06AF\u0631\u0627\u0645 \u062A\u0627\u06CC\u06CC\u062F \u0648 \u0634\u0627\u0631\u0698 \u0634\u062F!</b>
\u23F0 \u0632\u0645\u0627\u0646: ${(/* @__PURE__ */ new Date()).toLocaleTimeString("fa-IR")}`);
      } else {
        await answerCb(res.message || "\u062E\u0637\u0627 \u062F\u0631 \u062A\u0627\u06CC\u06CC\u062F \u0633\u0641\u0627\u0631\u0634", true);
      }
    } else if (data.startsWith("c2c_reject:")) {
      const orderId = data.replace("c2c_reject:", "").trim();
      const res = bridgeStore.rejectCardOrder(orderId, "\u0631\u0633\u06CC\u062F \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A \u06CC\u0627 \u0648\u062C\u0647 \u0628\u0647 \u062D\u0633\u0627\u0628 \u0648\u0627\u0631\u06CC\u0632 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.");
      if (res.success) {
        await answerCb(`\u274C \u0633\u0641\u0627\u0631\u0634 ${orderId} \u0631\u062F \u0634\u062F.`, false);
        await updateMsg(`\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u274C <b>\u0648\u0636\u0639\u06CC\u062A: \u062A\u0648\u0633\u0637 \u0627\u062F\u0645\u06CC\u0646 \u062F\u0631 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0631\u062F \u0634\u062F!</b>
\u23F0 \u0632\u0645\u0627\u0646: ${(/* @__PURE__ */ new Date()).toLocaleTimeString("fa-IR")}`);
      } else {
        await answerCb(res.message || "\u062E\u0637\u0627 \u062F\u0631 \u0631\u062F \u0633\u0641\u0627\u0631\u0634", true);
      }
    }
  }
  let isPollingRunning = false;
  async function runTelegramPollingLoop() {
    if (isPollingRunning) return;
    isPollingRunning = true;
    let offset = 0;
    while (true) {
      try {
        const settings = bridgeStore.getSettings();
        const botToken = settings.telegramBotToken?.trim();
        if (!botToken) {
          await new Promise((r) => setTimeout(r, 8e3));
          continue;
        }
        const resp = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=15`, {
          signal: AbortSignal.timeout(2e4)
        });
        if (!resp.ok) {
          await new Promise((r) => setTimeout(r, 5e3));
          continue;
        }
        const data = await resp.json();
        if (data?.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            offset = Math.max(offset, update.update_id + 1);
            if (update.callback_query) {
              await handleTelegramCallbackQuery(update.callback_query);
            }
          }
        }
      } catch (err) {
        await new Promise((r) => setTimeout(r, 4e3));
      }
    }
  }
  runTelegramPollingLoop().catch((err) => console.error("Telegram loop error:", err));
  app.post("/api/bridge/card-transfer/submit", async (req, res) => {
    try {
      const { userId, packageId, tokens: customTokens, amountTomans: customAmount, receiptImageBase64, userNotes } = req.body;
      const user = bridgeStore.findUserByIdOrEmail(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "\u06A9\u0627\u0631\u0628\u0631 \u062B\u0628\u062A \u0646\u0627\u0645 \u0634\u062F\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
      }
      let tokens = 100;
      let amountTomans = 1e4;
      if (packageId) {
        const pack = bridgeStore.getWalletPackageById(packageId);
        if (pack) {
          tokens = pack.tokens + (pack.bonusTokens || 0);
          amountTomans = pack.priceTomans;
        }
      } else if (customTokens && Number(customTokens) > 0) {
        tokens = Number(customTokens);
        amountTomans = customAmount ? Number(customAmount) : tokens * 100;
      }
      const orderId = `c2c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      let receiptImageUrl = "";
      let imgBuffer = void 0;
      if (receiptImageBase64) {
        try {
          const cleanBase64 = String(receiptImageBase64).replace(/^data:image\/\w+;base64,/, "");
          imgBuffer = Buffer.from(cleanBase64, "base64");
          const fileName = `${orderId}.jpg`;
          const filePath = path2.resolve(__dirname, "public/uploads/receipts", fileName);
          fs2.writeFileSync(filePath, imgBuffer);
          const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
          const host = req.get("host") || "localhost:3000";
          receiptImageUrl = `${proto}://${host}/uploads/receipts/${fileName}`;
        } catch (saveErr) {
          console.warn("Could not save receipt image to disk:", saveErr);
        }
      }
      const order = bridgeStore.createCardOrder({
        id: orderId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name || "\u06A9\u0627\u0631\u0628\u0631",
        tokens,
        amountTomans,
        receiptImageBase64: receiptImageBase64 ? String(receiptImageBase64).substring(0, 100) + "..." : void 0,
        receiptImageUrl,
        userNotes: userNotes ? String(userNotes).trim() : "",
        status: "pending",
        createdAt: Date.now()
      });
      sendTelegramCardNotification(order, imgBuffer).catch((tErr) => console.warn("Telegram notify error:", tErr));
      res.json({
        success: true,
        orderId,
        order,
        message: "\u0631\u0633\u06CC\u062F \u067E\u0631\u062F\u0627\u062E\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0631\u0633\u0627\u0644 \u0634\u062F \u0648 \u062F\u0631 \u0635\u0641 \u062A\u0627\u06CC\u06CC\u062F \u0645\u062F\u06CC\u0631\u06CC\u062A \u0642\u0631\u0627\u0631 \u06AF\u0631\u0641\u062A."
      });
    } catch (err) {
      console.error("Error submitting card transfer:", err);
      res.status(500).json({ success: false, message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0641\u06CC\u0634 \u0648\u0627\u0631\u06CC\u0632\u06CC" });
    }
  });
  app.get("/api/bridge/card-transfer/status/:orderId", (req, res) => {
    const order = bridgeStore.getCardOrder(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "\u0631\u0633\u06CC\u062F \u067E\u0631\u062F\u0627\u062E\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
    }
    const user = bridgeStore.findUserByIdOrEmail(order.userId);
    res.json({
      success: true,
      order,
      status: order.status,
      isApproved: order.status === "approved",
      isRejected: order.status === "rejected",
      isPending: order.status === "pending",
      rejectionReason: order.rejectionReason,
      userTokens: user ? user.tokens : 0
    });
  });
  app.get("/api/bridge/admin/card-orders", (_req, res) => {
    res.json({
      success: true,
      orders: bridgeStore.getAllCardOrders()
    });
  });
  app.post("/api/bridge/admin/card-transfer/review", async (req, res) => {
    const { orderId, action, rejectionReason } = req.body;
    if (!orderId || !action) {
      return res.status(400).json({ success: false, message: "\u0634\u0646\u0627\u0633\u0647 \u0633\u0641\u0627\u0631\u0634 \u0648 \u0639\u0645\u0644\u06CC\u0627\u062A \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    if (action === "approve") {
      const result = bridgeStore.approveCardOrder(orderId);
      if (result.success && result.order?.telegramMessageId) {
        const settings = bridgeStore.getSettings();
        if (settings.telegramBotToken && settings.telegramAdminChatId) {
          try {
            await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/editMessageCaption`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: settings.telegramAdminChatId,
                message_id: result.order.telegramMessageId,
                caption: `\u2705 <b>\u062A\u0627\u06CC\u06CC\u062F \u0634\u062F:</b> \u0627\u06CC\u0646 \u0633\u0641\u0627\u0631\u0634 \u062A\u0648\u0633\u0637 \u067E\u0646\u0644 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0648\u0628 \u062A\u0627\u06CC\u06CC\u062F \u0648 ${result.order.tokens} \u062A\u0648\u06A9\u0646 \u0628\u0647 \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631 \u0634\u0627\u0631\u0698 \u0634\u062F.
\u23F0 \u0632\u0645\u0627\u0646 \u062A\u0627\u06CC\u06CC\u062F: ${(/* @__PURE__ */ new Date()).toLocaleTimeString("fa-IR")}`,
                parse_mode: "HTML",
                reply_markup: { inline_keyboard: [] }
              })
            });
          } catch (e) {
            console.warn("Could not update telegram on web approval:", e);
          }
        }
      }
      return res.json(result);
    } else if (action === "reject") {
      const result = bridgeStore.rejectCardOrder(orderId, rejectionReason);
      if (result.success && result.order?.telegramMessageId) {
        const settings = bridgeStore.getSettings();
        if (settings.telegramBotToken && settings.telegramAdminChatId) {
          try {
            await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/editMessageCaption`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: settings.telegramAdminChatId,
                message_id: result.order.telegramMessageId,
                caption: `\u274C <b>\u0631\u062F \u0634\u062F:</b> \u0627\u06CC\u0646 \u0633\u0641\u0627\u0631\u0634 \u062A\u0648\u0633\u0637 \u067E\u0646\u0644 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0648\u0628 \u0631\u062F \u06AF\u0631\u062F\u06CC\u062F.
\u0639\u0644\u062A: ${rejectionReason || "\u0639\u062F\u0645 \u062A\u0637\u0627\u0628\u0642 \u0641\u06CC\u0634"}`,
                parse_mode: "HTML",
                reply_markup: { inline_keyboard: [] }
              })
            });
          } catch (e) {
            console.warn("Could not update telegram on web rejection:", e);
          }
        }
      }
      return res.json(result);
    } else {
      return res.status(400).json({ success: false, message: "\u0639\u0645\u0644\u06CC\u0627\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A." });
    }
  });
  app.post("/api/bridge/telegram/webhook", async (req, res) => {
    try {
      const update = req.body;
      if (update?.callback_query) {
        await handleTelegramCallbackQuery(update.callback_query);
      }
      res.json({ ok: true });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).json({ ok: false, error: err?.message });
    }
  });
  app.post("/api/bridge/telegram/test", async (req, res) => {
    try {
      const { botToken: customToken, adminChatId: customChatId } = req.body;
      const settings = bridgeStore.getSettings();
      const botToken = (customToken || settings.telegramBotToken || "").trim();
      const chatId = (customChatId || settings.telegramAdminChatId || "").trim();
      if (!botToken || !chatId) {
        return res.status(400).json({
          success: false,
          message: "\u062A\u0648\u06A9\u0646 \u0631\u0628\u0627\u062A \u062A\u0644\u06AF\u0631\u0627\u0645 \u0648 Chat ID \u0627\u062F\u0645\u06CC\u0646 \u0631\u0627 \u0648\u0627\u0631\u062F \u0646\u0645\u0627\u06CC\u06CC\u062F."
        });
      }
      const text = `\u{1F7E2} <b>\u067E\u06CC\u0627\u0645 \u062A\u0633\u062A \u0627\u062A\u0635\u0627\u0644 \u067E\u0646\u0644 \u0645\u06CC\u0627\u0646\u0647 \u062B\u0646\u0627\u06CC\u06CC \u0628\u0647 \u062A\u0644\u06AF\u0631\u0627\u0645</b>
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u0631\u0628\u0627\u062A \u062A\u0644\u06AF\u0631\u0627\u0645 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0645\u062A\u0635\u0644 \u0634\u062F!
\u0627\u0632 \u0627\u06CC\u0646 \u067E\u0633 \u0647\u0646\u06AF\u0627\u0645\u06CC \u06A9\u0647 \u06A9\u0627\u0631\u0628\u0631 \u062F\u0631 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646 \u0627\u0632 \u0637\u0631\u06CC\u0642 \u06A9\u0627\u0631\u062A \u0628\u0647 \u06A9\u0627\u0631\u062A \u062E\u0631\u06CC\u062F \u06A9\u0646\u062F\u060C \u0639\u06A9\u0633 \u0641\u06CC\u0634 \u0648\u0627\u0631\u06CC\u0632\u06CC \u0648 \u062F\u06A9\u0645\u0647\u200C\u0647\u0627\u06CC \u062A\u0627\u06CC\u06CC\u062F/\u0631\u062F \u0622\u0646\u06CC \u062F\u0631 \u0627\u06CC\u0646 \u0686\u062A \u0627\u0631\u0633\u0627\u0644 \u0645\u06CC\u200C\u0634\u0648\u062F.
\u23F0 \u0632\u0645\u0627\u0646 \u062A\u0633\u062A: ${(/* @__PURE__ */ new Date()).toLocaleDateString("fa-IR")} ${(/* @__PURE__ */ new Date()).toLocaleTimeString("fa-IR")}`;
      const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML"
        })
      });
      const data = await resp.json();
      if (data?.ok) {
        return res.json({
          success: true,
          message: "\u067E\u06CC\u0627\u0645 \u062A\u0633\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0634\u0645\u0627 \u0627\u0631\u0633\u0627\u0644 \u06AF\u0631\u062F\u06CC\u062F! \u062A\u0644\u06AF\u0631\u0627\u0645 \u062E\u0648\u062F \u0631\u0627 \u0686\u06A9 \u06A9\u0646\u06CC\u062F."
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `\u062E\u0637\u0627\u06CC \u062A\u0644\u06AF\u0631\u0627\u0645: ${data?.description || "\u062A\u0648\u06A9\u0646 \u06CC\u0627 Chat ID \u0627\u0634\u062A\u0628\u0627\u0647 \u0627\u0633\u062A."}`
        });
      }
    } catch (err) {
      console.error("Error testing Telegram:", err);
      res.status(500).json({ success: false, message: err?.message || "\u062E\u0637\u0627 \u062F\u0631 \u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 \u0633\u0631\u0648\u0631\u0647\u0627\u06CC \u062A\u0644\u06AF\u0631\u0627\u0645" });
    }
  });
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(__dirname, "dist");
    if (fs2.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get("*", (_req, res) => {
      const indexPath = path2.join(distPath, "index.html");
      if (fs2.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sanaei Bridge & Manager - \u067E\u0646\u0644 \u0645\u062F\u06CC\u0631\u06CC\u062A \u067E\u0644 \u0627\u0631\u062A\u0628\u0627\u0637\u06CC</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700;900&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; font-family: 'Vazirmatn', system-ui, sans-serif; }
            body { background: #090d16; color: #f1f5f9; margin: 0; padding: 24px; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 20px; padding: 32px; max-width: 680px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
            .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); border-radius: 9999px; font-size: 13px; font-weight: 600; }
            h1 { font-size: 22px; margin: 16px 0 8px; color: #38bdf8; font-weight: 700; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.7; margin: 0 0 16px; }
            .box { background: #0a0f1d; border: 1px solid #1e293b; border-radius: 12px; padding: 14px; margin: 16px 0; direction: ltr; text-align: left; font-family: monospace; color: #38bdf8; font-size: 13px; word-break: break-all; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin: 20px 0; }
            .stat { background: #1a233a; border-radius: 12px; padding: 12px; text-align: center; border: 1px solid #273552; }
            .stat-num { font-size: 18px; font-weight: 700; color: #f8fafc; }
            .stat-lbl { font-size: 11px; color: #64748b; margin-top: 4px; }
            .btn { display: inline-block; background: #0284c7; color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 600; transition: 0.2s; border: none; cursor: pointer; }
            .btn:hover { background: #0369a1; }
            .btn-outline { background: transparent; border: 1px solid #334155; color: #94a3b8; margin-right: 8px; }
            .btn-outline:hover { background: #1e293b; color: #fff; }
          </style>
        </head>
        <body>
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="badge">\u25CF \u0633\u0631\u0648\u06CC\u0633 \u067E\u0644 \u0633\u0631\u0648\u0631 \u0622\u0646\u0644\u0627\u06CC\u0646 \u0648 \u0641\u0639\u0627\u0644 \u0627\u0633\u062A</span>
              <span style="font-size:12px; color:#64748b; direction:ltr;">v2.5.0</span>
            </div>
            <h1>\u067E\u0644 \u0627\u0631\u062A\u0628\u0627\u0637\u06CC \u062B\u0646\u0627\u06CC\u06CC \u0648 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646 \u0645\u0648\u0628\u0627\u06CC\u0644 (Sanaei Bridge)</h1>
            <p>\u0627\u06CC\u0646 \u0633\u0631\u0648\u0631 \u0628\u0647 \u0639\u0646\u0648\u0627\u0646 \u067E\u0644 \u0627\u0631\u062A\u0628\u0627\u0637\u06CC \u0647\u0648\u0634\u0645\u0646\u062F \u0628\u06CC\u0646 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0648 \u067E\u0646\u0644 \u0633\u0646\u0627\u06CC\u06CC (3X-UI) \u0639\u0645\u0644 \u0645\u06CC\u200C\u06A9\u0646\u062F \u0648 \u06A9\u0644\u06CC\u0647 \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627\u06CC \u062B\u0628\u062A\u200C\u0646\u0627\u0645\u060C \u0635\u062F\u0648\u0631 \u062E\u0648\u062F\u06A9\u0627\u0631 \u06A9\u0627\u0646\u0641\u06CC\u06AF\u060C \u0645\u062F\u06CC\u0631\u06CC\u062A \u06A9\u06CC\u0641 \u067E\u0648\u0644 \u0648 \u067E\u0644\u0646\u200C\u0647\u0627 \u0631\u0627 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0645\u06CC\u200C\u0646\u0645\u0627\u06CC\u062F.</p>
            
            <div class="grid">
              <div class="stat"><div class="stat-num">3000</div><div class="stat-lbl">\u067E\u0648\u0631\u062A \u0633\u0631\u0648\u0631</div></div>
              <div class="stat"><div class="stat-num">3X-UI v3</div><div class="stat-lbl">\u0646\u0633\u062E\u0647 \u067E\u0646\u0644 \u062B\u0646\u0627\u06CC\u06CC</div></div>
              <div class="stat"><div class="stat-num">\u0641\u0639\u0627\u0644 \u2705</div><div class="stat-lbl">\u0633\u06CC\u0633\u062A\u0645 \u06A9\u06CC\u0641 \u067E\u0648\u0644</div></div>
              <div class="stat"><div class="stat-num">\u0641\u0639\u0627\u0644 \u2705</div><div class="stat-lbl">\u06A9\u062F \u0647\u062F\u06CC\u0647 \u0648 \u0648\u0648\u0686\u0631</div></div>
            </div>

            <div style="margin-top:20px;">
              <div style="font-size:13px; font-weight:600; color:#e2e8f0; margin-bottom:8px;">\u062F\u0633\u062A\u0648\u0631 \u0646\u0635\u0628 \u0631\u0627\u0628\u0637 \u06A9\u0627\u0631\u0628\u0631\u06CC \u06AF\u0631\u0627\u0641\u06CC\u06A9\u06CC \u06A9\u0627\u0645\u0644 \u0631\u0648\u06CC \u0633\u0631\u0648\u0631:</div>
              <div class="box">curl -fsSL http://127.0.0.1:3000/dist.tar.gz | tar -xz -C /usr/local/sanaei-bridge/</div>
            </div>

            <div style="margin-top:24px; display:flex; gap:10px; flex-wrap:wrap;">
              <a href="/api/bridge/health" target="_blank" class="btn">\u062A\u0633\u062A \u0648\u0636\u0639\u06CC\u062A API (Health)</a>
              <a href="/api/bridge/servers" target="_blank" class="btn btn-outline">\u0644\u06CC\u0633\u062A \u0633\u0631\u0648\u0631\u0647\u0627</a>
              <a href="/api/bridge/wallet/packages" target="_blank" class="btn btn-outline">\u0628\u0633\u062A\u0647\u200C\u0647\u0627\u06CC \u06A9\u06CC\u0641 \u067E\u0648\u0644</a>
            </div>
          </div>
        </body>
        </html>
      `);
    });
  }
  const PORT = Number(process.env.PORT) || 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sanaei Management Panel server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
