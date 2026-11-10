import React, { useState, useEffect, useMemo } from 'react';
import {
  Server,
  Plus,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronLeft,
  UserPlus,
  Copy,
  Check,
  Link2,
  Code2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sun,
  Moon,
  Trash2,
  Edit3,
  ArrowUpDown,
  ShieldCheck,
  HardDrive,
  Users,
  Network,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { SanaeiClient, SanaeiInbound, SanaeiPanelProfile } from './types/sanaei';
import {
  buildClientConfigUri,
  createDemoSanaeiProfile,
  formatBytes,
  formatExpiryStatus,
} from './utils/sanaeiHelpers';
import { PanelConnectionModal } from './components/PanelConnectionModal';
import { AddClientModal } from './components/AddClientModal';
import { ClientConfigModal } from './components/ClientConfigModal';
import { InboundDetailsModal } from './components/InboundDetailsModal';
import { BridgeManagementView } from './components/BridgeManagementView';

const STORAGE_KEY = 'sanaei_manager_profiles_v1';
const ACTIVE_ID_KEY = 'sanaei_manager_active_id_v1';

type ActiveSection = 'inbounds' | 'bridge' | 'clients' | 'servers' | 'manual-connect';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [profiles, setProfiles] = useState<SanaeiPanelProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return [createDemoSanaeiProfile()];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_ID_KEY) || 'demo-hetzner-de';
    } catch {
      return 'demo-hetzner-de';
    }
  });

  const [activeSection, setActiveSection] = useState<ActiveSection>('inbounds');

  // Filtering & search states for Inbounds
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [expandedInboundIds, setExpandedInboundIds] = useState<number[]>([1]);

  // Modals state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SanaeiPanelProfile | null>(null);
  const [addClientInbound, setAddClientInbound] = useState<SanaeiInbound | null>(null);
  const [selectedClientModal, setSelectedClientModal] = useState<{
    inbound: SanaeiInbound;
    client: SanaeiClient;
  } | null>(null);
  const [inspectInbound, setInspectInbound] = useState<SanaeiInbound | null>(null);

  // Sync & Toast Notification state
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inline Manual Connect form state (for the dedicated 'manual-connect' tab)
  const [inlineName, setInlineName] = useState('پنل ثنایی (wpbaharak)');
  const [inlineUrl, setInlineUrl] = useState('https://panel.wpbaharak.ir:2053');
  const [inlineBasePath, setInlineBasePath] = useState('/');
  const [inlineUser, setInlineUser] = useState('disslove22');
  const [inlinePass, setInlinePass] = useState('199300');
  const [inlineCookie, setInlineCookie] = useState('');
  const [inlineAllowInsecure, setInlineAllowInsecure] = useState(true);
  const [inlineShowPass, setInlineShowPass] = useState(false);
  const [inlineLoading, setInlineLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Automatically connect to user's live panel https://panel.wpbaharak.ir:2053 on load if not yet added
  useEffect(() => {
    const hasWpBaharak = profiles.some((p) => p.panelUrl.includes('wpbaharak.ir'));
    if (!hasWpBaharak) {
      fetch('/api/sanaei/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panelUrl: 'https://panel.wpbaharak.ir:2053',
          webBasePath: '/',
          username: 'disslove22',
          password: '199300',
          allowInsecure: true,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.success && Array.isArray(data.inbounds)) {
            const liveProfile: SanaeiPanelProfile = {
              id: 'panel-wpbaharak-live',
              name: 'پنل ثنایی (panel.wpbaharak.ir)',
              panelUrl: 'https://panel.wpbaharak.ir:2053',
              webBasePath: '/',
              username: 'disslove22',
              password: '199300',
              sessionCookie: data.sessionCookie || '',
              allowInsecure: true,
              mode: 'live',
              hostname: data.hostname || 'panel.wpbaharak.ir',
              lastSyncAt: Date.now(),
              inbounds: data.inbounds,
              onlineEmails: data.onlines || [],
            };
            setProfiles((prev) => [liveProfile, ...prev.filter((p) => p.id !== 'panel-wpbaharak-live')]);
            setActiveProfileId('panel-wpbaharak-live');
            if (data.inbounds.length > 0) {
              setExpandedInboundIds(data.inbounds.map((i: SanaeiInbound) => i.id));
            }
          }
        })
        .catch(() => {
          // Ignore background auto-connect failure
        });
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // ignore quota error
    }
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_ID_KEY, activeProfileId);
    } catch {
      // ignore
    }
  }, [activeProfileId]);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || profiles[0] || createDemoSanaeiProfile();
  }, [profiles, activeProfileId]);

  const handleSaveProfile = (newProf: SanaeiPanelProfile) => {
    setProfiles((prev) => {
      const exists = prev.some((p) => p.id === newProf.id);
      if (exists) {
        return prev.map((p) => (p.id === newProf.id ? newProf : p));
      }
      return [newProf, ...prev];
    });
    setActiveProfileId(newProf.id);
    if (newProf.inbounds.length > 0) {
      setExpandedInboundIds([newProf.inbounds[0].id]);
    }
    setActiveSection('inbounds');
    showNotice(`پنل «${newProf.name}» با ${newProf.inbounds.length} این‌باند متصل و بارگذاری شد.`);
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) {
      showNotice('حداقل یک پنل باید در لیست باقی بماند.', 'error');
      return;
    }
    const next = profiles.filter((p) => p.id !== id);
    setProfiles(next);
    if (activeProfile.id === id) {
      setActiveProfileId(next[0].id);
    }
    showNotice('پنل انتخاب‌شده از لیست حذف گردید.');
  };

  const handleRefreshActivePanel = async () => {
    if (activeProfile.mode !== 'live') {
      const updated = { ...activeProfile, lastSyncAt: Date.now() };
      setProfiles((prev) => prev.map((p) => (p.id === activeProfile.id ? updated : p)));
      showNotice('اطلاعات این‌باندهای پنل بروزرسانی شد.');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch('/api/sanaei/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panelUrl: activeProfile.panelUrl,
          webBasePath: activeProfile.webBasePath,
          username: activeProfile.username,
          password: activeProfile.password,
          twoFactorCode: activeProfile.twoFactorCode,
          sessionCookie: activeProfile.sessionCookie,
          allowInsecure: activeProfile.allowInsecure,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'خطا در همگام‌سازی با پنل ثنایی.');
      }

      const updated: SanaeiPanelProfile = {
        ...activeProfile,
        sessionCookie: data.sessionCookie || activeProfile.sessionCookie,
        inbounds: data.inbounds || [],
        onlineEmails: data.onlines || [],
        lastSyncAt: Date.now(),
      };
      setProfiles((prev) => prev.map((p) => (p.id === activeProfile.id ? updated : p)));
      showNotice(`همگام‌سازی انجام شد: ${updated.inbounds.length} این‌باند از سرور ثنایی دریافت گردید.`);
    } catch (err: any) {
      showNotice(err?.message || 'خطا در دریافت مجدد این‌باندها', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInlineManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    if (!inlineUrl.trim()) {
      setInlineError('وارد کردن آدرس پنل ثنایی (همراه با پورت) الزامی است.');
      return;
    }
    if (!inlineCookie.trim() && (!inlineUser.trim() || !inlinePass.trim())) {
      setInlineError('نام کاربری و رمز عبور پنل ثنایی را وارد کنید.');
      return;
    }

    setInlineLoading(true);
    try {
      const response = await fetch('/api/sanaei/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panelUrl: inlineUrl.trim(),
          webBasePath: inlineBasePath.trim(),
          username: inlineUser.trim(),
          password: inlinePass,
          sessionCookie: inlineCookie.trim(),
          allowInsecure: inlineAllowInsecure,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'اتصال به پنل ثنایی ناموفق بود.');
      }

      const created: SanaeiPanelProfile = {
        id: `panel-${Date.now()}`,
        name: inlineName.trim() || `پنل ثنایی (${data.hostname})`,
        panelUrl: inlineUrl.trim(),
        webBasePath: inlineBasePath.trim(),
        username: inlineUser.trim(),
        password: inlinePass,
        sessionCookie: data.sessionCookie || inlineCookie.trim(),
        allowInsecure: inlineAllowInsecure,
        mode: 'live',
        hostname: data.hostname || 'localhost',
        lastSyncAt: Date.now(),
        inbounds: data.inbounds || [],
        onlineEmails: data.onlines || [],
      };

      handleSaveProfile(created);
      setInlineName('');
      setInlineUrl('');
      setInlineBasePath('');
      setInlineUser('');
      setInlinePass('');
      setInlineCookie('');
    } catch (err: any) {
      setInlineError(err?.message || 'خطا در اتصال به پنل ثنایی');
    } finally {
      setInlineLoading(false);
    }
  };

  const toggleInboundExpand = (id: number) => {
    setExpandedInboundIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleInboundStatus = (inboundId: number) => {
    const updatedInbounds = activeProfile.inbounds.map((inb) =>
      inb.id === inboundId ? { ...inb, enable: !inb.enable } : inb
    );
    setProfiles((prev) =>
      prev.map((p) => (p.id === activeProfile.id ? { ...p, inbounds: updatedInbounds } : p))
    );
    const target = activeProfile.inbounds.find((i) => i.id === inboundId);
    if (target) {
      showNotice(
        `وضعیت این‌باند «${target.remark}» به ${!target.enable ? 'فعال' : 'غیرفعال'} تغییر یافت.`
      );
    }
  };

  const handleResetClientTraffic = async (inbound: SanaeiInbound, client: SanaeiClient) => {
    if (activeProfile.mode === 'live') {
      try {
        const res = await fetch('/api/sanaei/reset-client-traffic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connection: {
              panelUrl: activeProfile.panelUrl,
              webBasePath: activeProfile.webBasePath,
              username: activeProfile.username,
              password: activeProfile.password,
              twoFactorCode: activeProfile.twoFactorCode,
              sessionCookie: activeProfile.sessionCookie,
              allowInsecure: activeProfile.allowInsecure,
            },
            inboundId: inbound.id,
            email: client.email,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'خطا در ریست ترافیک کاربر.');
        }
        setProfiles((prev) =>
          prev.map((p) => (p.id === activeProfile.id ? { ...p, inbounds: data.inbounds } : p))
        );
        showNotice(data.message);
      } catch (err: any) {
        showNotice(err?.message || 'خطا در صفر کردن ترافیک روی پنل ثنایی', 'error');
      }
    } else {
      const updatedInbounds = activeProfile.inbounds.map((inb) =>
        inb.id === inbound.id
          ? {
              ...inb,
              clients: inb.clients.map((c) =>
                c.email === client.email ? { ...c, up: 0, down: 0 } : c
              ),
            }
          : inb
      );
      setProfiles((prev) =>
        prev.map((p) => (p.id === activeProfile.id ? { ...p, inbounds: updatedInbounds } : p))
      );
      showNotice(`ترافیک مصرفی کاربر «${client.email}» صفر شد.`);
    }
  };

  const handleToggleClientEnable = (inboundId: number, email: string) => {
    const updatedInbounds = activeProfile.inbounds.map((inb) =>
      inb.id === inboundId
        ? {
            ...inb,
            clients: inb.clients.map((c) =>
              c.email === email ? { ...c, enable: !c.enable } : c
            ),
          }
        : inb
    );
    setProfiles((prev) =>
      prev.map((p) => (p.id === activeProfile.id ? { ...p, inbounds: updatedInbounds } : p))
    );
  };

  const handleQuickCopyUri = (inbound: SanaeiInbound, client: SanaeiClient) => {
    const uri = buildClientConfigUri(inbound, client, activeProfile.hostname);
    navigator.clipboard.writeText(uri);
    const key = `${inbound.id}-${client.email}`;
    setCopiedId(key);
    setTimeout(() => setCopiedId((prev) => (prev === key ? null : prev)), 2000);
    showNotice(`لینک اتصال کاربر «${client.email}» در کلیپ‌بورد کپی شد.`);
  };

  // Filtered Inbounds
  const filteredInbounds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeProfile.inbounds.filter((inb) => {
      if (protocolFilter !== 'all' && inb.protocol !== protocolFilter) {
        return false;
      }
      if (statusFilter === 'active' && !inb.enable) return false;
      if (statusFilter === 'disabled' && inb.enable) return false;

      if (!q) return true;
      const matchesInbound =
        inb.remark.toLowerCase().includes(q) ||
        String(inb.port).includes(q) ||
        inb.protocol.toLowerCase().includes(q) ||
        inb.network.toLowerCase().includes(q) ||
        inb.security.toLowerCase().includes(q);
      const matchesClient = inb.clients.some(
        (c) => c.email.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
      );
      return matchesInbound || matchesClient;
    });
  }, [activeProfile.inbounds, searchQuery, protocolFilter, statusFilter]);

  // Aggregate KPI Metrics
  const stats = useMemo(() => {
    const totalInbounds = activeProfile.inbounds.length;
    const activeInbounds = activeProfile.inbounds.filter((i) => i.enable).length;
    let totalClients = 0;
    let enabledClients = 0;
    let totalUp = 0;
    let totalDown = 0;

    for (const inb of activeProfile.inbounds) {
      totalUp += inb.up || 0;
      totalDown += inb.down || 0;
      totalClients += inb.clients.length;
      enabledClients += inb.clients.filter((c) => c.enable).length;
    }

    return {
      totalInbounds,
      activeInbounds,
      totalClients,
      enabledClients,
      totalUp,
      totalDown,
      totalTraffic: totalUp + totalDown,
    };
  }, [activeProfile.inbounds]);

  // Flattened Clients list for the 'clients' section
  const allClientsFlattened = useMemo(() => {
    const list: { inbound: SanaeiInbound; client: SanaeiClient }[] = [];
    const q = searchQuery.trim().toLowerCase();
    for (const inb of activeProfile.inbounds) {
      for (const client of inb.clients) {
        if (
          !q ||
          client.email.toLowerCase().includes(q) ||
          client.id.toLowerCase().includes(q) ||
          inb.remark.toLowerCase().includes(q) ||
          String(inb.port).includes(q)
        ) {
          list.push({ inbound: inb, client });
        }
      }
    }
    return list;
  }, [activeProfile.inbounds, searchQuery]);

  const getInboundEndpointHint = (inb: SanaeiInbound): string => {
    const stream = inb.streamSettings || {};
    if (inb.security === 'reality') {
      const sni = stream.realitySettings?.serverNames?.[0] || '';
      return sni ? `SNI: ${sni}` : 'Reality Vision';
    }
    if (inb.network === 'ws') {
      const path = stream.wsSettings?.path || '/';
      return `WS Path: ${path}`;
    }
    if (inb.network === 'grpc') {
      const svc = stream.grpcSettings?.serviceName || '';
      return svc ? `gRPC: ${svc}` : 'gRPC Stream';
    }
    if (inb.security === 'tls') {
      const sni = stream.tlsSettings?.serverName || '';
      return sni ? `TLS: ${sni}` : 'TLS Secured';
    }
    return `Tag: ${inb.tag}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Brand Title, single line */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('inbounds');
          }}
          className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
        >
          مدیریت پنل ثنایی
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setActiveSection('inbounds')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'inbounds'
                ? 'text-slate-900 dark:text-white underline underline-offset-8 decoration-2 decoration-sky-500'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            این‌باندهای پنل
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('bridge')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeSection === 'bridge'
                ? 'text-slate-900 dark:text-white underline underline-offset-8 decoration-2 decoration-sky-500 font-semibold'
                : 'hover:text-slate-900 dark:hover:text-slate-200 text-sky-600 dark:text-sky-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            پل ارتباطی اپلیکیشن (Bridge API)
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('manual-connect')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'manual-connect'
                ? 'text-slate-900 dark:text-white underline underline-offset-8 decoration-2 decoration-sky-500'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            اتصال دستی پنل
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('clients')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'clients'
                ? 'text-slate-900 dark:text-white underline underline-offset-8 decoration-2 decoration-sky-500'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            همه کاربران
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('servers')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'servers'
                ? 'text-slate-900 dark:text-white underline underline-offset-8 decoration-2 decoration-sky-500'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            سرورهای ذخیره شده
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditingProfile(null);
              setIsConnectModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            + اتصال پنل ثنایی جدید
          </button>
        </div>
      </header>

      {/* Main Workspace Canvas: Sidebar (260px in RTL) + Main Content Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            {/* Active Server Selector List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  پنل‌های ثنایی متصل ({profiles.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(null);
                    setIsConnectModalOpen(true);
                  }}
                  className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  افزودن پنل
                </button>
              </div>

              <div className="space-y-2">
                {profiles.map((prof) => {
                  const isSelected = prof.id === activeProfile.id;
                  return (
                    <div
                      key={prof.id}
                      onClick={() => {
                        setActiveProfileId(prof.id);
                        if (prof.inbounds.length > 0) {
                          setExpandedInboundIds([prof.inbounds[0].id]);
                        }
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-500/60 dark:border-sky-500/50 text-slate-900 dark:text-white'
                          : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold truncate">{prof.name}</span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                          {prof.inbounds.length} این‌باند
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono" dir="ltr">
                        <span className="truncate">{prof.hostname}</span>
                        <span>
                          {prof.mode === 'live' ? 'API' : prof.mode === 'json' ? 'JSON' : 'Demo'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile/Quick Navigation inside Sidebar */}
            <div className="space-y-1 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                بخش‌های مدیریتی
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('inbounds')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeSection === 'inbounds'
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Network className="w-4 h-4" />
                  لیست این‌باندهای پنل
                </span>
                <span className="font-mono tabular-nums">{stats.totalInbounds}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('bridge')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeSection === 'bridge'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4" />
                  پل ارتباطی اپلیکیشن (Bridge)
                </span>
                <span className="px-1.5 py-0.5 text-[10px] bg-sky-500/20 text-sky-400 rounded">API</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('manual-connect')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeSection === 'manual-connect'
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4" />
                  فرم اتصال دستی به ثنایی
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('clients')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeSection === 'clients'
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  بانک کاربران همه این‌باندها
                </span>
                <span className="font-mono tabular-nums">{stats.totalClients}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('servers')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeSection === 'servers'
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Server className="w-4 h-4" />
                  مدیریت سرورهای متصل
                </span>
                <span className="font-mono tabular-nums">{profiles.length}</span>
              </button>
            </div>
          </div>

          {/* Sidebar Footer: Theme Switch & Connection Guide */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">حالت نمایش پنل</span>
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    حالت روشن
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-600" />
                    حالت تیره
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              پشتیبانی از تمامی نسخه‌های پنل ثنایی (MHSanaei 3x-ui و X-UI) از طریق پروکسی سرور داخلی بدون محدودیت CORS.
            </p>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-full overflow-x-hidden space-y-6">
          {/* Notification Banner */}
          {toast && (
            <div
              className={`p-3.5 rounded-lg border flex items-center justify-between text-xs font-medium ${
                toast.type === 'error'
                  ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <span>{toast.text}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mr-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* Active Server Context Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>سرور فعال</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono" dir="ltr">
                  {activeProfile.panelUrl}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {activeProfile.mode === 'live'
                    ? 'متصل به API زنده پنل ثنایی'
                    : activeProfile.mode === 'json'
                    ? 'بارگذاری شده از JSON دستی'
                    : 'سرور نمونه آماده (جهت تست محیط)'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {activeProfile.name}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleRefreshActivePanel}
                disabled={isSyncing}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-500' : ''}`} />
                {isSyncing ? 'در حال دریافت از پنل...' : 'بروزرسانی این‌باندها'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingProfile(activeProfile);
                  setIsConnectModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                ویرایش اطلاعات اتصال
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('manual-connect')}
                className="px-3.5 py-2 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 hover:bg-sky-100 dark:hover:bg-sky-950/70 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                ورود دستی مشخصات پنل ثنایی
              </button>
            </div>
          </div>

          {/* 4-Column KPI Summary Strip */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-200 dark:divide-slate-800">
            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>کل این‌باندهای موجود در پنل</span>
                <Network className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {stats.totalInbounds}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{stats.activeInbounds} این‌باند فعال</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{stats.totalInbounds - stats.activeInbounds} غیرفعال</span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>مجموع کاربران (Clients)</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {stats.totalClients}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{stats.enabledClients} کاربر فعال</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{activeProfile.onlineEmails.length} آنلاین</span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>کل ترافیک مصرفی این‌باندها</span>
                <HardDrive className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100" dir="ltr">
                {formatBytes(stats.totalTraffic)}
              </div>
              <div className="mt-1 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400" dir="ltr">
                <span>↓ {formatBytes(stats.totalDown)}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>↑ {formatBytes(stats.totalUp)}</span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>میزبان و وضعیت هسته Xray</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 truncate" dir="ltr">
                {activeProfile.hostname}
              </div>
              <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>کاربر پنل: {activeProfile.username}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>پورت‌های باز: {stats.activeInbounds}</span>
              </div>
            </div>
          </section>

          {/* SECTION 1: INBOUNDS LIST & EXPANDABLE CLIENTS */}
          {activeSection === 'inbounds' && (
            <section className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                {/* Search input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو بر اساس نام این‌باند، پورت، پروتکل یا ایمیل کاربر..."
                    className="w-full pr-10 pl-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Interactive Segmented Protocol & Status Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-lg">
                    {[
                      { id: 'all', label: 'همه پروتکل‌ها' },
                      { id: 'vless', label: 'VLESS' },
                      { id: 'wireguard', label: 'WireGuard' },
                      { id: 'vmess', label: 'VMess' },
                      { id: 'trojan', label: 'Trojan' },
                      { id: 'shadowsocks', label: 'Shadowsocks' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setProtocolFilter(item.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          protocolFilter === item.id
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-lg">
                    {[
                      { id: 'all', label: 'همه' },
                      { id: 'active', label: 'فعال' },
                      { id: 'disabled', label: 'غیرفعال' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStatusFilter(st.id as 'all' | 'active' | 'disabled')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          statusFilter === st.id
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (expandedInboundIds.length === filteredInbounds.length) {
                        setExpandedInboundIds([]);
                      } else {
                        setExpandedInboundIds(filteredInbounds.map((i) => i.id));
                      }
                    }}
                    className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {expandedInboundIds.length === filteredInbounds.length
                      ? 'بستن زیرمجموعه‌ها'
                      : 'باز کردن همه کاربران'}
                  </button>
                </div>
              </div>

              {/* Inbounds Data Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <th className="py-3.5 px-4">شناسه و نام این‌باند (Remark)</th>
                        <th className="py-3.5 px-4">پروتکل · شبکه · امنیت</th>
                        <th className="py-3.5 px-4 text-left">پورت</th>
                        <th className="py-3.5 px-4">کاربران</th>
                        <th className="py-3.5 px-4">مصرف ترافیک (آپلود / دانلود / کل)</th>
                        <th className="py-3.5 px-4">اعتبار زمانی</th>
                        <th className="py-3.5 px-4">وضعیت</th>
                        <th className="py-3.5 px-4 text-left">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                      {filteredInbounds.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 px-6 text-center">
                            <div className="max-w-md mx-auto space-y-3">
                              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                هیچ این‌باندی با فیلترهای فعلی یافت نشد
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                می‌توانید فیلترهای جستجو را پاک کنید یا از طریق دکمه زیر، اطلاعات یک پنل ثنایی جدید را به صورت دستی وارد نمایید.
                              </p>
                              <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery('');
                                    setProtocolFilter('all');
                                    setStatusFilter('all');
                                  }}
                                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
                                >
                                  نمایش همه این‌باندها
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProfile(null);
                                    setIsConnectModalOpen(true);
                                  }}
                                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg"
                                >
                                  اتصال دستی پنل ثنایی
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredInbounds.map((inbound) => {
                          const isExpanded = expandedInboundIds.includes(inbound.id);
                          const usedTraffic = (inbound.up || 0) + (inbound.down || 0);
                          const usagePercent =
                            inbound.total > 0
                              ? Math.min(100, Math.round((usedTraffic / inbound.total) * 100))
                              : 0;
                          const expiry = formatExpiryStatus(inbound.expiryTime);

                          return (
                            <React.Fragment key={inbound.id}>
                              {/* Main Inbound Row */}
                              <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <button
                                      type="button"
                                      onClick={() => toggleInboundExpand(inbound.id)}
                                      className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors"
                                      title="مشاهده کاربران زیرمجموعه"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-sky-500" />
                                      ) : (
                                        <ChevronLeft className="w-4 h-4" />
                                      )}
                                    </button>
                                    <div>
                                      <button
                                        type="button"
                                        onClick={() => toggleInboundExpand(inbound.id)}
                                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 text-right flex items-center gap-1.5"
                                      >
                                        <span className="font-mono tabular-nums text-slate-400">
                                          #{inbound.id}
                                        </span>
                                        <span>{inbound.remark}</span>
                                      </button>
                                      <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5" dir="ltr">
                                        {getInboundEndpointHint(inbound)}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Unboxed clean metadata with · separators (Zero-Pill Discipline) */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-1.5 font-mono text-xs uppercase text-slate-800 dark:text-slate-200">
                                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                                      {inbound.protocol}
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                                      ·
                                    </span>
                                    <span>{inbound.network}</span>
                                    <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                                      ·
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400">
                                      {inbound.security}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4 text-left font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                                  {inbound.port}
                                </td>

                                <td className="py-3.5 px-4">
                                  <button
                                    type="button"
                                    onClick={() => toggleInboundExpand(inbound.id)}
                                    className="font-mono tabular-nums text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700"
                                  >
                                    {inbound.clients.length} کاربر
                                  </button>
                                </td>

                                <td className="py-3.5 px-4 min-w-[210px]">
                                  <div className="flex items-center justify-between font-mono tabular-nums text-slate-800 dark:text-slate-200 mb-1" dir="ltr">
                                    <span className="font-semibold">{formatBytes(usedTraffic)}</span>
                                    <span className="text-slate-400">
                                      / {inbound.total > 0 ? formatBytes(inbound.total) : 'نامحدود'}
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-sky-600 dark:bg-sky-500 rounded-full transition-all"
                                      style={{ width: `${inbound.total > 0 ? usagePercent : 25}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400 mt-1" dir="ltr">
                                    <span>↓ {formatBytes(inbound.down)}</span>
                                    <span>↑ {formatBytes(inbound.up)}</span>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  <div className="font-medium text-slate-800 dark:text-slate-200">
                                    {expiry.label}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                                    {expiry.subLabel}
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleInboundStatus(inbound.id)}
                                    className="flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
                                  >
                                    {inbound.enable ? (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span className="text-emerald-700 dark:text-emerald-400">فعال</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                                        <span className="text-red-700 dark:text-red-400">غیرفعال</span>
                                      </>
                                    )}
                                  </button>
                                </td>

                                <td className="py-3.5 px-4 text-left">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setAddClientInbound(inbound)}
                                      className="px-2.5 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-md transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                                      title="افزودن کاربر جدید به این این‌باند"
                                    >
                                      <UserPlus className="w-3.5 h-3.5" />
                                      <span>+ کاربر</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setInspectInbound(inbound)}
                                      className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                      title="مشاهده تنظیمات فنی و کپی دسته‌ای لینک‌ها"
                                    >
                                      <Code2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Clients Sub-Table */}
                              {isExpanded && (
                                <tr className="bg-slate-50/70 dark:bg-slate-950/60">
                                  <td colSpan={8} className="p-0">
                                    <div className="px-6 py-4 border-t border-slate-200/70 dark:border-slate-800/80">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                          کاربران زیرمجموعه این‌باند «{inbound.remark}» ({inbound.clients.length} کاربر)
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setAddClientInbound(inbound)}
                                          className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
                                        >
                                          <UserPlus className="w-3.5 h-3.5" />
                                          افزودن کاربر جدید به این‌باند #{inbound.id}
                                        </button>
                                      </div>

                                      {inbound.clients.length === 0 ? (
                                        <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                                          هیچ کاربری در این این‌باند ثبت نشده است.
                                        </div>
                                      ) : (
                                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
                                          <table className="w-full text-right border-collapse text-xs">
                                            <thead>
                                              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40">
                                                <th className="py-2.5 px-3.5">نام کاربری (Email)</th>
                                                <th className="py-2.5 px-3.5">شناسه (UUID / Password)</th>
                                                <th className="py-2.5 px-3.5">مصرف کاربر / سقف مجاز</th>
                                                <th className="py-2.5 px-3.5">تاریخ انقضا</th>
                                                <th className="py-2.5 px-3.5">وضعیت</th>
                                                <th className="py-2.5 px-3.5 text-left">لینک اتصال و عملیات</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                              {inbound.clients.map((client) => {
                                                const clientUsed = (client.up || 0) + (client.down || 0);
                                                const clientExpiry = formatExpiryStatus(client.expiryTime);
                                                const isOnline = activeProfile.onlineEmails.includes(client.email);
                                                const copyKey = `${inbound.id}-${client.email}`;

                                                return (
                                                  <tr
                                                    key={client.email + client.id}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                                  >
                                                    <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
                                                      <div className="flex items-center gap-2">
                                                        <span>{client.email}</span>
                                                        {isOnline && (
                                                          <span className="text-[11px] font-sans font-normal text-emerald-600 dark:text-emerald-400">
                                                            · آنلاین
                                                          </span>
                                                        )}
                                                      </div>
                                                    </td>

                                                    <td className="py-2.5 px-3.5 font-mono text-slate-500 dark:text-slate-400" dir="ltr">
                                                      <span className="truncate inline-block max-w-[180px] align-bottom">
                                                        {client.id}
                                                      </span>
                                                    </td>

                                                    <td className="py-2.5 px-3.5 font-mono tabular-nums" dir="ltr">
                                                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {formatBytes(clientUsed)}
                                                      </span>
                                                      <span className="text-slate-400">
                                                        {' '}
                                                        / {client.totalGB > 0 ? formatBytes(client.totalGB) : '∞'}
                                                      </span>
                                                    </td>

                                                    <td className="py-2.5 px-3.5">
                                                      <div className="flex items-center gap-1.5">
                                                        {clientExpiry.state === 'expired' && (
                                                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                        )}
                                                        <span
                                                          className={
                                                            clientExpiry.state === 'expired'
                                                              ? 'text-red-600 dark:text-red-400 font-medium'
                                                              : clientExpiry.state === 'warning'
                                                              ? 'text-amber-600 dark:text-amber-400 font-medium'
                                                              : 'text-slate-700 dark:text-slate-300'
                                                          }
                                                        >
                                                          {clientExpiry.label}
                                                        </span>
                                                        <span className="text-[11px] font-mono text-slate-400">
                                                          ({clientExpiry.subLabel})
                                                        </span>
                                                      </div>
                                                    </td>

                                                    <td className="py-2.5 px-3.5">
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          handleToggleClientEnable(inbound.id, client.email)
                                                        }
                                                        className="text-xs font-medium flex items-center gap-1"
                                                      >
                                                        {client.enable ? (
                                                          <>
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                              فعال
                                                            </span>
                                                          </>
                                                        ) : (
                                                          <>
                                                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                                                            <span className="text-red-600 dark:text-red-400">
                                                              مسدود
                                                            </span>
                                                          </>
                                                        )}
                                                      </button>
                                                    </td>

                                                    <td className="py-2.5 px-3.5 text-left">
                                                      <div className="flex items-center justify-end gap-2">
                                                        <button
                                                          type="button"
                                                          onClick={() => handleQuickCopyUri(inbound, client)}
                                                          className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                                                        >
                                                          {copiedId === copyKey ? (
                                                            <>
                                                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                              <span>کپی شد</span>
                                                            </>
                                                          ) : (
                                                            <>
                                                              <Copy className="w-3.5 h-3.5" />
                                                              <span>کپی کانفیگ</span>
                                                            </>
                                                          )}
                                                        </button>

                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            setSelectedClientModal({ inbound, client })
                                                          }
                                                          className="px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                                                        >
                                                          <Link2 className="w-3.5 h-3.5" />
                                                          <span>لینک و اشتراک</span>
                                                        </button>

                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            handleResetClientTraffic(inbound, client)
                                                          }
                                                          className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded transition-colors"
                                                          title="صفر کردن ترافیک مصرفی کاربر"
                                                        >
                                                          <RotateCcw className="w-3.5 h-3.5" />
                                                        </button>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2: MANUAL CONNECTION INLINE WORKSPACE */}
          {activeSection === 'manual-connect' && (
            <section className="max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 lg:p-8 space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  ورود دستی اطلاعات پنل ثنایی (3x-ui / MHSanaei)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  مشخصات ورود به پنل ثنایی خود را در فرم زیر وارد کنید تا سرور به صورت مستقیم لاگین کرده و تمام این‌باندها، پورت‌ها و کاربران موجود در پنل شما را دریافت و نمایش دهد.
                </p>
              </div>

              <form onSubmit={handleInlineManualConnect} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      نام دلخواه پنل / سرور
                    </label>
                    <input
                      type="text"
                      value={inlineName}
                      onChange={(e) => setInlineName(e.target.value)}
                      placeholder="مثلاً: سرور فنلاند پنل ثنایی"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      مسیر مخفی پنل (WebBasePath - در صورت وجود)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={inlineBasePath}
                      onChange={(e) => setInlineBasePath(e.target.value)}
                      placeholder="/panel-secret/"
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    آدرس کامل پنل ثنایی (IP یا دامنه به همراه پورت) *
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    required
                    value={inlineUrl}
                    onChange={(e) => setInlineUrl(e.target.value)}
                    placeholder="https://185.141.x.x:2053/mysecretpath"
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      نام کاربری پنل ثنایی (Username) *
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={inlineUser}
                      onChange={(e) => setInlineUser(e.target.value)}
                      placeholder="admin"
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      رمز عبور پنل ثنایی (Password) *
                    </label>
                    <div className="relative">
                      <input
                        type={inlineShowPass ? 'text' : 'password'}
                        dir="ltr"
                        value={inlinePass}
                        onChange={(e) => setInlinePass(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => setInlineShowPass(!inlineShowPass)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {inlineShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    کوکی نشست دستی (اختیاری - فقط در صورتی که بخواهید بدون رمز و با کوکی `3x-ui` متصل شوید)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={inlineCookie}
                    onChange={(e) => setInlineCookie(e.target.value)}
                    placeholder="3x-ui=..."
                    className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={inlineAllowInsecure}
                      onChange={(e) => setInlineAllowInsecure(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      نادیده گرفتن خطای گواهی SSL خودامضا (Self-Signed Certificate)
                    </span>
                  </label>
                </div>

                {inlineError && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg text-xs text-red-700 dark:text-red-300 leading-relaxed">
                    {inlineError}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(null);
                      setIsConnectModalOpen(true);
                    }}
                    className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    آیا می‌خواهید به جای اتصال مستقیم، فایل JSON این‌باندهای پنل را وارد کنید؟ اینجا کلیک کنید
                  </button>

                  <button
                    type="submit"
                    disabled={inlineLoading}
                    className="px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    {inlineLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        در حال اتصال به پنل ثنایی...
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        اتصال به پنل ثنایی و نمایش این‌باندها
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* SECTION 3: ALL CLIENTS DIRECTORY */}
          {activeSection === 'clients' && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجوی کاربر بر اساس ایمیل، UUID یا نام این‌باند..."
                    className="w-full pr-10 pl-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  نمایش <span className="font-mono font-bold text-slate-900 dark:text-white">{allClientsFlattened.length}</span> کاربر در کل این‌باندها
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 font-semibold text-slate-500 dark:text-slate-400">
                        <th className="py-3.5 px-4">نام کاربری (Email)</th>
                        <th className="py-3.5 px-4">این‌باند مربوطه</th>
                        <th className="py-3.5 px-4">پروتکل · پورت</th>
                        <th className="py-3.5 px-4">مصرف / حجم کل</th>
                        <th className="py-3.5 px-4">اعتبار زمانی</th>
                        <th className="py-3.5 px-4">وضعیت</th>
                        <th className="py-3.5 px-4 text-left">دریافت کانفیگ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {allClientsFlattened.map(({ inbound, client }) => {
                        const used = (client.up || 0) + (client.down || 0);
                        const exp = formatExpiryStatus(client.expiryTime);
                        return (
                          <tr
                            key={`${inbound.id}-${client.email}`}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                              {client.email}
                            </td>
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                              #{inbound.id} · {inbound.remark}
                            </td>
                            <td className="py-3 px-4 font-mono uppercase text-slate-600 dark:text-slate-400">
                              {inbound.protocol} · {inbound.port}
                            </td>
                            <td className="py-3 px-4 font-mono tabular-nums" dir="ltr">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {formatBytes(used)}
                              </span>
                              <span className="text-slate-400">
                                {' '}
                                / {client.totalGB > 0 ? formatBytes(client.totalGB) : '∞'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {exp.label} <span className="text-slate-400 font-mono">({exp.subLabel})</span>
                            </td>
                            <td className="py-3 px-4">
                              {client.enable ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">فعال</span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400 font-medium">غیرفعال</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-left">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleQuickCopyUri(inbound, client)}
                                  className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                >
                                  کپی لینک
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedClientModal({ inbound, client })}
                                  className="px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded transition-colors"
                                >
                                  جزئیات
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 4: SAVED SERVERS MANAGER */}
          {activeSection === 'servers' && (
            <section className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    لیست پنل‌های ثنایی ذخیره شده
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(null);
                      setIsConnectModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
                  >
                    + افزودن پنل جدید
                  </button>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {profiles.map((prof) => (
                    <div
                      key={prof.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {prof.name}
                          </span>
                          {prof.id === activeProfile.id && (
                            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                              · پنل فعال فعلی
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono" dir="ltr">
                          <span>{prof.panelUrl}</span>
                          <span>·</span>
                          <span>User: {prof.username}</span>
                          <span>·</span>
                          <span>{prof.inbounds.length} Inbounds</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {prof.id !== activeProfile.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveProfileId(prof.id);
                              setActiveSection('inbounds');
                            }}
                            className="px-3.5 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 rounded-lg hover:bg-sky-100 transition-colors"
                          >
                            انتخاب و مشاهده این‌باندها
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfile(prof);
                            setIsConnectModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          ویرایش اتصال
                        </button>
                        {profiles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProfile(prof.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                            title="حذف پنل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SECTION 5: MOBILE APP BRIDGE (USERS, SIMULATOR, PROMPT & API DOCS) */}
          {activeSection === 'bridge' && (
            <BridgeManagementView onRefreshPanel={handleRefreshActivePanel} />
          )}
        </main>
      </div>

      {/* Modals */}
      <PanelConnectionModal
        isOpen={isConnectModalOpen}
        onClose={() => {
          setIsConnectModalOpen(false);
          setEditingProfile(null);
        }}
        onSaveProfile={handleSaveProfile}
        initialProfile={editingProfile}
      />

      <AddClientModal
        isOpen={Boolean(addClientInbound)}
        onClose={() => setAddClientInbound(null)}
        inbound={addClientInbound}
        activeProfile={activeProfile}
        onClientAdded={(updatedInbounds, msg) => {
          setProfiles((prev) =>
            prev.map((p) => (p.id === activeProfile.id ? { ...p, inbounds: updatedInbounds } : p))
          );
          if (addClientInbound && !expandedInboundIds.includes(addClientInbound.id)) {
            setExpandedInboundIds((prev) => [...prev, addClientInbound.id]);
          }
          showNotice(msg);
        }}
      />

      <ClientConfigModal
        isOpen={Boolean(selectedClientModal)}
        onClose={() => setSelectedClientModal(null)}
        inbound={selectedClientModal?.inbound || null}
        client={selectedClientModal?.client || null}
        profile={activeProfile}
      />

      <InboundDetailsModal
        isOpen={Boolean(inspectInbound)}
        onClose={() => setInspectInbound(null)}
        inbound={inspectInbound}
        profile={activeProfile}
      />
    </div>
  );
}
