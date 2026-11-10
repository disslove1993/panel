// server.ts
import express from "express";
import http from "http";
import https from "https";
import path2 from "path";
import fs2 from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

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
  defaultInboundId: 4,
  // Inbound 4 (AI-Cloudflare-CDN)
  welcomeTokens: 1e3,
  // 1000 Tokens given to new users by default (matching the app UI)
  sanaeiPanelUrl: "https://panel.wpbaharak.ir:2053",
  sanaeiWebBasePath: "/",
  sanaeiUsername: "disslove22",
  sanaeiPassword: "199300",
  allowInsecure: true,
  plans: DEFAULT_PLANS
};
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
          users: parsed.users || {}
        };
      }
    } catch (err) {
      console.error("Error loading bridge store:", err);
    }
    return {
      settings: DEFAULT_SETTINGS,
      users: {}
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
  getAllUsers() {
    return Object.values(this.data.users).sort((a, b) => b.registeredAt - a.registeredAt);
  }
  findUserByIdOrEmail(identifier) {
    if (!identifier) return void 0;
    const clean = identifier.trim().toLowerCase();
    return Object.values(this.data.users).find(
      (u) => u.id === identifier || u.email.toLowerCase() === clean
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
    const newUser = {
      id,
      email,
      name: payload.name?.trim() || email.split("@")[0] || "User",
      tokens: payload.initialTokens !== void 0 ? payload.initialTokens : this.data.settings.welcomeTokens,
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
  app.use(express.json({ limit: "5mb" }));
  app.get("/install.sh", (_req, res) => {
    const installScriptPath = path2.resolve(__dirname, "install.sh");
    if (fs2.existsSync(installScriptPath)) {
      res.setHeader("Content-Type", "text/x-shellscript; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      return res.sendFile(installScriptPath);
    }
    res.status(404).send("install.sh not found");
  });
  app.get("/source.tar.gz", (_req, res) => {
    try {
      const tarPath = "/tmp/sanaei-bridge-dist.tar.gz";
      execSync(`tar --exclude='./node_modules' --exclude='./.git' -czf ${tarPath} -C "${__dirname}" .`);
      res.setHeader("Content-Type", "application/gzip");
      res.setHeader("Content-Disposition", 'attachment; filename="sanaei-bridge.tar.gz"');
      res.setHeader("Cache-Control", "no-cache");
      return res.sendFile(tarPath);
    } catch (err) {
      res.status(500).send(`Archive error: ${err?.message}`);
    }
  });
  app.post("/api/sanaei/connect", async (req, res) => {
    try {
      const conn = req.body;
      const session = await authenticatePanel(conn);
      const [inbounds, onlines] = await Promise.all([
        fetchInboundsFromPanel(session, conn.allowInsecure ?? true),
        fetchOnlineClients(session, conn.allowInsecure ?? true)
      ]);
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
        inboundId: inboundId || plan.inboundId
      });
      if (plan.priceTokens > 0) {
        user.tokens = Math.max(0, user.tokens - plan.priceTokens);
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
  app.get("/api/bridge/servers", async (_req, res) => {
    try {
      const inbounds = await getActiveSanaeiInbounds();
      const servers = formatServersList(inbounds);
      res.json({
        success: true,
        servers
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
      res.json({
        success: true,
        users,
        plans,
        settings,
        servers: formatServersList(inbounds),
        stats: {
          totalUsers: users.length,
          activeSubscriptions: users.filter((u) => u.subscription?.status === "active").length,
          totalTokensInCirculation: users.reduce((acc, u) => acc + (u.tokens || 0), 0)
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
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  const PORT = Number(process.env.PORT) || 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sanaei Management Panel server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
