export interface SanaeiClient {
  id: string;
  password?: string;
  email: string;
  flow?: string;
  limitIp: number;
  totalGB: number; // In bytes inside 3x-ui settings/clientStats
  expiryTime: number; // Unix timestamp in ms (0 = unlimited)
  enable: boolean;
  tgId?: string;
  subId?: string;
  up: number; // Bytes uploaded
  down: number; // Bytes downloaded
  nativeUri?: string; // Exact URI from /panel/api/inbounds/allLinks if provided by 3X-UI v3.x
}

export interface SanaeiInbound {
  id: number;
  up: number;
  down: number;
  total: number;
  remark: string;
  enable: boolean;
  expiryTime: number;
  listen: string;
  port: number;
  protocol: 'vless' | 'vmess' | 'trojan' | 'shadowsocks' | 'wireguard' | 'dokodemo-door' | 'socks' | 'http' | string;
  tag: string;
  network: 'tcp' | 'ws' | 'grpc' | 'httpupgrade' | 'xhttp' | 'kcp' | 'quic' | string;
  security: 'none' | 'tls' | 'reality' | string;
  settings: Record<string, any>;
  streamSettings: Record<string, any>;
  sniffing: Record<string, any>;
  clients: SanaeiClient[];
}

export interface SanaeiPanelProfile {
  id: string;
  name: string;
  panelUrl: string;
  webBasePath: string;
  username: string;
  password?: string;
  twoFactorCode?: string;
  sessionCookie?: string;
  apiToken?: string;
  allowInsecure: boolean;
  subscriptionBaseUrl?: string;
  mode: 'live' | 'demo' | 'json';
  hostname: string;
  lastSyncAt: number;
  inbounds: SanaeiInbound[];
  onlineEmails: string[];
}
