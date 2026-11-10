import express from 'express';
import http from 'http';
import https from 'https';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { bridgeStore } from './bridgeStore';
import {
  registerSanaeiEngine,
  provisionClientOnSanaei,
  formatServersList,
  getActiveSanaeiInbounds,
} from './bridgeService';
import { buildClientConfigUri } from './src/utils/sanaeiHelpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PanelConnectionInput {
  panelUrl: string;
  webBasePath?: string;
  username?: string;
  password?: string;
  twoFactorCode?: string;
  sessionCookie?: string;
  apiToken?: string;
  allowInsecure?: boolean;
}

interface RawHttpResult {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

interface AuthSession {
  cookie: string;
  csrfToken: string;
  apiToken: string;
  fullBaseUrl: string;
  hostname: string;
}

function normalizePanelBaseUrl(
  rawUrl: string,
  extraBasePath?: string
): {
  origin: string;
  basePath: string;
  fullBaseUrl: string;
  hostHeader: string;
  hostname: string;
} {
  let trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    throw new Error('آدرس پنل ثنایی وارد نشده است.');
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }

  const parsed = new URL(trimmed);
  let pathname = parsed.pathname || '';

  // Strip known internal routes if the user pasted the full browser URL from their panel
  pathname = pathname
    .replace(/\/panel\/api\/openapi\.json.*$/i, '')
    .replace(/\/panel\/api\/inbounds.*$/i, '')
    .replace(/\/panel\/inbounds.*$/i, '')
    .replace(/\/panel\/?$/i, '')
    .replace(/\/xui\/inbounds.*$/i, '')
    .replace(/\/xui\/?$/i, '')
    .replace(/\/login\/?$/i, '');

  if (extraBasePath && extraBasePath.trim() && extraBasePath.trim() !== '/') {
    const cleanExtra = extraBasePath.trim().replace(/^\/+|\/+$/g, '');
    if (cleanExtra && !pathname.endsWith('/' + cleanExtra) && pathname !== '/' + cleanExtra) {
      pathname = `${pathname.replace(/\/+$/g, '')}/${cleanExtra}`;
    }
  }

  const cleanBasePath = pathname.replace(/\/+$/g, '');
  const fullBaseUrl = `${parsed.origin}${cleanBasePath}`;

  return {
    origin: parsed.origin,
    basePath: cleanBasePath,
    fullBaseUrl,
    hostHeader: parsed.host,
    hostname: parsed.hostname,
  };
}

function performHttpRequest(
  targetUrl: string,
  options: {
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: string;
    allowInsecure?: boolean;
    timeoutMs?: number;
  }
): Promise<RawHttpResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const isHttps = parsed.protocol === 'https:';
    const transport = isHttps ? https : http;

    const reqOptions: https.RequestOptions = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SanaeiManager/3.0',
        Accept: 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest',
        ...(options.headers || {}),
      },
      rejectUnauthorized: options.allowInsecure === false ? true : false,
      timeout: options.timeoutMs ?? 12000,
    };

    const req = transport.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(
        new Error(
          'مهلت زمانی اتصال به سرور ثنایی به پایان رسید (Timeout). لطفاً آدرس، پورت و فایروال سرور را بررسی کنید.'
        )
      );
    });

    req.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ECONNREFUSED') {
        reject(new Error('اتصال توسط سرور رد شد (ECONNREFUSED). پورت پنل یا وضعیت اجرای 3x-ui را بررسی کنید.'));
      } else if (err.code === 'ENOTFOUND') {
        reject(new Error('دامنه یا آدرس سرور یافت نشد (DNS Error).'));
      } else if (err.message?.includes('certificate') || err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
        reject(new Error('خطای گواهی SSL سرور. گزینه «نادیده گرفتن خطای گواهی SSL» را فعال کنید.'));
      } else {
        reject(new Error(`خطا در برقراری ارتباط با سرور: ${err.message}`));
      }
    });

    if (options.body !== undefined) {
      req.write(options.body);
    }
    req.end();
  });
}

function mergeCookies(existingCookieStr: string, setCookieHeader: string | string[] | undefined): string {
  const cookieMap = new Map<string, string>();

  if (existingCookieStr) {
    for (const part of existingCookieStr.split(';')) {
      const trimmed = part.trim();
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        cookieMap.set(trimmed.slice(0, eqIdx).trim(), trimmed.slice(eqIdx + 1).trim());
      }
    }
  }

  if (setCookieHeader) {
    const list = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    for (const item of list) {
      const firstSegment = item.split(';')[0]?.trim() || '';
      const eqIdx = firstSegment.indexOf('=');
      if (eqIdx > 0) {
        const k = firstSegment.slice(0, eqIdx).trim();
        const v = firstSegment.slice(eqIdx + 1).trim();
        if (v) {
          cookieMap.set(k, v);
        }
      }
    }
  }

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function fetchCsrfToken(
  fullBaseUrl: string,
  currentCookie: string,
  allowInsecure = true
): Promise<{ csrfToken: string; cookie: string }> {
  try {
    const res = await performHttpRequest(`${fullBaseUrl}/csrf-token`, {
      method: 'GET',
      headers: {
        ...(currentCookie ? { Cookie: currentCookie } : {}),
        Accept: 'application/json',
      },
      allowInsecure,
      timeoutMs: 6000,
    });

    const updatedCookie = mergeCookies(currentCookie, res.headers['set-cookie']);
    if (res.statusCode === 200 && res.body) {
      const parsed = JSON.parse(res.body);
      if (parsed && typeof parsed.obj === 'string') {
        return { csrfToken: parsed.obj, cookie: updatedCookie };
      }
    }
    return { csrfToken: '', cookie: updatedCookie };
  } catch {
    return { csrfToken: '', cookie: currentCookie };
  }
}

async function authenticatePanel(conn: PanelConnectionInput): Promise<AuthSession> {
  const { fullBaseUrl, hostname } = normalizePanelBaseUrl(conn.panelUrl, conn.webBasePath);
  const allowInsecure = conn.allowInsecure ?? true;

  // Mode 1: Scoped API Token (Bearer) supported by 3X-UI v3.x
  if (conn.apiToken && conn.apiToken.trim()) {
    const cleanToken = conn.apiToken.trim().replace(/^Bearer\s+/i, '');
    return {
      cookie: '',
      csrfToken: '',
      apiToken: cleanToken,
      fullBaseUrl,
      hostname,
    };
  }

  // Mode 2: Manual Session Cookie
  if (conn.sessionCookie && conn.sessionCookie.trim() && (!conn.username || !conn.password)) {
    const rawCookie = conn.sessionCookie.trim();
    const formattedCookie = rawCookie.includes('=') ? rawCookie : `3x-ui=${rawCookie}`;
    const postCsrf = await fetchCsrfToken(fullBaseUrl, formattedCookie, allowInsecure);
    return {
      cookie: postCsrf.cookie || formattedCookie,
      csrfToken: postCsrf.csrfToken,
      apiToken: '',
      fullBaseUrl,
      hostname,
    };
  }

  if (!conn.username || !conn.password) {
    throw new Error('نام کاربری و رمز عبور پنل ثنایی (یا API Token) الزامی است.');
  }

  // Step 1: Mint pre-login CSRF token + initial session cookie (Required by 3X-UI v3.x OAS 3.0)
  let cookieJar = '';
  let csrfToken = '';
  const initialCsrf = await fetchCsrfToken(fullBaseUrl, cookieJar, allowInsecure);
  cookieJar = initialCsrf.cookie;
  csrfToken = initialCsrf.csrfToken;

  const loginUrl = `${fullBaseUrl}/login`;
  const jsonPayload = JSON.stringify({
    username: conn.username,
    password: conn.password,
    ...(conn.twoFactorCode ? { twoFactorCode: conn.twoFactorCode, loginSecret: conn.twoFactorCode } : {}),
  });

  // Step 2: Attempt JSON POST /login with X-CSRF-Token and initial Cookie
  const jsonRes = await performHttpRequest(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(jsonPayload).toString(),
      ...(cookieJar ? { Cookie: cookieJar } : {}),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
    body: jsonPayload,
    allowInsecure,
  });

  cookieJar = mergeCookies(cookieJar, jsonRes.headers['set-cookie']);

  let loginSuccess = false;
  let loginErrorMsg = '';

  try {
    const parsed = JSON.parse(jsonRes.body);
    if (parsed && parsed.success === true) {
      loginSuccess = true;
    } else if (parsed && parsed.success === false) {
      loginErrorMsg = parsed.msg || 'نام کاربری یا رمز عبور پنل ثنایی نادرست است.';
    }
  } catch {
    // Fallback if older panel expects form-urlencoded
  }

  if (!loginSuccess && !loginErrorMsg) {
    const formPayload = new URLSearchParams({
      username: conn.username,
      password: conn.password,
      ...(conn.twoFactorCode ? { twoFactorCode: conn.twoFactorCode, loginSecret: conn.twoFactorCode } : {}),
    }).toString();

    const formRes = await performHttpRequest(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': Buffer.byteLength(formPayload).toString(),
        ...(cookieJar ? { Cookie: cookieJar } : {}),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      body: formPayload,
      allowInsecure,
    });

    cookieJar = mergeCookies(cookieJar, formRes.headers['set-cookie']);
    try {
      const parsedForm = JSON.parse(formRes.body);
      if (parsedForm && parsedForm.success === true) {
        loginSuccess = true;
      } else if (parsedForm && parsedForm.success === false) {
        loginErrorMsg = parsedForm.msg || 'احراز هویت در پنل ثنایی ناموفق بود.';
      }
    } catch {
      // ignore
    }
  }

  if (loginErrorMsg) {
    throw new Error(loginErrorMsg);
  }

  if (!cookieJar) {
    throw new Error(
      'کوکی نشست از پنل ثنایی دریافت نشد. لطفاً بررسی کنید آدرس پنل و مسیر WebBasePath دقیق باشد و نام کاربری و رمز عبور صحیح وارد شده باشد.'
    );
  }

  // Step 3: Refresh CSRF token for the authenticated session so subsequent POST requests succeed
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
    apiToken: '',
    fullBaseUrl,
    hostname,
  };
}

function buildAuthHeaders(session: AuthSession, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(extra || {}),
  };
  if (session.apiToken) {
    headers['Authorization'] = `Bearer ${session.apiToken}`;
  } else {
    if (session.cookie) headers['Cookie'] = session.cookie;
    if (session.csrfToken) headers['X-CSRF-Token'] = session.csrfToken;
  }
  return headers;
}

function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizeInboundItem(raw: Record<string, any>, nativeLinksByHint: Map<string, string>) {
  const settings = safeJsonParse<Record<string, any>>(raw.settings, { clients: [] });
  const streamSettings = safeJsonParse<Record<string, any>>(raw.streamSettings, {
    network: 'tcp',
    security: 'none',
  });
  const sniffing = safeJsonParse<Record<string, any>>(raw.sniffing, { enabled: true });

  const rawClients: Record<string, any>[] = Array.isArray(settings.clients) ? settings.clients : [];
  const rawStats: Record<string, any>[] = Array.isArray(raw.clientStats) ? raw.clientStats : [];

  const statsByEmail = new Map<string, Record<string, any>>();
  for (const stat of rawStats) {
    if (stat && stat.email) {
      statsByEmail.set(String(stat.email), stat);
    }
  }

  const remarkStr = String(raw.remark || `Inbound-${raw.id || 1}`);

  const mergedClients = rawClients.map((client, idx) => {
    const email = client.email || `client-${idx + 1}`;
    const stat = statsByEmail.get(email);
    const up = typeof stat?.up === 'number' ? stat.up : typeof client.up === 'number' ? client.up : 0;
    const down = typeof stat?.down === 'number' ? stat.down : typeof client.down === 'number' ? client.down : 0;
    const total =
      typeof client.totalGB === 'number' && client.totalGB > 0
        ? client.totalGB
        : typeof stat?.total === 'number'
        ? stat.total
        : 0;
    const expiryTime =
      typeof client.expiryTime === 'number' && client.expiryTime > 0
        ? client.expiryTime
        : typeof stat?.expiryTime === 'number'
        ? stat.expiryTime
        : 0;
    const enable =
      typeof client.enable === 'boolean'
        ? client.enable
        : typeof stat?.enable === 'boolean'
        ? stat.enable
        : true;

    const clientId = client.id || client.uuid || stat?.uuid || client.password || `id-${idx}`;
    const nativeUri =
      nativeLinksByHint.get(`${remarkStr}-${email}`.toLowerCase()) ||
      nativeLinksByHint.get(String(clientId).toLowerCase()) ||
      nativeLinksByHint.get(String(email).toLowerCase()) ||
      '';

    return {
      id: String(clientId),
      password: String(client.password || ''),
      email: String(email),
      flow: String(client.flow || ''),
      limitIp: Number(client.limitIp || 0),
      totalGB: total,
      expiryTime,
      enable,
      tgId: String(client.tgId || ''),
      subId: String(client.subId || stat?.subId || ''),
      up,
      down,
      nativeUri,
    };
  });

  for (const stat of rawStats) {
    if (stat?.email && !mergedClients.some((c) => c.email === stat.email)) {
      const email = String(stat.email);
      const clientId = String(stat.uuid || stat.id || email);
      const nativeUri =
        nativeLinksByHint.get(`${remarkStr}-${email}`.toLowerCase()) ||
        nativeLinksByHint.get(clientId.toLowerCase()) ||
        '';
      mergedClients.push({
        id: clientId,
        password: '',
        email,
        flow: '',
        limitIp: 0,
        totalGB: Number(stat.total || 0),
        expiryTime: Number(stat.expiryTime || 0),
        enable: Boolean(stat.enable ?? true),
        tgId: '',
        subId: String(stat.subId || ''),
        up: Number(stat.up || 0),
        down: Number(stat.down || 0),
        nativeUri,
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
    listen: String(raw.shareAddr || raw.listen || ''),
    port: Number(raw.port || 0),
    protocol: String(raw.protocol || 'vless').toLowerCase(),
    tag: String(raw.tag || `inbound-${raw.port || raw.id}`),
    network: String(streamSettings.network || 'tcp').toLowerCase(),
    security: String(streamSettings.security || 'none').toLowerCase(),
    settings,
    streamSettings,
    sniffing,
    clients: mergedClients,
  };
}

async function fetchNativeAllLinks(session: AuthSession, allowInsecure = true): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const res = await performHttpRequest(`${session.fullBaseUrl}/panel/api/inbounds/allLinks`, {
      method: 'GET',
      headers: buildAuthHeaders(session),
      allowInsecure,
      timeoutMs: 6000,
    });
    if (res.statusCode === 200 && res.body) {
      const parsed = JSON.parse(res.body);
      if (parsed?.success && Array.isArray(parsed.obj)) {
        for (const link of parsed.obj) {
          if (typeof link === 'string') {
            const hashIdx = link.lastIndexOf('#');
            if (hashIdx > 0) {
              const tag = decodeURIComponent(link.slice(hashIdx + 1)).toLowerCase();
              map.set(tag, link);
            }
            const protoIdx = link.indexOf('://');
            const atIdx = link.indexOf('@');
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
    // Optional 3X-UI v3.x endpoint
  }
  return map;
}

async function fetchInboundsFromPanel(session: AuthSession, allowInsecure = true) {
  const nativeLinksMap = await fetchNativeAllLinks(session, allowInsecure);

  const candidateEndpoints: { path: string; method: 'GET' | 'POST' }[] = [
    { path: '/panel/api/inbounds/list', method: 'GET' },
    { path: '/panel/api/inbounds/list', method: 'POST' },
    { path: '/panel/inbound/list', method: 'POST' },
    { path: '/xui/API/inbounds/', method: 'GET' },
    { path: '/xui/inbound/list', method: 'POST' },
  ];

  let lastError = 'امکان دریافت لیست این‌باندها از مسیرهای استاندارد پنل ثنایی وجود نداشت.';

  for (const candidate of candidateEndpoints) {
    try {
      const res = await performHttpRequest(`${session.fullBaseUrl}${candidate.path}`, {
        method: candidate.method,
        headers: buildAuthHeaders(session),
        body: candidate.method === 'POST' ? '' : undefined,
        allowInsecure,
      });

      if (res.statusCode >= 200 && res.statusCode < 300 && res.body) {
        const parsed = JSON.parse(res.body);
        if (parsed && parsed.success && Array.isArray(parsed.obj)) {
          return parsed.obj.map((item: Record<string, any>) => normalizeInboundItem(item, nativeLinksMap));
        }
        if (parsed && parsed.msg) {
          lastError = parsed.msg;
        }
      }
    } catch {
      // Try next endpoint candidate
    }
  }

  throw new Error(lastError);
}

async function fetchOnlineClients(session: AuthSession, allowInsecure = true): Promise<string[]> {
  const endpoints = [
    '/panel/api/clients/onlines',
    '/panel/api/inbounds/onlines',
    '/panel/inbound/onlines',
    '/xui/inbound/onlines',
  ];
  for (const ep of endpoints) {
    try {
      const res = await performHttpRequest(`${session.fullBaseUrl}${ep}`, {
        method: 'POST',
        headers: buildAuthHeaders(session, { 'Content-Length': '0' }),
        body: '',
        allowInsecure,
        timeoutMs: 5000,
      });
      if (res.statusCode === 200 && res.body) {
        const parsed = JSON.parse(res.body);
        if (parsed?.success && Array.isArray(parsed.obj)) {
          return parsed.obj.map(String);
        }
      }
    } catch {
      // Ignore if unsupported by panel version
    }
  }
  return [];
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Direct Install Script for VPS
  app.get('/install.sh', (_req, res) => {
    const installScriptPath = path.resolve(__dirname, 'install.sh');
    if (fs.existsSync(installScriptPath)) {
      res.setHeader('Content-Type', 'text/x-shellscript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      return res.sendFile(installScriptPath);
    }
    res.status(404).send('install.sh not found');
  });

  // Direct Source Bundle endpoint for VPS installer
  app.get('/source.tar.gz', (_req, res) => {
    try {
      const tarPath = '/tmp/sanaei-bridge-dist.tar.gz';
      execSync(`tar --exclude='./node_modules' --exclude='./.git' -czf ${tarPath} -C "${__dirname}" .`);
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="sanaei-bridge.tar.gz"');
      res.setHeader('Cache-Control', 'no-cache');
      return res.sendFile(tarPath);
    } catch (err: any) {
      res.status(500).send(`Archive error: ${err?.message}`);
    }
  });

  // Connect & fetch inbounds from Sanaei / 3x-ui panel (Supports 3X-UI v3.x CSRF + Bearer Token + 3x-ui v2.x)
  app.post('/api/sanaei/connect', async (req, res) => {
    try {
      const conn: PanelConnectionInput = req.body;
      const session = await authenticatePanel(conn);
      const [inbounds, onlines] = await Promise.all([
        fetchInboundsFromPanel(session, conn.allowInsecure ?? true),
        fetchOnlineClients(session, conn.allowInsecure ?? true),
      ]);

      res.json({
        success: true,
        fullBaseUrl: session.fullBaseUrl,
        hostname: session.hostname,
        sessionCookie: session.cookie,
        inbounds,
        onlines,
        connectedAt: Date.now(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err?.message || 'خطا در اتصال به پنل ثنایی',
      });
    }
  });

  // Add a client to an inbound on the remote Sanaei panel (Supports both 3X-UI v3.x /panel/api/clients/add and v2.x /panel/api/inbounds/addClient)
  app.post('/api/sanaei/add-client', async (req, res) => {
    try {
      const { connection, inboundId, client } = req.body;
      const session = await authenticatePanel(connection);
      const allowInsecure = connection.allowInsecure ?? true;

      let added = false;
      let panelMsg = '';

      // 1. Try 3X-UI v3.x JSON endpoint: POST /panel/api/clients/add
      try {
        const v3Payload = JSON.stringify({
          client: {
            email: client.email,
            subId: client.subId || '',
            id: client.id,
            password: client.password || client.id,
            flow: client.flow || '',
            totalGB: Number(client.totalGB || 0),
            expiryTime: Number(client.expiryTime || 0),
            limitIp: Number(client.limitIp || 0),
            limitHwid: 0,
            tgId: Number(client.tgId || 0),
            enable: Boolean(client.enable ?? true),
          },
          inboundIds: [Number(inboundId)],
        });

        const v3Res = await performHttpRequest(`${session.fullBaseUrl}/panel/api/clients/add`, {
          method: 'POST',
          headers: buildAuthHeaders(session, {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(v3Payload).toString(),
          }),
          body: v3Payload,
          allowInsecure,
        });

        if (v3Res.statusCode >= 200 && v3Res.statusCode < 300 && v3Res.body) {
          const parsed = JSON.parse(v3Res.body);
          if (parsed.success) {
            added = true;
            panelMsg = parsed.msg || 'کاربر جدید با موفقیت در پنل ثنایی ایجاد شد.';
          } else if (parsed.msg) {
            panelMsg = parsed.msg;
          }
        }
      } catch {
        // Fallback to v2 endpoints
      }

      // 2. Fallback to 3x-ui v2.x endpoints if v3 endpoint wasn't used
      if (!added) {
        const settingsPayload = JSON.stringify({
          clients: [client],
        });

        const bodyParams = new URLSearchParams({
          id: String(inboundId),
          settings: settingsPayload,
        }).toString();

        const v2Endpoints = ['/panel/api/inbounds/addClient', '/panel/inbound/addClient', '/xui/inbound/addClient'];
        for (const ep of v2Endpoints) {
          try {
            const response = await performHttpRequest(`${session.fullBaseUrl}${ep}`, {
              method: 'POST',
              headers: buildAuthHeaders(session, {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Content-Length': Buffer.byteLength(bodyParams).toString(),
              }),
              body: bodyParams,
              allowInsecure,
            });
            if (response.statusCode === 200 && response.body) {
              const parsed = JSON.parse(response.body);
              if (parsed.success) {
                added = true;
                panelMsg = parsed.msg || 'کاربر جدید با موفقیت در پنل ثنایی ایجاد شد.';
                break;
              } else if (parsed.msg) {
                panelMsg = parsed.msg;
              }
            }
          } catch {
            // continue
          }
        }
      }

      if (!added) {
        throw new Error(panelMsg || 'خطا در افزودن کاربر به این‌باند در پنل ثنایی.');
      }

      const inbounds = await fetchInboundsFromPanel(session, allowInsecure);
      res.json({
        success: true,
        message: panelMsg,
        inbounds,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err?.message || 'خطا در افزودن کاربر به پنل ثنایی',
      });
    }
  });

  // Reset traffic for a specific client (Supports 3X-UI v3.x /panel/api/clients/resetTraffic/:email and v2.x)
  app.post('/api/sanaei/reset-client-traffic', async (req, res) => {
    try {
      const { connection, inboundId, email } = req.body;
      const session = await authenticatePanel(connection);
      const allowInsecure = connection.allowInsecure ?? true;

      const encodedEmail = encodeURIComponent(email);
      const endpoints = [
        `/panel/api/clients/resetTraffic/${encodedEmail}`,
        `/panel/api/inbounds/${inboundId}/resetClientTraffic/${encodedEmail}`,
        `/panel/inbound/${inboundId}/resetClientTraffic/${encodedEmail}`,
      ];

      let success = false;
      for (const ep of endpoints) {
        try {
          const response = await performHttpRequest(`${session.fullBaseUrl}${ep}`, {
            method: 'POST',
            headers: buildAuthHeaders(session, { 'Content-Length': '0' }),
            body: '',
            allowInsecure,
          });
          if (response.statusCode === 200 && response.body) {
            const parsed = JSON.parse(response.body);
            if (parsed.success) {
              success = true;
              break;
            }
          }
        } catch {
          // continue
        }
      }

      if (!success) {
        throw new Error('ریست ترافیک کاربر در پنل ثنایی انجام نشد.');
      }

      const inbounds = await fetchInboundsFromPanel(session, allowInsecure);
      res.json({
        success: true,
        message: `ترافیک کاربر ${email} با موفقیت صفر شد.`,
        inbounds,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err?.message || 'خطا در صفر کردن ترافیک کاربر',
      });
    }
  });

  // Register Sanaei Engine for Bridge automation
  registerSanaeiEngine({
    authenticatePanel,
    fetchInboundsFromPanel,
    performHttpRequest,
    buildAuthHeaders,
    buildClientConfigUri,
  });

  // CORS Middleware for Mobile App API requests
  app.use('/api/bridge', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // ==========================================
  // MOBILE APP BRIDGE API ENDPOINTS
  // ==========================================

  // 1. Get available plans (e.g. 1 Month 10GB, 30GB, 60GB, Free Trial)
  app.get('/api/bridge/plans', (_req, res) => {
    res.json({
      success: true,
      plans: bridgeStore.getPlans(),
    });
  });

  // 2. Register new mobile user or retrieve existing
  app.post('/api/bridge/register', async (req, res) => {
    try {
      const { email, name, deviceId, autoSubscribePlanId, inboundId } = req.body;
      if (!email || !String(email).trim()) {
        return res.status(400).json({
          success: false,
          message: 'فیلد ایمیل یا شناسه کاربری (email) الزامی است.',
        });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      let user = bridgeStore.findUserByIdOrEmail(cleanEmail);
      let isNewUser = false;

      if (!user) {
        user = bridgeStore.createUser({
          email: cleanEmail,
          name: name || cleanEmail.split('@')[0],
          deviceId: deviceId || '',
        });
        isNewUser = true;
      }

      // If client requested automatic subscription upon registration (e.g. 1 Month 10GB or free trial)
      if (autoSubscribePlanId) {
        const plan = bridgeStore.getPlanById(autoSubscribePlanId);
        if (plan) {
          const trafficBytes = plan.trafficGB * 1024 * 1024 * 1024;
          const expiryTimeMs = Date.now() + plan.periodDays * 24 * 60 * 60 * 1000;

          const provisionResult = await provisionClientOnSanaei({
            email: user.email,
            trafficBytes,
            expiryTimeMs,
            inboundId: inboundId || plan.inboundId,
          });

          user.subscription = {
            status: 'active',
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
            subscribedAt: Date.now(),
          };

          if (plan.priceTokens > 0 && user.tokens >= plan.priceTokens) {
            user.tokens -= plan.priceTokens;
          }
          bridgeStore.updateUser(user);
        }
      }

      res.json({
        success: true,
        message: isNewUser ? 'ثبت‌نام کاربر در سیستم با موفقیت انجام شد.' : 'کاربر در سیستم یافت شد.',
        isNewUser,
        user,
        availablePlans: bridgeStore.getPlans(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'خطا در ثبت‌نام کاربر در پل ارتباطی',
      });
    }
  });

  // 3. User Login / Check State
  app.post('/api/bridge/login', (req, res) => {
    const { email, deviceId } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'ایمیل یا نام کاربری الزامی است.' });
    }

    const user = bridgeStore.findUserByIdOrEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربری با این مشخصات یافت نشد. لطفاً ابتدا ثبت‌نام کنید.',
      });
    }

    if (deviceId && user.deviceId !== deviceId) {
      user.deviceId = deviceId;
      bridgeStore.updateUser(user);
    }

    res.json({
      success: true,
      user,
      plans: bridgeStore.getPlans(),
    });
  });

  // 4. Get User Profile & Subscription Status
  app.get('/api/bridge/user/:identifier', (req, res) => {
    const user = bridgeStore.findUserByIdOrEmail(req.params.identifier);
    if (!user) {
      return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });
    }

    // Calculate real-time remaining days
    if (user.subscription && user.subscription.status === 'active' && user.subscription.expiryTime > 0) {
      const diffMs = user.subscription.expiryTime - Date.now();
      user.subscription.remainingDays = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
      if (diffMs <= 0) {
        user.subscription.status = 'expired';
      }
    }

    res.json({
      success: true,
      user,
    });
  });

  // 5. Purchase / Activate Subscription (e.g. 1 Month 10GB)
  // This directly calls Sanaei 3X-UI, creates a client on the inbound, and returns the config URI!
  app.post('/api/bridge/purchase', async (req, res) => {
    try {
      const { email, userId, planId, inboundId } = req.body;
      const targetIdentifier = email || userId;

      if (!targetIdentifier) {
        return res.status(400).json({ success: false, message: 'شناسه کاربر یا ایمیل (email) الزامی است.' });
      }

      let user = bridgeStore.findUserByIdOrEmail(targetIdentifier);
      if (!user) {
        // Auto-create user if registering directly at purchase
        user = bridgeStore.createUser({ email: targetIdentifier });
      }

      const plan = bridgeStore.getPlanById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: `پلن با شناسه «${planId}» یافت نشد. لیست پلن‌ها را از GET /api/bridge/plans دریافت کنید.`,
        });
      }

      // Check token balance if required
      if (plan.priceTokens > 0 && user.tokens < plan.priceTokens) {
        return res.status(402).json({
          success: false,
          message: `موجودی توکن شما کافی نیست. موجودی فعلی: ${user.tokens} توکن | هزینه اشتراک: ${plan.priceTokens} توکن.`,
          requiredTokens: plan.priceTokens,
          currentTokens: user.tokens,
        });
      }

      // Provision on real Sanaei Panel
      const trafficBytes = plan.trafficGB * 1024 * 1024 * 1024;
      const expiryTimeMs = Date.now() + plan.periodDays * 24 * 60 * 60 * 1000;

      const provisionResult = await provisionClientOnSanaei({
        email: user.email,
        trafficBytes,
        expiryTimeMs,
        inboundId: inboundId || plan.inboundId,
      });

      // Deduct tokens
      if (plan.priceTokens > 0) {
        user.tokens = Math.max(0, user.tokens - plan.priceTokens);
      }

      user.subscription = {
        status: 'active',
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
        subscribedAt: Date.now(),
      };

      bridgeStore.updateUser(user);

      res.json({
        success: true,
        message: `اشتراک «${plan.name}» با موفقیت فعال شد و کانفیگ اتصال اختصاصی صادر گردید.`,
        subscription: user.subscription,
        configUri: provisionResult.configUri,
        subUrl: provisionResult.subUrl,
        user: {
          id: user.id,
          email: user.email,
          tokens: user.tokens,
        },
      });
    } catch (err: any) {
      console.error('Purchase failed:', err);
      res.status(500).json({
        success: false,
        message: err?.message || 'خطا در فعال‌سازی اشتراک روی پنل ثنایی',
      });
    }
  });

  // 6. Get Available VPN Servers list (formatted for Mobile App UI)
  app.get('/api/bridge/servers', async (_req, res) => {
    try {
      const inbounds = await getActiveSanaeiInbounds();
      const servers = formatServersList(inbounds);
      res.json({
        success: true,
        servers,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'خطا در دریافت لیست سرورها',
        servers: [],
      });
    }
  });

  // 7. Get raw VPN Config URI for User (for direct connection in App VPN core)
  app.get('/api/bridge/config/:identifier', (req, res) => {
    const user = bridgeStore.findUserByIdOrEmail(req.params.identifier);
    if (!user || !user.subscription || user.subscription.status !== 'active') {
      return res.status(404).send('No active subscription found for this user.');
    }

    if (req.query.format === 'json') {
      return res.json({
        configUri: user.subscription.configUri,
        protocol: user.subscription.inboundProtocol,
        uuid: user.subscription.clientUuid,
        port: user.subscription.inboundPort,
      });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(user.subscription.configUri);
  });

  // 8. Subscription Link for Standard V2Ray / Xray mobile cores
  app.get('/api/bridge/sub/:identifier', (req, res) => {
    const user = bridgeStore.findUserByIdOrEmail(req.params.identifier);
    if (!user || !user.subscription?.configUri) {
      return res.status(404).send('');
    }

    const base64Data = Buffer.from(user.subscription.configUri).toString('base64');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Profile-Update-Interval', '12');
    res.send(base64Data);
  });

  // 9. Admin Overview (for our Web Panel)
  app.get('/api/bridge/admin/overview', async (_req, res) => {
    try {
      const users = bridgeStore.getAllUsers();
      const plans = bridgeStore.getPlans();
      const settings = bridgeStore.getSettings();
      const inbounds = await getActiveSanaeiInbounds();

      res.json({
        success: true,
        users,
        plans,
        settings,
        servers: formatServersList(inbounds),
        stats: {
          totalUsers: users.length,
          activeSubscriptions: users.filter((u) => u.subscription?.status === 'active').length,
          totalTokensInCirculation: users.reduce((acc, u) => acc + (u.tokens || 0), 0),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // 10. Admin: Update user tokens
  app.post('/api/bridge/admin/user/tokens', (req, res) => {
    const { userId, tokens } = req.body;
    const user = bridgeStore.findUserByIdOrEmail(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });
    }
    user.tokens = Math.max(0, Number(tokens) || 0);
    bridgeStore.updateUser(user);
    res.json({ success: true, user });
  });

  // 11. Admin: Delete Bridge User
  app.delete('/api/bridge/admin/user/:userId', (req, res) => {
    const deleted = bridgeStore.deleteUser(req.params.userId);
    res.json({ success: deleted });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sanaei Management Panel server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
