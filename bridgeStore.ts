import fs from 'fs';
import path from 'path';
import { BridgePlan, BridgeSettings, BridgeUser } from './src/types/bridge';

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
  defaultInboundId: 4, // Inbound 4 (AI-Cloudflare-CDN)
  welcomeTokens: 1000, // 1000 Tokens given to new users by default (matching the app UI)
  sanaeiPanelUrl: 'https://panel.wpbaharak.ir:2053',
  sanaeiWebBasePath: '/',
  sanaeiUsername: 'disslove22',
  sanaeiPassword: '199300',
  allowInsecure: true,
  plans: DEFAULT_PLANS,
};

interface BridgeDatabase {
  settings: BridgeSettings;
  users: Record<string, BridgeUser>;
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
        };
      }
    } catch (err) {
      console.error('Error loading bridge store:', err);
    }
    return {
      settings: DEFAULT_SETTINGS,
      users: {},
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

  getAllUsers(): BridgeUser[] {
    return Object.values(this.data.users).sort((a, b) => b.registeredAt - a.registeredAt);
  }

  findUserByIdOrEmail(identifier: string): BridgeUser | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    return Object.values(this.data.users).find(
      (u) => u.id === identifier || u.email.toLowerCase() === clean
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
    const newUser: BridgeUser = {
      id,
      email,
      name: payload.name?.trim() || email.split('@')[0] || 'User',
      tokens: payload.initialTokens !== undefined ? payload.initialTokens : this.data.settings.welcomeTokens,
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
}

export const bridgeStore = new BridgeStoreManager();
