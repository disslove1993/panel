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

export interface BridgeSettings {
  apiKey: string;
  defaultInboundId: number;
  welcomeTokens: number;
  sanaeiPanelUrl: string;
  sanaeiWebBasePath: string;
  sanaeiUsername: string;
  sanaeiPassword: string;
  allowInsecure: boolean;
  plans: BridgePlan[];
}
