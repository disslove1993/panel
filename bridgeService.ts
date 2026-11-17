import { bridgeStore } from './bridgeStore';
import { BridgePlan, BridgeServerItem, BridgeUser, BridgeUserSubscription } from './src/types/bridge';
import { generateSubId, generateUuid } from './src/utils/sanaeiHelpers';

interface SanaeiBridgeEngine {
  authenticatePanel: (conn: any) => Promise<any>;
  fetchInboundsFromPanel: (session: any, allowInsecure?: boolean) => Promise<any[]>;
  performHttpRequest: (url: string, options: any) => Promise<any>;
  buildAuthHeaders: (session: any, extra?: any) => Record<string, string>;
  buildClientConfigUri: (inbound: any, client: any, hostname: string) => string;
}

let sanaeiEngineRef: SanaeiBridgeEngine | null = null;

export function registerSanaeiEngine(engine: SanaeiBridgeEngine) {
  sanaeiEngineRef = engine;
}

export async function getActiveSanaeiInbounds(): Promise<any[]> {
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
      allowInsecure: settings.allowInsecure,
    });
    return await sanaeiEngineRef.fetchInboundsFromPanel(session, settings.allowInsecure);
  } catch (err) {
    console.error('Error fetching inbounds for bridge:', err);
    return [];
  }
}

export async function provisionClientOnSanaei(params: {
  email: string;
  trafficBytes: number;
  expiryTimeMs: number;
  inboundId?: number;
  strictInbound?: boolean;
}): Promise<{
  inbound: any;
  client: any;
  configUri: string;
  subUrl: string;
}> {
  if (!sanaeiEngineRef) {
    throw new Error('Sanaei engine not registered on server.');
  }

  const settings = bridgeStore.getSettings();
  if (!settings.sanaeiPanelUrl || !settings.sanaeiPanelUrl.trim()) {
    throw new Error(
      'هنوز هیچ پنل ثنایی (3X-UI) به سیستم متصل نشده است. لطفاً ابتدا از بخش «اتصال پنل ثنایی جدید» مشخصات سرور ثنایی خود را وارد کنید.'
    );
  }
  const session = await sanaeiEngineRef.authenticatePanel({
    panelUrl: settings.sanaeiPanelUrl,
    webBasePath: settings.sanaeiWebBasePath,
    username: settings.sanaeiUsername,
    password: settings.sanaeiPassword,
    allowInsecure: settings.allowInsecure,
  });

  const inbounds = await sanaeiEngineRef.fetchInboundsFromPanel(session, settings.allowInsecure);
  if (!inbounds || inbounds.length === 0) {
    throw new Error('هیچ این‌باندی در پنل ثنایی یافت نشد.');
  }

  const clientProtocols = ['vless', 'vmess', 'trojan', 'shadowsocks'];
  const requestedId =
    params.inboundId !== undefined && params.inboundId !== null && Number(params.inboundId) > 0
      ? Number(params.inboundId)
      : undefined;

  let targetInbound = requestedId ? inbounds.find((i) => Number(i.id) === requestedId) : undefined;

  if (requestedId && params.strictInbound) {
    if (!targetInbound) {
      throw new Error(`این‌باند با شناسه #${requestedId} در پنل ثنایی یافت نشد.`);
    }
    if (!targetInbound.enable) {
      throw new Error(`این‌باند «${targetInbound.remark}» (#${requestedId}) در پنل ثنایی غیرفعال است.`);
    }
    if (String(targetInbound.protocol || '').toLowerCase() === 'wireguard') {
      throw new Error(
        `این‌باند «${targetInbound.remark}» (#${requestedId}) از نوع WireGuard است و از ساخت کلاینت خودکار VLESS/VMess پشتیبانی نمی‌کند. لطفاً یکی از این‌باندهای VLESS یا VMess را انتخاب کنید.`
      );
    }
  }

  // Fallback automatic inbound selection ONLY when no strict inbound was requested
  if (!targetInbound) {
    targetInbound = inbounds.find(
      (i) => i.id === settings.defaultInboundId && i.enable && clientProtocols.includes(String(i.protocol || '').toLowerCase())
    );
  }
  if (!targetInbound) {
    targetInbound = inbounds.find(
      (i) => i.id === 4 && i.enable && clientProtocols.includes(String(i.protocol || '').toLowerCase())
    );
  }
  if (!targetInbound) {
    targetInbound = inbounds.find(
      (i) => i.enable && clientProtocols.includes(String(i.protocol || '').toLowerCase())
    );
  }
  if (!targetInbound) {
    targetInbound = inbounds.find((i) => i.enable) || inbounds[0];
  }

  const clientUuid = generateUuid();
  const subId = generateSubId(14);
  const sanitizedEmail = params.email.replace(/[^a-zA-Z0-9_-]/g, '_');
  const clientRemark = `app_${sanitizedEmail}_${subId.slice(0, 4)}`;

  let clientCreated = false;
  let panelErrorMsg = '';
  let createdPayloadUsed: any = null;

  const buildPayloadForInbound = (inb: any, forceEmptyFlow = false) => {
    const proto = String(inb.protocol || '').toLowerCase();
    const sec = String(inb.security || '').toLowerCase();
    const net = String(inb.network || '').toLowerCase();
    const existingUsesVision =
      Array.isArray(inb.clients) && inb.clients.some((c: any) => c.flow === 'xtls-rprx-vision');
    const shouldUseVision =
      !forceEmptyFlow && proto === 'vless' && net === 'tcp' && (sec === 'reality' || existingUsesVision);

    return {
      id: clientUuid,
      password: clientUuid,
      email: clientRemark,
      flow: shouldUseVision ? 'xtls-rprx-vision' : '',
      totalGB: params.trafficBytes,
      expiryTime: params.expiryTimeMs,
      limitIp: 2,
      limitHwid: 0,
      tgId: 0,
      enable: true,
      subId,
    };
  };

  // Helper to attempt adding client to a specific inbound via v3 and v2 APIs
  const tryAddClientToInbound = async (inb: any, forceEmptyFlow = false): Promise<boolean> => {
    if (String(inb.protocol || '').toLowerCase() === 'wireguard') {
      panelErrorMsg = `پروتکل WireGuard در این‌باند #${inb.id} از افزودن کلاینت پشتیبانی نمی‌کند.`;
      return false;
    }

    const payload = buildPayloadForInbound(inb, forceEmptyFlow);

    // 1. Try v3 API
    try {
      const v3Payload = JSON.stringify({
        client: payload,
        inboundIds: [inb.id],
      });
      const v3Res = await sanaeiEngineRef!.performHttpRequest(`${session.fullBaseUrl}/panel/api/clients/add`, {
        method: 'POST',
        headers: sanaeiEngineRef!.buildAuthHeaders(session, {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(v3Payload).toString(),
        }),
        body: v3Payload,
        allowInsecure: settings.allowInsecure,
      });

      if (v3Res.statusCode >= 200 && v3Res.statusCode < 300 && v3Res.body) {
        const parsed = JSON.parse(v3Res.body);
        if (parsed.success) {
          createdPayloadUsed = payload;
          return true;
        }
        if (parsed.msg) panelErrorMsg = parsed.msg;
      }
    } catch (err: any) {
      panelErrorMsg = err?.message || '';
    }

    // 2. Try v2 API
    const v2Body = new URLSearchParams({
      id: String(inb.id),
      settings: JSON.stringify({ clients: [payload] }),
    }).toString();

    const v2Endpoints = ['/panel/api/inbounds/addClient', '/panel/inbound/addClient', '/xui/inbound/addClient'];
    for (const ep of v2Endpoints) {
      try {
        const v2Res = await sanaeiEngineRef!.performHttpRequest(`${session.fullBaseUrl}${ep}`, {
          method: 'POST',
          headers: sanaeiEngineRef!.buildAuthHeaders(session, {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Content-Length': Buffer.byteLength(v2Body).toString(),
          }),
          body: v2Body,
          allowInsecure: settings.allowInsecure,
        });
        if (v2Res.statusCode === 200 && v2Res.body) {
          const parsed = JSON.parse(v2Res.body);
          if (parsed.success) {
            createdPayloadUsed = payload;
            return true;
          }
          if (parsed.msg) panelErrorMsg = parsed.msg;
        }
      } catch {
        // continue
      }
    }
    return false;
  };

  // Try targeted inbound first (and retry with empty flow if flow was rejected)
  clientCreated = await tryAddClientToInbound(targetInbound, false);
  if (!clientCreated && String(targetInbound.protocol || '').toLowerCase() === 'vless') {
    clientCreated = await tryAddClientToInbound(targetInbound, true);
  }

  // Only fall back to other enabled inbounds if strictInbound is NOT set
  if (!clientCreated && !params.strictInbound) {
    const fallbackInbounds = inbounds.filter(
      (i) => i.id !== targetInbound.id && i.enable && clientProtocols.includes(String(i.protocol || '').toLowerCase())
    );
    for (const altInb of fallbackInbounds) {
      clientCreated = await tryAddClientToInbound(altInb, false);
      if (clientCreated) {
        targetInbound = altInb;
        break;
      }
    }
  }

  if (!clientCreated) {
    throw new Error(panelErrorMsg || `خطا در ثبت کاربر روی این‌باند #${targetInbound.id} (${targetInbound.remark}) در پنل ثنایی.`);
  }

  // Fetch updated inbounds to extract the exact URI generated by Sanaei
  const freshInbounds = await sanaeiEngineRef.fetchInboundsFromPanel(session, settings.allowInsecure);
  const updatedInbound = freshInbounds.find((i) => Number(i.id) === Number(targetInbound.id)) || targetInbound;
  const createdClient =
    updatedInbound.clients?.find((c: any) => c.email === clientRemark || c.id === clientUuid) || createdPayloadUsed;

  const configUri = sanaeiEngineRef.buildClientConfigUri(updatedInbound, createdClient, session.hostname);
  const subUrl = `https://${session.hostname}:2096/sub/${subId}`;

  return {
    inbound: updatedInbound,
    client: createdClient,
    configUri,
    subUrl,
  };
}

export function formatServersList(inbounds: any[]): BridgeServerItem[] {
  return inbounds
    .filter((i) => i.enable)
    .map((inb, idx) => {
      let location = 'Frankfurt, DE';
      let flag = '🇩🇪';
      let ping = 90 + idx * 8;
      let isPro = false;

      if (inb.remark.toLowerCase().includes('cloudflare') || inb.port === 443) {
        location = 'Global Cloudflare CDN';
        flag = '⚡';
        ping = 65;
        isPro = true;
      } else if (inb.protocol === 'wireguard') {
        location = 'Helsinki, FI';
        flag = '🇫🇮';
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
        protocol: (inb.protocol || 'vless').toUpperCase(),
        network: inb.network || 'tcp',
        security: inb.security || 'none',
        port: inb.port,
        pingMs: ping,
        isPro,
        isOnline: true,
        supportsSwitch: String(inb.protocol || '').toLowerCase() !== 'wireguard',
      };
    })
    .sort((a, b) => Number(b.supportsSwitch !== false) - Number(a.supportsSwitch !== false));
}

const BYTES_PER_GB = 1024 * 1024 * 1024;

function toGB(bytes: number): number {
  return Number((Math.max(0, bytes) / BYTES_PER_GB).toFixed(2));
}

export async function deleteClientFromSanaei(params: {
  inboundId: number;
  clientUuid: string;
}): Promise<void> {
  if (!sanaeiEngineRef || !params.inboundId || !params.clientUuid) return;
  const settings = bridgeStore.getSettings();
  if (!settings.sanaeiPanelUrl || !settings.sanaeiPanelUrl.trim()) return;

  try {
    const session = await sanaeiEngineRef.authenticatePanel({
      panelUrl: settings.sanaeiPanelUrl,
      webBasePath: settings.sanaeiWebBasePath,
      username: settings.sanaeiUsername,
      password: settings.sanaeiPassword,
      allowInsecure: settings.allowInsecure,
    });

    const endpoints = [
      `${session.fullBaseUrl}/panel/api/inbounds/${params.inboundId}/delClient/${params.clientUuid}`,
      `${session.fullBaseUrl}/panel/inbound/${params.inboundId}/delClient/${params.clientUuid}`,
    ];
    for (const url of endpoints) {
      try {
        const res = await sanaeiEngineRef.performHttpRequest(url, {
          method: 'POST',
          headers: sanaeiEngineRef.buildAuthHeaders(session),
          allowInsecure: settings.allowInsecure,
          timeoutMs: 6000,
        });
        if (res.statusCode === 200) break;
      } catch {
        // continue trying fallback endpoint
      }
    }
  } catch {
    // non-fatal cleanup
  }
}

export async function syncUserSubscriptionWithSanaei(
  user: BridgeUser,
  cachedInbounds?: any[]
): Promise<BridgeUser> {
  const sub = user.subscription;
  if (!sub || sub.status === 'none' || !sub.planId) {
    return user;
  }

  let dirty = false;
  const prevStatus = sub.status;
  const prevUsed = Number(sub.trafficUsedBytes || 0);
  const prevRem = Number(sub.trafficRemainingBytes || 0);
  const prevDays = Number(sub.remainingDays || 0);

  let inbounds: any[] = [];
  if (Array.isArray(cachedInbounds)) {
    inbounds = cachedInbounds;
  } else {
    inbounds = await getActiveSanaeiInbounds();
  }

  let matchedClient: any = null;
  let matchedInbound: any = null;

  if (inbounds.length > 0) {
    const preferredInb = inbounds.find((i) => i.id === sub.inboundId);
    const searchOrder = preferredInb
      ? [preferredInb, ...inbounds.filter((i) => i.id !== sub.inboundId)]
      : inbounds;

    for (const inb of searchOrder) {
      const clients = Array.isArray(inb.clients) ? inb.clients : [];
      const found = clients.find(
        (c: any) =>
          (sub.clientUuid && c.id === sub.clientUuid) ||
          (sub.clientEmail && c.email === sub.clientEmail)
      );
      if (found) {
        matchedClient = found;
        matchedInbound = inb;
        break;
      }
    }
  }

  let totalBytes = Number(sub.trafficTotalBytes || (sub.trafficTotalGB || 0) * BYTES_PER_GB);
  let usedBytes = Number(sub.trafficUsedBytes || 0);
  let expiryTime = Number(sub.expiryTime || 0);
  let clientDisabled = false;
  let clientDeleted = false;

  if (matchedClient) {
    usedBytes = (Number(matchedClient.up) || 0) + (Number(matchedClient.down) || 0);
    if (Number(matchedClient.totalGB) > 0) {
      totalBytes = Number(matchedClient.totalGB);
    }
    if (Number(matchedClient.expiryTime) > 0) {
      expiryTime = Number(matchedClient.expiryTime);
    }
    if (matchedClient.enable === false || matchedInbound?.enable === false) {
      clientDisabled = true;
    }
  } else if (
    inbounds.length > 0 &&
    sub.status === 'active' &&
    sub.clientUuid &&
    (!sub.subscribedAt || Date.now() - sub.subscribedAt > 30000)
  ) {
    // Client no longer exists on any inbound in Sanaei panel
    clientDeleted = true;
  }

  const remainingBytes = totalBytes > 0 ? Math.max(0, totalBytes - usedBytes) : Math.max(0, Number(sub.trafficRemainingBytes || 0));
  const now = Date.now();
  const diffMs = expiryTime > 0 ? expiryTime - now : 1;
  const remainingDays = expiryTime > 0 ? Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000))) : sub.remainingDays;

  let expiredReason: NonNullable<BridgeUserSubscription['expiredReason']> = 'none';
  if (clientDeleted) {
    expiredReason = 'deleted_from_panel';
  } else if (clientDisabled) {
    expiredReason = 'disabled_on_panel';
  } else if (expiryTime > 0 && diffMs <= 0) {
    expiredReason = 'time_expired';
  } else if (totalBytes > 0 && remainingBytes <= 0) {
    expiredReason = 'traffic_exhausted';
  }

  const isExpired = expiredReason !== 'none' || sub.status === 'expired';
  if (isExpired && expiredReason === 'none') {
    expiredReason = totalBytes > 0 && remainingBytes <= 0 ? 'traffic_exhausted' : 'time_expired';
  }

  sub.trafficTotalBytes = totalBytes;
  sub.trafficTotalGB = toGB(totalBytes);
  sub.trafficUsedBytes = usedBytes;
  sub.trafficUsedGB = toGB(usedBytes);
  sub.trafficRemainingBytes = isExpired && expiredReason === 'traffic_exhausted' ? 0 : remainingBytes;
  sub.trafficRemainingGB = toGB(sub.trafficRemainingBytes);
  sub.trafficUsedPercent = totalBytes > 0 ? Math.min(100, Math.round((usedBytes / totalBytes) * 100)) : 0;
  sub.expiryTime = expiryTime;
  sub.remainingDays = isExpired && expiredReason === 'time_expired' ? 0 : remainingDays;
  sub.lastSyncedAt = now;

  if (isExpired) {
    sub.status = 'expired';
    sub.isExpired = true;
    sub.expiredReason = expiredReason;
    sub.configUri = '';
    sub.subUrl = '';
  } else {
    sub.status = 'active';
    sub.isExpired = false;
    sub.expiredReason = 'none';
  }

  if (
    prevStatus !== sub.status ||
    prevUsed !== sub.trafficUsedBytes ||
    prevRem !== sub.trafficRemainingBytes ||
    prevDays !== sub.remainingDays
  ) {
    dirty = true;
  }

  if (dirty) {
    bridgeStore.updateUser(user);
  }

  return user;
}
