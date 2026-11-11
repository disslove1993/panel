import fs from 'fs';
import path from 'path';
import {
  BridgePlan,
  BridgeSettings,
  BridgeUser,
  BridgeWalletTransaction,
  BridgeGiftCode,
  BridgePaymentOrder,
  BridgeCardTransferOrder,
  BridgeWalletPackage,
} from './src/types/bridge';


const STORE_PATH = path.resolve(process.cwd(), 'bridge_store.json');

const DEFAULT_PLANS: BridgePlan[] = [
  {
    id: 'plan_1m_10gb',
    name: 'اشتراک ۱ ماهه - ۱۰ گیگابایت',
    periodDays: 30,
    trafficGB: 10,
    priceTokens: 1000,
    priceTomans: 85000,
    isPopular: true,
    description: 'مناسب وب‌گردی، اینستاگرام، یوتیوب و تلگرام با آی‌پی ثابت و پینگ پایین',
  },
  {
    id: 'plan_1m_30gb',
    name: 'اشتراک ۱ ماهه - ۳۰ گیگابایت',
    periodDays: 30,
    trafficGB: 30,
    priceTokens: 2500,
    priceTomans: 195000,
    isPopular: false,
    description: 'حجم بالا برای تماشای آنلاین فیلم، استریم و بازی آنلاین',
  },
  {
    id: 'plan_3m_60gb',
    name: 'اشتراک ۳ ماهه - ۶۰ گیگابایت (VIP)',
    periodDays: 90,
    trafficGB: 60,
    priceTokens: 4800,
    priceTomans: 390000,
    isPopular: false,
    description: 'بهترین قیمت به ازای هر گیگابایت با سرور اختصاصی VIP',
  },
  {
    id: 'plan_free_trial',
    name: 'تست اولیه رایگان - ۱ گیگابایت',
    periodDays: 3,
    trafficGB: 1,
    priceTokens: 0,
    priceTomans: 0,
    isPopular: false,
    description: 'تست سرعت و کیفیت اتصال در اپلیکیشن برای کاربران تازه ثبت‌نام شده',
  },
];

const DEFAULT_SETTINGS: BridgeSettings = {
  apiKey: 'bridge_secret_key_2026',
  adminPassword: 'admin',
  defaultInboundId: 4, // Inbound 4 (AI-Cloudflare-CDN)
  welcomeTokens: 1000, // 1000 Tokens given to new users by default (matching the app UI)
  freeTrialTrafficGB: 1, // 1 GB test traffic
  freeTrialDays: 3, // 3 days test period
  sanaeiPanelUrl: 'https://panel.wpbaharak.ir:2053',
  sanaeiWebBasePath: '/',
  sanaeiUsername: 'disslove22',
  sanaeiPassword: '199300',
  allowInsecure: true,
  zibalMerchant: '68b314a9a45c720017ff86cb',
  zibalEnabled: true,
  zibalCallbackUrl: '',
  // Card to Card & Telegram Bot Settings
  cardToCardEnabled: true,
  bankCardNumber: '6037997512345678',
  bankCardOwner: 'مهدی حاجی محمدی',
  bankName: 'بانک ملی ایران',
  telegramBotToken: '',
  telegramAdminChatId: '',
  plans: DEFAULT_PLANS,
  giftCodes: [
    {
      id: 'gift_welcome',
      code: 'WELCOME2026',
      tokens: 1000,
      maxUses: 1000,
      usedCount: 0,
      isExpired: false,
      createdAt: Date.now(),
    },
    {
      id: 'gift_bonus',
      code: 'FREE1000',
      tokens: 1000,
      maxUses: 500,
      usedCount: 0,
      isExpired: false,
      createdAt: Date.now(),
    },
  ],
};

export const WALLET_PACKAGES = [
  {
    id: 'pack_100',
    tokens: 100,
    priceTomans: 10000,
    bonusTokens: 0,
    title: 'بسته پایه ۱۰۰ توکن (۱۰ هزار تومان)',
    isPopular: false,
  },
  {
    id: 'pack_1000',
    tokens: 1000,
    priceTomans: 85000,
    bonusTokens: 0,
    title: 'بسته استاندارد ۱۰۰۰ توکن',
    isPopular: false,
  },
  {
    id: 'pack_2500',
    tokens: 2500,
    priceTomans: 195000,
    bonusTokens: 200,
    title: 'بسته نقره‌ای ۲۵۰۰ توکن (+۲۰۰ هدیه)',
    isPopular: true,
  },
  {
    id: 'pack_5000',
    tokens: 5000,
    priceTomans: 380000,
    bonusTokens: 500,
    title: 'بسته طلایی ۵۰۰۰ توکن (+۵۰۰ هدیه)',
    isPopular: false,
  },
];

interface BridgeDatabase {
  settings: BridgeSettings;
  users: Record<string, BridgeUser>;
  transactions?: BridgeWalletTransaction[];
  redeemedCodes?: Record<string, string[]>; // code -> array of userIds
  orders?: Record<string, BridgePaymentOrder>;
  cardOrders?: Record<string, BridgeCardTransferOrder>;
}

class BridgeStoreManager {
  private data: BridgeDatabase;

  constructor() {
    this.data = this.loadFromDisk();
  }

  private loadFromDisk(): BridgeDatabase {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          users: parsed.users || {},
          transactions: parsed.transactions || [],
          redeemedCodes: parsed.redeemedCodes || {},
          orders: parsed.orders || {},
          cardOrders: parsed.cardOrders || {},
        };
      }
    } catch (err) {
      console.error('Error loading bridge store:', err);
    }
    return {
      settings: DEFAULT_SETTINGS,
      users: {},
      transactions: [],
      redeemedCodes: {},
      orders: {},
      cardOrders: {},
    };
  }


  private saveToDisk() {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving bridge store:', err);
    }
  }

  getSettings(): BridgeSettings {
    return this.data.settings;
  }

  updateSettings(partial: Partial<BridgeSettings>): BridgeSettings {
    this.data.settings = { ...this.data.settings, ...partial };
    this.saveToDisk();
    return this.data.settings;
  }

  getPlans(): BridgePlan[] {
    return this.data.settings.plans || DEFAULT_PLANS;
  }

  getPlanById(planId: string): BridgePlan | undefined {
    return this.getPlans().find((p) => p.id === planId);
  }

  addPlan(plan: BridgePlan): BridgePlan {
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

  updatePlan(planId: string, partial: Partial<BridgePlan>): BridgePlan | undefined {
    if (!this.data.settings.plans) {
      this.data.settings.plans = [...DEFAULT_PLANS];
    }
    const plan = this.data.settings.plans.find((p) => p.id === planId);
    if (!plan) return undefined;
    Object.assign(plan, partial);
    this.saveToDisk();
    return plan;
  }

  deletePlan(planId: string): boolean {
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
  getWalletPackages(): BridgeWalletPackage[] {
    if (!this.data.settings.walletPackages || this.data.settings.walletPackages.length === 0) {
      this.data.settings.walletPackages = [...WALLET_PACKAGES];
    }
    return this.data.settings.walletPackages;
  }

  getWalletPackageById(packageId: string): BridgeWalletPackage | undefined {
    return this.getWalletPackages().find((p) => p.id === packageId);
  }

  addWalletPackage(pkg: BridgeWalletPackage): BridgeWalletPackage {
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

  updateWalletPackage(packageId: string, partial: Partial<BridgeWalletPackage>): BridgeWalletPackage | undefined {
    const list = this.getWalletPackages();
    const pkg = list.find((p) => p.id === packageId);
    if (!pkg) return undefined;
    Object.assign(pkg, partial);
    this.data.settings.walletPackages = list;
    this.saveToDisk();
    return pkg;
  }

  deleteWalletPackage(packageId: string): boolean {
    const list = this.getWalletPackages();
    const initialLen = list.length;
    this.data.settings.walletPackages = list.filter((p) => p.id !== packageId);
    if (this.data.settings.walletPackages.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  deleteGiftCode(codeOrId: string): boolean {
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

  getAllUsers(): BridgeUser[] {
    return Object.values(this.data.users).sort((a, b) => b.registeredAt - a.registeredAt);
  }

  findUserByIdOrEmail(identifier: string): BridgeUser | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    return Object.values(this.data.users).find(
      (u) =>
        u.id === identifier ||
        u.email.toLowerCase() === clean ||
        (u.deviceId && u.deviceId.toLowerCase() === clean)
    );
  }

  createUser(payload: { email: string; name?: string; deviceId?: string; initialTokens?: number }): BridgeUser {
    const email = payload.email.trim();
    const existing = this.findUserByIdOrEmail(email);
    if (existing) {
      return existing;
    }

    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const initialTokens = payload.initialTokens !== undefined ? payload.initialTokens : this.data.settings.welcomeTokens;

    const newUser: BridgeUser = {
      id,
      email,
      name: payload.name?.trim() || email.split('@')[0] || 'User',
      tokens: initialTokens,
      deviceId: payload.deviceId || '',
      registeredAt: now,
      lastActiveAt: now,
      subscription: {
        status: 'none',
        planId: '',
        planName: '',
        trafficTotalGB: 0,
        trafficTotalBytes: 0,
        trafficUsedBytes: 0,
        trafficRemainingBytes: 0,
        expiryTime: 0,
        remainingDays: 0,
        clientEmail: '',
        clientUuid: '',
        inboundId: 0,
        inboundRemark: '',
        inboundProtocol: '',
        inboundPort: 0,
        configUri: '',
        subUrl: '',
        subscribedAt: 0,
      },
    };

    this.data.users[id] = newUser;

    // Record welcome bonus transaction
    if (initialTokens > 0) {
      this.addTransaction({
        userId: id,
        type: 'welcome',
        amountTokens: initialTokens,
        description: 'هدیه خوش‌آمدگویی و تست اپلیکیشن',
      });
    }

    this.saveToDisk();
    return newUser;
  }

  updateUser(user: BridgeUser): BridgeUser {
    this.data.users[user.id] = { ...user, lastActiveAt: Date.now() };
    this.saveToDisk();
    return this.data.users[user.id];
  }

  deleteUser(userId: string): boolean {
    if (this.data.users[userId]) {
      delete this.data.users[userId];
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // --- Wallet & Transactions Management ---
  addTransaction(item: { userId: string; type: BridgeWalletTransaction['type']; amountTokens: number; description: string }): BridgeWalletTransaction {
    if (!this.data.transactions) this.data.transactions = [];
    const tx: BridgeWalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: item.userId,
      type: item.type,
      amountTokens: item.amountTokens,
      description: item.description,
      createdAt: Date.now(),
    };
    this.data.transactions.unshift(tx);
    // Keep max 1000 transactions
    if (this.data.transactions.length > 1000) {
      this.data.transactions = this.data.transactions.slice(0, 1000);
    }
    this.saveToDisk();
    return tx;
  }

  getTransactions(userId?: string): BridgeWalletTransaction[] {
    const list = this.data.transactions || [];
    if (!userId) return list;
    return list.filter((t) => t.userId === userId);
  }

  adjustUserTokens(userId: string, deltaTokens: number, type: BridgeWalletTransaction['type'], description: string): { success: boolean; user?: BridgeUser; message?: string } {
    const user = this.findUserByIdOrEmail(userId);
    if (!user) {
      return { success: false, message: 'کاربر یافت نشد.' };
    }
    const newBalance = (user.tokens || 0) + deltaTokens;
    if (newBalance < 0) {
      return { success: false, message: 'موجودی توکن کاربر کافی نیست.' };
    }
    user.tokens = newBalance;
    this.updateUser(user);
    this.addTransaction({
      userId: user.id,
      type,
      amountTokens: deltaTokens,
      description,
    });
    return { success: true, user };
  }

  // --- Gift Codes Management ---
  getGiftCodes(): BridgeGiftCode[] {
    return this.data.settings.giftCodes || [];
  }

  createGiftCode(code: string, tokens: number, maxUses = 100): BridgeGiftCode {
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
    const newGift: BridgeGiftCode = {
      id: `gift_${Date.now()}`,
      code: cleanCode,
      tokens,
      maxUses,
      usedCount: 0,
      isExpired: false,
      createdAt: Date.now(),
    };
    this.data.settings.giftCodes.push(newGift);
    this.saveToDisk();
    return newGift;
  }

  redeemGiftCode(userId: string, rawCode: string): { success: boolean; tokensAdded: number; newTokens: number; message: string } {
    const user = this.findUserByIdOrEmail(userId);
    if (!user) {
      return { success: false, tokensAdded: 0, newTokens: 0, message: 'کاربر یافت نشد.' };
    }
    const code = rawCode.trim().toUpperCase();
    const gifts = this.getGiftCodes();
    const gift = gifts.find((g) => g.code === code);
    if (!gift) {
      return { success: false, tokensAdded: 0, newTokens: user.tokens, message: 'کد هدیه نامعتبر است.' };
    }
    if (gift.isExpired || gift.usedCount >= gift.maxUses) {
      return { success: false, tokensAdded: 0, newTokens: user.tokens, message: 'مهلت یا ظرفیت استفاده از این کد هدیه به پایان رسیده است.' };
    }

    if (!this.data.redeemedCodes) this.data.redeemedCodes = {};
    const usedUsers = this.data.redeemedCodes[code] || [];
    if (usedUsers.includes(user.id)) {
      return { success: false, tokensAdded: 0, newTokens: user.tokens, message: 'شما قبلاً از این کد هدیه استفاده کرده‌اید.' };
    }

    // Apply tokens
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
      type: 'gift_code',
      amountTokens: gift.tokens,
      description: `اعمال کد هدیه ${code}`,
    });

    this.saveToDisk();
    return {
      success: true,
      tokensAdded: gift.tokens,
      newTokens: user.tokens,
      message: `کد هدیه با موفقیت اعمال شد و ${gift.tokens} توکن به حساب شما افزوده گردید!`,
    };
  }

  // --- Payment Orders Management (Zibal IPG) ---
  createPaymentOrder(order: BridgePaymentOrder): BridgePaymentOrder {
    if (!this.data.orders) this.data.orders = {};
    this.data.orders[order.id] = order;
    this.saveToDisk();
    return order;
  }

  getPaymentOrder(orderId: string): BridgePaymentOrder | undefined {
    return this.data.orders ? this.data.orders[orderId] : undefined;
  }

  findOrderByTrackId(trackId: number): BridgePaymentOrder | undefined {
    if (!this.data.orders) return undefined;
    return Object.values(this.data.orders).find((o) => o.trackId === trackId);
  }

  updatePaymentOrder(order: BridgePaymentOrder): BridgePaymentOrder {
    if (!this.data.orders) this.data.orders = {};
    this.data.orders[order.id] = order;
    this.saveToDisk();
    return order;
  }

  getAllPaymentOrders(): BridgePaymentOrder[] {
    if (!this.data.orders) return [];
    return Object.values(this.data.orders).sort((a, b) => b.createdAt - a.createdAt);
  }

  // --- Card to Card Transfer Orders Management ---
  createCardOrder(order: BridgeCardTransferOrder): BridgeCardTransferOrder {
    if (!this.data.cardOrders) this.data.cardOrders = {};
    this.data.cardOrders[order.id] = order;
    this.saveToDisk();
    return order;
  }

  getCardOrder(orderId: string): BridgeCardTransferOrder | undefined {
    return this.data.cardOrders ? this.data.cardOrders[orderId] : undefined;
  }

  updateCardOrder(order: BridgeCardTransferOrder): BridgeCardTransferOrder {
    if (!this.data.cardOrders) this.data.cardOrders = {};
    this.data.cardOrders[order.id] = order;
    this.saveToDisk();
    return order;
  }

  getAllCardOrders(): BridgeCardTransferOrder[] {
    if (!this.data.cardOrders) return [];
    return Object.values(this.data.cardOrders).sort((a, b) => b.createdAt - a.createdAt);
  }

  approveCardOrder(orderId: string): { success: boolean; order?: BridgeCardTransferOrder; user?: BridgeUser; message: string } {
    const order = this.getCardOrder(orderId);
    if (!order) {
      return { success: false, message: 'رسید پرداخت کارت به کارت یافت نشد.' };
    }
    if (order.status === 'approved') {
      return { success: true, order, message: 'این رسید قبلاً تایید و حساب کاربر شارژ شده است.' };
    }

    order.status = 'approved';
    order.reviewedAt = Date.now();
    this.updateCardOrder(order);

    // Credit user tokens
    const adjustResult = this.adjustUserTokens(
      order.userId,
      order.tokens,
      'topup',
      `واریز کارت به کارت (سفارش ${order.id})`
    );

    return {
      success: true,
      order,
      user: adjustResult.user,
      message: `سفارش کارت به کارت تایید شد و ${order.tokens} توکن به حساب کاربر واریز گردید!`,
    };
  }

  rejectCardOrder(orderId: string, reason?: string): { success: boolean; order?: BridgeCardTransferOrder; message: string } {
    const order = this.getCardOrder(orderId);
    if (!order) {
      return { success: false, message: 'سفارش کارت به کارت یافت نشد.' };
    }
    if (order.status === 'approved') {
      return { success: false, message: 'امکان رد سفارشی که قبلاً تایید شده وجود ندارد.' };
    }

    order.status = 'rejected';
    order.rejectionReason = reason || 'رسید ارسالی نامعتبر است یا وجه به حساب واریز نشده است.';
    order.reviewedAt = Date.now();
    this.updateCardOrder(order);

    return {
      success: true,
      order,
      message: 'سفارش کارت به کارت رد شد.',
    };
  }
}


export const bridgeStore = new BridgeStoreManager();

