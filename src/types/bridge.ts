export interface BridgeWalletTransaction {
  id: string;
  userId: string;
  type: 'welcome' | 'gift_code' | 'topup' | 'purchase' | 'admin_adjust';
  amountTokens: number;
  description: string;
  createdAt: number;
}

export interface BridgeGiftCode {
  id: string;
  code: string;
  tokens: number;
  maxUses: number;
  usedCount: number;
  isExpired: boolean;
  createdAt: number;
}

export interface BridgePlan {
  id: string;
  name: string;
  periodDays: number;
  trafficGB: number;
  priceTokens: number;
  priceTomans: number;
  inboundId?: number;
  isPopular?: boolean;
  description: string;
}

export interface BridgeUserSubscription {
  status: 'none' | 'active' | 'expired';
  planId: string;
  planName: string;
  trafficTotalGB: number;
  trafficTotalBytes: number;
  trafficUsedBytes: number;
  trafficRemainingBytes: number;
  expiryTime: number; // Unix timestamp in ms
  remainingDays: number;
  clientEmail: string;
  clientUuid: string;
  inboundId: number;
  inboundRemark: string;
  inboundProtocol: string;
  inboundPort: number;
  configUri: string; // The vless:// or vmess:// or trojan:// URI for VPN connection
  subUrl: string; // Subscription URL for v2rayNG / Streisand
  subscribedAt: number;
}

export interface BridgeUser {
  id: string;
  email: string;
  name: string;
  tokens: number; // Balance (e.g. 1000 Tokens shown in mobile app header)
  deviceId?: string;
  registeredAt: number;
  lastActiveAt: number;
  subscription?: BridgeUserSubscription;
}

export interface BridgeServerItem {
  id: number;
  inboundId: number;
  name: string;
  location: string;
  countryCode: string;
  flag: string;
  protocol: string;
  network: string;
  security: string;
  port: number;
  pingMs: number;
  isPro: boolean;
  isOnline: boolean;
}

export interface BridgeWalletPackage {
  id: string;
  tokens: number;
  priceTomans: number;
  bonusTokens: number;
  title: string;
  isPopular?: boolean;
}

export interface BridgePaymentOrder {
  id: string; // e.g. ord_12345
  userId: string;
  userEmail: string;
  tokens: number;
  amountTomans: number;
  amountRials: number;
  trackId?: number;
  status: 'pending' | 'paid' | 'failed';
  refNumber?: string | number;
  cardNumber?: string;
  paidAt?: number;
  createdAt: number;
}

export interface BridgeCardTransferOrder {
  id: string; // e.g. c2c_12345
  userId: string;
  userEmail: string;
  userName: string;
  tokens: number;
  amountTomans: number;
  receiptImageBase64?: string;
  receiptImageUrl?: string;
  userNotes?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedAt?: number;
  telegramMessageId?: number;
  createdAt: number;
}

export interface BridgeSettings {
  apiKey: string;
  adminPassword?: string;
  defaultInboundId: number;
  welcomeTokens: number;
  sanaeiPanelUrl: string;
  sanaeiWebBasePath: string;
  sanaeiUsername: string;
  sanaeiPassword: string;
  allowInsecure: boolean;
  plans: BridgePlan[];
  giftCodes?: BridgeGiftCode[];
  zibalMerchant: string;
  zibalEnabled: boolean;
  zibalCallbackUrl?: string;
  // Card to Card & Telegram Settings
  cardToCardEnabled: boolean;
  bankCardNumber: string;
  bankCardOwner: string;
  bankName: string;
  telegramBotToken: string;
  telegramAdminChatId: string;
}



