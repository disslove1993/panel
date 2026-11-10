import { SanaeiClient, SanaeiInbound, SanaeiPanelProfile } from '../types/sanaei';

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0 || Number.isNaN(bytes)) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const val = bytes / Math.pow(k, i);
  return `${val >= 100 ? val.toFixed(0) : val >= 10 ? val.toFixed(1) : val.toFixed(2)} ${units[i]}`;
}

export function formatExpiryStatus(expiryTimeMs: number): {
  label: string;
  subLabel: string;
  state: 'unlimited' | 'active' | 'warning' | 'expired';
} {
  if (!expiryTimeMs || expiryTimeMs === 0) {
    return {
      label: 'نامحدود',
      subLabel: 'بدون محدودیت زمانی',
      state: 'unlimited',
    };
  }

  const now = Date.now();
  // Negative expiryTime in 3x-ui means relative duration after first connection (e.g. -2592000000 = 30 days after first use)
  if (expiryTimeMs < 0) {
    const days = Math.round(Math.abs(expiryTimeMs) / (1000 * 60 * 60 * 24));
    return {
      label: `${days} روز پس از اتصال`,
      subLabel: 'شروع پس از اولین استفاده',
      state: 'active',
    };
  }

  const diffMs = expiryTimeMs - now;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  let jalaliDate = '';
  try {
    jalaliDate = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(expiryTimeMs));
  } catch {
    jalaliDate = new Date(expiryTimeMs).toISOString().slice(0, 10);
  }

  if (diffMs <= 0) {
    return {
      label: 'منقضی شده',
      subLabel: jalaliDate,
      state: 'expired',
    };
  }

  if (daysLeft <= 3) {
    return {
      label: `${daysLeft} روز مانده`,
      subLabel: jalaliDate,
      state: 'warning',
    };
  }

  return {
    label: `${daysLeft} روز مانده`,
    subLabel: jalaliDate,
    state: 'active',
  };
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateSubId(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

export function buildClientConfigUri(
  inbound: SanaeiInbound,
  client: SanaeiClient,
  serverHostname: string
): string {
  if (client.nativeUri && client.nativeUri.trim()) {
    return client.nativeUri;
  }
  const host = inbound.listen && inbound.listen !== '0.0.0.0' ? inbound.listen : serverHostname || 'server.example.com';
  const port = inbound.port;
  const remark = encodeURIComponent(`${inbound.remark}-${client.email}`);
  const stream = inbound.streamSettings || {};
  const network = (inbound.network || stream.network || 'tcp').toLowerCase();
  const security = (inbound.security || stream.security || 'none').toLowerCase();

  const params = new URLSearchParams();
  params.set('type', network);
  params.set('security', security);

  // Transport parameters
  if (network === 'ws') {
    const wsSettings = stream.wsSettings || {};
    params.set('path', wsSettings.path || '/');
    const wsHost = wsSettings.host || wsSettings.headers?.Host || '';
    if (wsHost) params.set('host', wsHost);
  } else if (network === 'grpc') {
    const grpcSettings = stream.grpcSettings || {};
    if (grpcSettings.serviceName) params.set('serviceName', grpcSettings.serviceName);
    params.set('mode', grpcSettings.multiMode ? 'multi' : 'gun');
  } else if (network === 'httpupgrade') {
    const httpupgrade = stream.httpupgradeSettings || {};
    params.set('path', httpupgrade.path || '/');
    if (httpupgrade.host) params.set('host', httpupgrade.host);
  } else if (network === 'tcp') {
    const tcpSettings = stream.tcpSettings || {};
    const headerType = tcpSettings.header?.type || 'none';
    if (headerType === 'http') {
      params.set('headerType', 'http');
      const reqHost = tcpSettings.header?.request?.headers?.Host?.[0];
      if (reqHost) params.set('host', reqHost);
    }
  }

  // Security parameters
  if (security === 'reality') {
    const reality = stream.realitySettings || {};
    const realitySub = reality.settings || {};
    const pbk = realitySub.publicKey || reality.publicKey || '';
    const fp = realitySub.fingerprint || 'chrome';
    const sni = Array.isArray(reality.serverNames) && reality.serverNames[0] ? reality.serverNames[0] : realitySub.serverName || '';
    const sid = Array.isArray(reality.shortIds) && reality.shortIds[0] ? reality.shortIds[0] : '';
    const spx = realitySub.spiderX || '/';

    if (pbk) params.set('pbk', pbk);
    if (fp) params.set('fp', fp);
    if (sni) params.set('sni', sni);
    if (sid) params.set('sid', sid);
    if (spx) params.set('spx', spx);
    if (client.flow) params.set('flow', client.flow);
  } else if (security === 'tls') {
    const tls = stream.tlsSettings || {};
    const sni = tls.serverName || '';
    if (sni) params.set('sni', sni);
    if (Array.isArray(tls.alpn) && tls.alpn.length > 0) {
      params.set('alpn', tls.alpn.join(','));
    }
    if (tls.settings?.fingerprint) {
      params.set('fp', tls.settings.fingerprint);
    }
  }

  if (inbound.protocol === 'vless') {
    params.set('encryption', 'none');
    return `vless://${client.id}@${host}:${port}?${params.toString()}#${remark}`;
  }

  if (inbound.protocol === 'trojan') {
    const pass = client.password || client.id;
    return `trojan://${encodeURIComponent(pass)}@${host}:${port}?${params.toString()}#${remark}`;
  }

  if (inbound.protocol === 'vmess') {
    const vmessObj = {
      v: '2',
      ps: `${inbound.remark}-${client.email}`,
      add: host,
      port: String(port),
      id: client.id,
      aid: '0',
      scy: 'auto',
      net: network,
      type: network === 'tcp' && stream.tcpSettings?.header?.type === 'http' ? 'http' : 'none',
      host:
        network === 'ws'
          ? stream.wsSettings?.host || stream.wsSettings?.headers?.Host || ''
          : stream.tcpSettings?.header?.request?.headers?.Host?.[0] || '',
      path: network === 'ws' ? stream.wsSettings?.path || '/' : '',
      tls: security === 'tls' ? 'tls' : '',
      sni: stream.tlsSettings?.serverName || '',
      alpn: Array.isArray(stream.tlsSettings?.alpn) ? stream.tlsSettings.alpn.join(',') : '',
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(vmessObj))));
    return `vmess://${encoded}`;
  }

  if (inbound.protocol === 'shadowsocks') {
    const method = inbound.settings?.method || '2022-blake3-aes-128-gcm';
    const serverPass = inbound.settings?.password || '';
    const clientPass = client.password || client.id || '';
    const fullCred = serverPass && clientPass && method.startsWith('2022') ? `${serverPass}:${clientPass}` : clientPass || serverPass;
    const userInfo = btoa(`${method}:${fullCred}`);
    return `ss://${userInfo}@${host}:${port}#${remark}`;
  }

  return `${inbound.protocol}://${client.id}@${host}:${port}#${remark}`;
}

export function parseManualSanaeiJson(rawText: string): SanaeiInbound[] {
  const parsed = JSON.parse(rawText);
  const rawList: any[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.obj)
    ? parsed.obj
    : Array.isArray(parsed?.inbounds)
    ? parsed.inbounds
    : [];

  if (rawList.length === 0) {
    throw new Error('آرایه‌ای از این‌باندها (obj یا آرایه JSON) در متن واردشده پیدا نشد.');
  }

  return rawList.map((raw, idx) => {
    const settings = typeof raw.settings === 'string' ? JSON.parse(raw.settings || '{}') : raw.settings || {};
    const streamSettings =
      typeof raw.streamSettings === 'string' ? JSON.parse(raw.streamSettings || '{}') : raw.streamSettings || {};
    const sniffing = typeof raw.sniffing === 'string' ? JSON.parse(raw.sniffing || '{}') : raw.sniffing || {};
    const rawClients: any[] = Array.isArray(settings.clients) ? settings.clients : [];
    const rawStats: any[] = Array.isArray(raw.clientStats) ? raw.clientStats : [];

    const statsMap = new Map<string, any>();
    for (const s of rawStats) {
      if (s?.email) statsMap.set(String(s.email), s);
    }

    const clients: SanaeiClient[] = rawClients.map((c, cIdx) => {
      const email = c.email || `user-${cIdx + 1}`;
      const st = statsMap.get(email);
      return {
        id: c.id || c.password || `uuid-${cIdx}`,
        password: c.password || '',
        email,
        flow: c.flow || '',
        limitIp: Number(c.limitIp || 0),
        totalGB: Number(c.totalGB || st?.total || 0),
        expiryTime: Number(c.expiryTime ?? st?.expiryTime ?? 0),
        enable: Boolean(c.enable ?? st?.enable ?? true),
        tgId: String(c.tgId || ''),
        subId: String(c.subId || ''),
        up: Number(st?.up ?? c.up ?? 0),
        down: Number(st?.down ?? c.down ?? 0),
      };
    });

    return {
      id: Number(raw.id || idx + 1),
      up: Number(raw.up || 0),
      down: Number(raw.down || 0),
      total: Number(raw.total || 0),
      remark: String(raw.remark || `Inbound-${idx + 1}`),
      enable: Boolean(raw.enable ?? true),
      expiryTime: Number(raw.expiryTime || 0),
      listen: String(raw.listen || ''),
      port: Number(raw.port || 443),
      protocol: String(raw.protocol || 'vless').toLowerCase(),
      tag: String(raw.tag || `inbound-${raw.port || idx + 1}`),
      network: String(streamSettings.network || 'tcp').toLowerCase(),
      security: String(streamSettings.security || 'none').toLowerCase(),
      settings,
      streamSettings,
      sniffing,
      clients,
    };
  });
}

const GB = 1024 * 1024 * 1024;
const DAY_MS = 24 * 60 * 60 * 1000;

export function createDemoSanaeiProfile(): SanaeiPanelProfile {
  const now = Date.now();
  return {
    id: 'demo-hetzner-de',
    name: 'سرور آلمان Hetzner (دموی آماده ثنایی)',
    panelUrl: 'https://de1.sanaei-node.ir:2053',
    webBasePath: '/xui-panel',
    username: 'admin',
    allowInsecure: true,
    subscriptionBaseUrl: 'https://sub.sanaei-node.ir:2096/sub/',
    mode: 'demo',
    hostname: 'de1.sanaei-node.ir',
    lastSyncAt: now,
    onlineEmails: ['ali_vip_de', 'sara_iphone', 'reza_gaming', 'mahdi_pro', 'corp_office_1'],
    inbounds: [
      {
        id: 1,
        up: 18.4 * GB,
        down: 142.6 * GB,
        total: 500 * GB,
        remark: 'VIP-VLESS-Reality-Direct',
        enable: true,
        expiryTime: 0,
        listen: '',
        port: 443,
        protocol: 'vless',
        tag: 'inbound-443',
        network: 'tcp',
        security: 'reality',
        settings: { decryption: 'none' },
        streamSettings: {
          network: 'tcp',
          security: 'reality',
          realitySettings: {
            serverNames: ['www.speedtest.net'],
            shortIds: ['a1b2c3d4'],
            settings: {
              publicKey: 'm8P9xKqL2vN4rT6wY8zB0cF3hJ5kM7pQ9sV1xZ3aC5e',
              fingerprint: 'chrome',
              spiderX: '/',
            },
          },
        },
        sniffing: { enabled: true, destOverride: ['http', 'tls', 'quic'] },
        clients: [
          {
            id: '9a7b3c4d-1122-4333-8444-556677889900',
            email: 'ali_vip_de',
            flow: 'xtls-rprx-vision',
            limitIp: 2,
            totalGB: 50 * GB,
            expiryTime: now + 24 * DAY_MS,
            enable: true,
            subId: 'alivip99881122',
            up: 4.2 * GB,
            down: 29.8 * GB,
          },
          {
            id: '7f8e9d0c-2233-4444-9555-667788990011',
            email: 'sara_iphone',
            flow: 'xtls-rprx-vision',
            limitIp: 1,
            totalGB: 30 * GB,
            expiryTime: now + 18 * DAY_MS,
            enable: true,
            subId: 'saraip77441100',
            up: 1.8 * GB,
            down: 14.5 * GB,
          },
          {
            id: '3c4d5e6f-3344-4555-a666-778899001122',
            email: 'reza_gaming',
            flow: 'xtls-rprx-vision',
            limitIp: 2,
            totalGB: 100 * GB,
            expiryTime: now + 2 * DAY_MS,
            enable: true,
            subId: 'rezagm55229988',
            up: 8.9 * GB,
            down: 76.4 * GB,
          },
          {
            id: '1b2c3d4e-4455-4666-b777-889900112233',
            email: 'omid_expired',
            flow: 'xtls-rprx-vision',
            limitIp: 1,
            totalGB: 20 * GB,
            expiryTime: now - 3 * DAY_MS,
            enable: false,
            subId: 'omidexp110022',
            up: 2.1 * GB,
            down: 17.9 * GB,
          },
        ],
      },
      {
        id: 2,
        up: 11.2 * GB,
        down: 89.4 * GB,
        total: 0,
        remark: 'CDN-Cloudflare-WS-TLS',
        enable: true,
        expiryTime: 0,
        listen: '',
        port: 2083,
        protocol: 'vless',
        tag: 'inbound-2083',
        network: 'ws',
        security: 'tls',
        settings: { decryption: 'none' },
        streamSettings: {
          network: 'ws',
          security: 'tls',
          wsSettings: {
            path: '/graphql-ws',
            host: 'cdn.sanaei-node.ir',
          },
          tlsSettings: {
            serverName: 'cdn.sanaei-node.ir',
            alpn: ['h2', 'http/1.1'],
            settings: { fingerprint: 'firefox' },
          },
        },
        sniffing: { enabled: true },
        clients: [
          {
            id: '5e6f7a8b-5566-4777-8888-990011223344',
            email: 'mahdi_pro',
            flow: '',
            limitIp: 3,
            totalGB: 80 * GB,
            expiryTime: now + 29 * DAY_MS,
            enable: true,
            subId: 'mahdipro334455',
            up: 5.4 * GB,
            down: 41.2 * GB,
          },
          {
            id: '6f7a8b9c-6677-4888-9999-001122334455',
            email: 'nazanin_mac',
            flow: '',
            limitIp: 2,
            totalGB: 40 * GB,
            expiryTime: now + 12 * DAY_MS,
            enable: true,
            subId: 'nazmac99887766',
            up: 3.1 * GB,
            down: 22.7 * GB,
          },
          {
            id: '8a9b0c1d-7788-4999-aaaa-112233445566',
            email: 'farhad_android',
            flow: '',
            limitIp: 1,
            totalGB: 25 * GB,
            expiryTime: now + 7 * DAY_MS,
            enable: true,
            subId: 'farhad77112233',
            up: 2.7 * GB,
            down: 25.5 * GB,
          },
        ],
      },
      {
        id: 3,
        up: 6.8 * GB,
        down: 54.1 * GB,
        total: 250 * GB,
        remark: 'Irancell-VMess-TCP-HTTP',
        enable: true,
        expiryTime: 0,
        listen: '',
        port: 8080,
        protocol: 'vmess',
        tag: 'inbound-8080',
        network: 'tcp',
        security: 'none',
        settings: {},
        streamSettings: {
          network: 'tcp',
          security: 'none',
          tcpSettings: {
            header: {
              type: 'http',
              request: {
                headers: {
                  Host: ['varzesh3.com'],
                },
              },
            },
          },
        },
        sniffing: { enabled: true },
        clients: [
          {
            id: 'a1b2c3d4-8899-4000-bbbb-223344556677',
            email: 'kamran_mtn',
            limitIp: 2,
            totalGB: 60 * GB,
            expiryTime: now + 15 * DAY_MS,
            enable: true,
            subId: 'kamranmtn8899',
            up: 4.1 * GB,
            down: 33.9 * GB,
          },
          {
            id: 'b2c3d4e5-9900-4111-cccc-334455667788',
            email: 'mina_home',
            limitIp: 1,
            totalGB: 35 * GB,
            expiryTime: now + 21 * DAY_MS,
            enable: true,
            subId: 'minahome4455',
            up: 2.7 * GB,
            down: 20.2 * GB,
          },
        ],
      },
      {
        id: 4,
        up: 9.5 * GB,
        down: 63.0 * GB,
        total: 0,
        remark: 'Enterprise-Trojan-gRPC-TLS',
        enable: true,
        expiryTime: 0,
        listen: '',
        port: 8443,
        protocol: 'trojan',
        tag: 'inbound-8443',
        network: 'grpc',
        security: 'tls',
        settings: {},
        streamSettings: {
          network: 'grpc',
          security: 'tls',
          grpcSettings: {
            serviceName: 'trojan-rpc-stream',
            multiMode: true,
          },
          tlsSettings: {
            serverName: 'de1.sanaei-node.ir',
          },
        },
        sniffing: { enabled: true },
        clients: [
          {
            id: 'Tr0j@nSecPass2026!Corp',
            password: 'Tr0j@nSecPass2026!Corp',
            email: 'corp_office_1',
            limitIp: 5,
            totalGB: 0,
            expiryTime: 0,
            enable: true,
            subId: 'corpoffice001',
            up: 9.5 * GB,
            down: 63.0 * GB,
          },
        ],
      },
      {
        id: 5,
        up: 1.1 * GB,
        down: 8.4 * GB,
        total: 100 * GB,
        remark: 'Backup-Shadowsocks-2022',
        enable: false,
        expiryTime: now + 45 * DAY_MS,
        listen: '',
        port: 9090,
        protocol: 'shadowsocks',
        tag: 'inbound-9090',
        network: 'tcp',
        security: 'none',
        settings: {
          method: '2022-blake3-aes-128-gcm',
          password: 'ServerMasterKeyBase64==',
        },
        streamSettings: {
          network: 'tcp',
          security: 'none',
        },
        sniffing: { enabled: true },
        clients: [
          {
            id: 'ClientSubKeyBase64==',
            password: 'ClientSubKeyBase64==',
            email: 'backup_admin',
            limitIp: 2,
            totalGB: 50 * GB,
            expiryTime: 0,
            enable: true,
            subId: 'backupadm9090',
            up: 1.1 * GB,
            down: 8.4 * GB,
          },
        ],
      },
    ],
  };
}
