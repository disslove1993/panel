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

  // Prefer requested inbound, then defaultInboundId or inbound 4, then any active inbound
  let targetInbound = inbounds.find((i) => i.id === params.inboundId);
  if (!targetInbound) {
    targetInbound = inbounds.find((i) => i.id === 4 && i.enable);
  }
  if (!targetInbound) {
    targetInbound = inbounds.find((i) => i.id === settings.defaultInboundId && i.enable);
  }
  if (!targetInbound) {
    targetInbound = inbounds.find((i) => i.enable && ['vless', 'vmess', 'trojan', 'wireguard'].includes(i.protocol));
  }
  if (!targetInbound) {
    targetInbound = inbounds[0];
  }

  const clientUuid = generateUuid();
  const subId = generateSubId(14);
  const sanitizedEmail = params.email.replace(/[^a-zA-Z0-9_-]/g, '_');
  const clientRemark = `app_${sanitizedEmail}_${subId.slice(0, 4)}`;

  const isRealityOrTlsVless =
    targetInbound.protocol === 'vless' &&
    (targetInbound.security === 'reality' || targetInbound.security === 'tls') &&
    targetInbound.network === 'tcp';

  const clientPayload = {
    id: clientUuid,
    password: clientUuid,
    email: clientRemark,
    flow: isRealityOrTlsVless ? 'xtls-rprx-vision' : '',
    totalGB: params.trafficBytes,
    expiryTime: params.expiryTimeMs,
    limitIp: 2,
    limitHwid: 0,
    tgId: 0,
    enable: true,
    subId,
  };

  let clientCreated = false;
  let panelErrorMsg = '';

  // Helper to attempt adding client to a specific inbound via v3 and v2 APIs
  const tryAddClientToInbound = async (inb: any): Promise<boolean> => {
    // 1. Try v3 API
    try {
      const v3Payload = JSON.stringify({
        client: clientPayload,
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
        if (parsed.success) return true;
        if (parsed.msg) panelErrorMsg = parsed.msg;
      }
    } catch (err: any) {
      panelErrorMsg = err?.message || '';
    }

    // 2. Try v2 API
    const v2Body = new URLSearchParams({
      id: String(inb.id),
      settings: JSON.stringify({ clients: [clientPayload] }),
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
          if (parsed.success) return true;
          if (parsed.msg) panelErrorMsg = parsed.msg;
        }
      } catch {
        // continue
      }
    }
    return false;
  };

  // Try targeted inbound first
  clientCreated = await tryAddClientToInbound(targetInbound);

  // If failed, try other enabled inbounds automatically
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
    throw new Error(panelErrorMsg || 'خطا در ثبت کاربر روی این‌باند پنل ثنایی.');
  }

  // Fetch updated inbounds to extract the exact URI generated by Sanaei
  const freshInbounds = await sanaeiEngineRef.fetchInboundsFromPanel(session, settings.allowInsecure);
  const updatedInbound = freshInbounds.find((i) => i.id === targetInbound.id) || targetInbound;
  const createdClient =
    updatedInbound.clients?.find((c: any) => c.email === clientRemark || c.id === clientUuid) || clientPayload;

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
      };
    });
}
