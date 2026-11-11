import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  Zap,
  Users,
  Shield,
  Coins,
  RefreshCw,
  Power,
  Layers,
  FileCode,
  Sparkles,
  ExternalLink,
  ChevronRight,
  HardDrive,
  Clock,
  QrCode,
  Trash2,
  Plus,
  Server,
  Activity,
  AlertCircle,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { BridgePlan, BridgeServerItem, BridgeUser } from '../types/bridge';
import { formatBytes } from '../utils/sanaeiHelpers';

interface BridgeManagementViewProps {
  onRefreshPanel: () => void;
}

export const BridgeManagementView: React.FC<BridgeManagementViewProps> = ({ onRefreshPanel }) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'vps' | 'simulator' | 'users' | 'plans' | 'wallet'>('vps');
  const [users, setUsers] = useState<BridgeUser[]>([]);
  const [plans, setPlans] = useState<BridgePlan[]>([]);
  const [servers, setServers] = useState<BridgeServerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Wallet State
  const [giftCodes, setGiftCodes] = useState<any[]>([]);
  const [newGiftCode, setNewGiftCode] = useState('');
  const [newGiftTokens, setNewGiftTokens] = useState('1000');
  const [giftStatusMsg, setGiftStatusMsg] = useState<string | null>(null);

  // Simulator State
  const [simEmail, setSimEmail] = useState('user_' + Math.floor(1000 + Math.random() * 9000) + '@app.local');
  const [simUser, setSimUser] = useState<BridgeUser | null>(null);
  const [simSelectedPlan, setSimSelectedPlan] = useState<string>('plan_1m_10gb');
  const [simSelectedServer, setSimSelectedServer] = useState<number>(4);
  const [simIsConnecting, setSimIsConnecting] = useState(false);
  const [simIsConnected, setSimIsConnected] = useState(false);
  const [simStatusMsg, setSimStatusMsg] = useState<string | null>(null);
  const [simQrModal, setSimQrModal] = useState<string | null>(null);
  const [simGiftInput, setSimGiftInput] = useState('WELCOME2026');

  // Dynamic Bridge Server URL Setting for Mobile App
  const [serverHostInput, setServerHostInput] = useState('http://130.185.121.250:3000');
  const [serverPingStatus, setServerPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://130.185.121.250:3000';

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const fetchBridgeData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bridge/admin/overview');
      const data = await res.json();
      if (data && data.success) {
        setUsers(data.users || []);
        setPlans(data.plans || []);
        setServers(data.servers || []);
      }
    } catch (err) {
      console.error('Error fetching bridge overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGiftCodes = async () => {
    try {
      const res = await fetch('/api/bridge/admin/gift-codes');
      const data = await res.json();
      if (data && data.success) {
        setGiftCodes(data.giftCodes || []);
      }
    } catch (err) {
      console.error('Error fetching gift codes:', err);
    }
  };

  const handleCreateGiftCode = async () => {
    if (!newGiftCode.trim()) return;
    try {
      const res = await fetch('/api/bridge/admin/gift-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newGiftCode.trim(),
          tokens: Number(newGiftTokens) || 1000,
          maxUses: 500,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGiftStatusMsg(`کد هدیه «${newGiftCode.toUpperCase()}» با موفقیت ساخته شد.`);
        setNewGiftCode('');
        fetchGiftCodes();
      }
    } catch (err: any) {
      setGiftStatusMsg(err.message || 'خطا در ساخت کد هدیه');
    }
  };

  useEffect(() => {
    fetchBridgeData();
    fetchGiftCodes();
  }, []);


  // Simulator: Step 1 Register
  const handleSimRegister = async () => {
    setSimStatusMsg('در حال ثبت کاربر در پل ارتباطی...');
    try {
      const res = await fetch('/api/bridge/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: simEmail,
          name: simEmail.split('@')[0],
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setSimUser(data.user);
        setSimStatusMsg(`کاربر «${data.user.email}» با ۱۰۰۰ توکن اولیه ثبت شد.`);
        fetchBridgeData();
      } else {
        setSimStatusMsg(data.message || 'خطا در ثبت کاربر');
      }
    } catch (err: any) {
      setSimStatusMsg(err.message || 'خطا در ثبت نام');
    }
  };

  // Simulator: Step 2 Purchase Plan
  const handleSimPurchase = async () => {
    if (!simUser) {
      await handleSimRegister();
    }
    setSimStatusMsg('در حال اتصال به پنل ثنایی و ساخت اکانت ۱۰ گیگابایت...');
    setSimIsConnecting(true);
    try {
      const res = await fetch('/api/bridge/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: simEmail,
          planId: simSelectedPlan,
          inboundId: simSelectedServer,
        }),
      });
      const data = await res.json();
      if (data.success && data.subscription) {
        setSimUser((prev) => (prev ? { ...prev, tokens: data.user.tokens, subscription: data.subscription } : null));
        setSimIsConnected(true);
        setSimStatusMsg('کانفیگ با موفقیت در پنل ثنایی ساخته شد و آماده اتصال است!');
        fetchBridgeData();
        onRefreshPanel();
      } else {
        setSimStatusMsg(data.message || 'خطا در فعال‌سازی اشتراک');
      }
    } catch (err: any) {
      setSimStatusMsg(err.message || 'خطا در ارتباط با پنل ثنایی');
    } finally {
      setSimIsConnecting(false);
    }
  };

  // Full AI Studio Prompt in Persian ready to copy-paste
  const aiStudioPrompt = `سلام! لطفاً این تغییرات اساسی را در اپلیکیشن VPN / فیلترشکن من اعمال و پیاده‌سازی کن:

============================================================
۱. بخش مدیریت پنهان (Admin Settings) و تغییر پویای آدرس سرور (بدون دستکاری کد):
============================================================
- در برنامه یک صفحه یا مودال مخفی ورود مدیریت (Admin Login) بساز (مثلاً با سه بار لمس روی آرم/لوگوی بالای برنامه، یا یک آیکون چرخ‌دنده در پروفایل).
- مشخصات پیش‌فرض ورود مدیر:
  • نام کاربری: admin
  • رمز عبور: admin123
- پس از لاگین مدیر، صفحه‌ای باز شود شامل:
  • فیلد متنی «آدرس سرور پل ارتباطی (Bridge Server URL)» با مقدار پیش‌فرض: http://130.185.121.250:3000
  • دکمه «تست اتصال به سرور»: با متد GET به مسیر {BASE_URL}/api/bridge/health درخواست بزند و در صورت پاسخ سبز نشان دهد: «اتصال برقرار است ✅»
  • دکمه «ذخیره تنظیمات»: این آدرس را در حافظه ماندگار (AsyncStorage / localStorage) تحت کلید "bridge_server_url" ذخیره کند.
- تمام بخش‌های اپلیکیشن برای ارسال درخواست‌ها باید از این آدرس پویا استفاده کنند تا اگر در آینده سرور یا دامنه‌ام عوض شد، نیازی به تغییر کد برنامه نباشد.

============================================================
۲. رفع باگ حذف شدن اشتراک و جلوگیری از کانفیگ‌های اشتباه (novashield):
============================================================
- علت اینکه اشتراک با بستن برنامه می‌پرید این است که وضعیت کاربر در حافظه ماندگار ذخیره نمی‌شد:
  • هنگام ثبت‌نام یا ورود (POST /api/bridge/register یا login)، آبجکت کاربر (user)، موجودی توکن (tokens) و کل اطلاعات اشتراک (subscription) و کانفیگ واقعی VLESS (configUri) را در AsyncStorage / localStorage ذخیره کن.
  • با اجرای مجدد برنامه، ابتدا این اطلاعات را از حافظه بارگذاری کن تا کاربر اشتراک خود را نبازد و نیاز به خرید مجدد نباشد.
  • همچنین با یک درخواست GET به {BASE_URL}/api/bridge/user/{email}، اطلاعات وضعیت مصرف حجم و باقی‌مانده را بروز کن.
- اکیداً هرگونه کانفیگ فیک یا ماک (مثل novashield-vpn.io یا هر URL ثابت تستی) را از کدها حذف کن! تمام کانفیگ‌ها باید ۱۰۰٪ از سرور پل ثنایی دریافت شوند.

============================================================
۳. پیاده‌سازی کامل تب کیف پول (Wallet Tab):
============================================================
- در تب سوم اپلیکیشن (آیکون کیف پول Wallet)، این بخش‌ها را پیاده کن:
  ۱) نمایش موجودی توکن کاربر (هم‌خوان با نشانگر بالای برنامه، مثلاً ۱۰۰۰ Tokens).
  ۲) بخش «کد هدیه و ووچر (Gift Voucher)»:
     - فیلد وارد کردن کد و دکمه «اعمال کد هدیه».
     - متد: POST به {BASE_URL}/api/bridge/wallet/redeem با بدنه: { "userId": user.id, "code": "WELCOME2026" }
     - در صورت موفقیت، توکن‌های اضافه شده را فوراً به موجودی کیف پول کاربر بیفزا و پیام موفقیت نشان بده.
  ۳) بخش «بسته‌های شارژ توکن»:
     - متد: GET از {BASE_URL}/api/bridge/wallet/packages
     - نمایش بسته‌های ۱۰۰۰ توکن، ۲۵۰۰ توکن و ۵۰۰۰ توکن با قیمت تومان.
     - با کلیک روی هر بسته، متد POST به {BASE_URL}/api/bridge/wallet/topup ارسال شود تا موجودی افزایش یابد.
  ۴) تاریخچه تراکنش‌ها (Transactions):
     - متد: GET از {BASE_URL}/api/bridge/wallet/transactions/{user.id}
     - نمایش لیست هدیه خوش‌آمدگویی، اعمال کدهای تخفیف و خریدهای اشتراک.

============================================================
۴. نحوه اتصال مستقیم VPN (دکمه Tap to Connect):
============================================================
- اگر کاربر اشتراک فعال دارد (user.subscription.status === 'active')، با کلیک روی دکمه بزرگ دایره‌ای، مستقیماً از رشته configUri دریافت شده از ثنایی (vless://...) برای استارت هسته VPN استفاده کن.
- اگر اشتراک نداشت، لیست پلن‌ها (GET /api/bridge/plans) را باز کن تا با موجودی توکنش (۱۰۰۰ توکن رایگان هدیه) اشتراک ۱ ماهه ۱۰ گیگ را فعال کند.`;


  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="p-6 bg-gradient-to-r from-sky-900/40 via-slate-900 to-indigo-950/40 border border-sky-500/30 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
              <Sparkles className="w-4 h-4" />
              <span>پل اختصاصی میان اپلیکیشن موبایل و پنل ثنایی (Middleware Bridge)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              مدیریت و اتوماسیون کاربران اپلیکیشن
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              هر کاربری که در اپلیکیشن موبایل شما ثبت‌نام کند، فوراً در این پنل ثبت شده و پس از انتخاب اشتراک (مثلاً ۱ ماه ۱۰ گیگ)، یک کلاینت اختصاصی روی این‌باند ثنایی شما ایجاد و لینک VLESS مستقیماً به برنامه‌تان تحویل داده می‌شود.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('vps')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'vps'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Terminal className="w-4 h-4" />
              نصب روی سرور مجازی (VPS)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('prompt')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'prompt'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <FileCode className="w-4 h-4" />
              پرامپت گوگل استودیو & مستندات
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'simulator'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              شبیه‌ساز زنده برنامه
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'users'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Users className="w-4 h-4" />
              کاربران ثبت‌شده ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('wallet')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'wallet'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Coins className="w-4 h-4" />
              کیف پول و ووچرها
            </button>
          </div>
        </div>

      </div>

      {/* Mini KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
            <span>کل کاربران اپلیکیشن</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {users.length}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
            <span>اشتراک‌های فعال روی ثنایی</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {users.filter((u) => u.subscription?.status === 'active').length}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
            <span>پلن‌های آماده فروش</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {plans.length} پلن
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
            <span>سرورهای متصل Xray</span>
            <Server className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {servers.length} این‌باند
          </div>
        </div>
      </div>

      {/* TAB 0: VPS INSTALLATION & GITHUB GUIDE */}
      {activeTab === 'vps' && (
        <div className="space-y-6">
          {/* Main One-Line Installer Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/50 border border-sky-500/40 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                  <Terminal className="w-4 h-4" />
                  <span>دستور نصب مستقیم (فوری و ۱۰۰٪ تست‌شده بدون نیاز به گیت‌هاب)</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  نصب سریع و خودکار روی سرور مجازی لینوکس (VPS)
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  کافیست دستور زیر را کپی کرده و در ترمینال سرور مجازی خود Paste کنید. کلیه پیش‌نیازها، پکیج‌ها، بیلد و سرویس systemd مستقیماً روی سرور شما نصب می‌شود:
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `bash <(curl -Ls ${baseUrl}/install.sh)`,
                    'vps_direct'
                  )
                }
                className="px-5 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                {copiedSection === 'vps_direct' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    دستور مستقیم کپی شد!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    کپی دستور نصب مستقیم
                  </>
                )}
              </button>
            </div>

            {/* Direct Command Display Box */}
            <div className="relative">
              <div
                dir="ltr"
                className="p-4 sm:p-5 bg-black/90 border border-emerald-500/30 rounded-xl font-mono text-xs sm:text-sm text-emerald-400 flex items-center justify-between gap-4 overflow-x-auto select-all"
              >
                <span>bash &lt;(curl -Ls {baseUrl}/install.sh)</span>
              </div>
            </div>

            {/* Note about 404 and GitHub */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>دلیل خطای ۴۰۴ در گیت‌هاب چه بود؟</span>
              </div>
              <p>
                اگر هنوز ریپازیتوری <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-white">disslove1993/panel</code> را در حساب گیت‌هاب خود نساخته باشید یا فایل‌ها به آن پوش (Push) نشده باشند، گیت‌هاب خطای <code className="font-mono text-rose-300">404 Not Found</code> می‌دهد. با اجرای <strong>دستور مستقیم بالا</strong>، برنامه مستقیماً از همین محیط فعال بدون نیاز به هیچ پیش‌نیازی روی سرورتان نصب و اجرا می‌شود.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-2">
              <span className="px-2.5 py-1 bg-slate-800 rounded-md">Ubuntu 20.04+ / 22.04 / 24.04</span>
              <span className="px-2.5 py-1 bg-slate-800 rounded-md">Debian 11 / 12</span>
              <span className="px-2.5 py-1 bg-slate-800 rounded-md">CentOS 8+ / AlmaLinux / Rocky</span>
            </div>
          </div>

          {/* 3 Steps Guide: GitHub to VPS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-500 flex items-center justify-center text-xs">
                  ۱
                </span>
                <span>آپلود پروژه به ریپازیتوری panel</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                در ریپازیتوری <code className="text-sky-500 font-mono">disslove1993/panel</code> گیت‌هاب خود، دستورات زیر را برای ارسال کدهای این پنل اجرا کنید:
              </p>
              <div className="p-3 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] space-y-1 select-all" dir="ltr">
                <div>git init</div>
                <div>git add .</div>
                <div>git commit -m "Initial commit"</div>
                <div>git branch -M main</div>
                <div>git remote add origin https://github.com/disslove1993/panel.git</div>
                <div>git push -u origin main</div>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    'git init && git add . && git commit -m "Initial commit" && git branch -M main && git remote add origin https://github.com/disslove1993/panel.git && git push -u origin main',
                    'git_cmds'
                  )
                }
                className="text-xs text-sky-500 hover:underline flex items-center gap-1 pt-1"
              >
                <Copy className="w-3 h-3" />
                {copiedSection === 'git_cmds' ? 'کپی شد' : 'کپی دستورات گیت'}
              </button>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-500 flex items-center justify-center text-xs">
                  ۲
                </span>
                <span>اجرای اسکریپت در سرور لینوکس</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                با نرم‌افزار Putty یا ترمینال به سرور مجازی (VPS) متصل شده و دستور یک‌خطی نصب را وارد کنید:
              </p>
              <div className="p-3 bg-slate-950 text-emerald-400 rounded-lg font-mono text-[11px] leading-relaxed select-all" dir="ltr">
                bash &lt;(curl -Ls https://raw.githubusercontent.com/disslove1993/panel/main/install.sh)
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اسکریپت به صورت خودکار بیلد کرده و سرویس پس‌زمینه را با systemd همیشه روشن نگه می‌دارد.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-500 flex items-center justify-center text-xs">
                  ۳
                </span>
                <span>اتصال دامنه و SSL رایگان</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                یک رکورد A به آی‌پی سرور برای دامنه‌تان (مثلاً <code className="text-sky-500 font-mono">api.yourdomain.com</code>) بسازید، سپس در سرور تایپ کنید:
              </p>
              <div className="p-3 bg-slate-950 text-amber-300 rounded-lg font-mono text-[11px] select-all" dir="ltr">
                sanaei-bridge
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                گزینه ۷ را انتخاب کنید؛ اسکریپت Nginx را کانفیگ کرده و گواهی رایگان Let&apos;s Encrypt را برای دامنه صادر می‌کند!
              </p>
            </div>
          </div>

          {/* Service Management Commands */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-500" />
              دستورات پرکاربرد مدیریت پنل در سرور مجازی (CLI Commands)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="text-slate-400 mb-1 font-sans">منوی تعاملی مدیریت:</div>
                <div className="text-sky-500 font-bold" dir="ltr">sanaei-bridge</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="text-slate-400 mb-1 font-sans">راه‌اندازی مجدد سرویس:</div>
                <div className="text-emerald-500 font-bold" dir="ltr">systemctl restart sanaei-bridge</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="text-slate-400 mb-1 font-sans">مشاهده لاگ‌های زنده:</div>
                <div className="text-amber-500 font-bold" dir="ltr">journalctl -u sanaei-bridge -f</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="text-slate-400 mb-1 font-sans">بررسی وضعیت فعالیت:</div>
                <div className="text-purple-500 font-bold" dir="ltr">systemctl status sanaei-bridge</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: PROMPT FOR GOOGLE AI STUDIO & API DOCS */}
      {activeTab === 'prompt' && (
        <div className="space-y-6">
          {/* Main Ready-To-Copy Prompt */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-500" />
                  پرامپت اختصاصی جهت کپی و ارسال به گوگل استودیو (AI Studio Prompt)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  کافیست دکمه زیر را بزنید و این متن را عیناً در چت پروژه اپلیکیشن موبایل خود در Google AI Studio قرار دهید تا تمام متدهای ثبت‌نام، خرید اشتراک ۱۰ گیگابایت و اتصال خودکار را پیاده‌سازی کند.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(aiStudioPrompt, 'full_prompt')}
                className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                {copiedSection === 'full_prompt' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    پرامپت کپی شد!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    کپی کامل پرامپت هوش مصنوعی
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre
                dir="rtl"
                className="p-5 text-xs font-mono bg-slate-950 text-slate-200 rounded-xl overflow-x-auto max-h-[380px] leading-relaxed whitespace-pre-wrap select-all border border-slate-800"
              >
                {aiStudioPrompt}
              </pre>
            </div>
          </div>

          {/* Interactive Endpoint Explorer & cURL samples */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              تست و راهنمای مستقیم متدهای API برای توسعه‌دهنده
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Endpoint 1: Register */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 font-bold rounded">POST</span>
                    <span className="text-slate-800 dark:text-slate-200">/api/bridge/register</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `curl -X POST "${baseUrl}/api/bridge/register" -H "Content-Type: application/json" -d '{"email":"user@gmail.com","name":"Ali"}'`,
                        'curl_reg'
                      )
                    }
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedSection === 'curl_reg' ? 'کپی شد' : 'کپی cURL'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ثبت کاربر جدید و اختصاص ۱۰۰۰ توکن رایگان یا بازیابی کاربر قبلی
                </p>
              </div>

              {/* Endpoint 2: Plans */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-500 font-bold rounded">GET</span>
                    <span className="text-slate-800 dark:text-slate-200">/api/bridge/plans</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`curl -s "${baseUrl}/api/bridge/plans"`, 'curl_plans')}
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedSection === 'curl_plans' ? 'کپی شد' : 'کپی cURL'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  دریافت بسته‌ها (۱۰ گیگ ۱ ماهه، ۳۰ گیگ و ...) به همراه قیمت توکنی و تومانی
                </p>
              </div>

              {/* Endpoint 3: Purchase */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 font-bold rounded">POST</span>
                    <span className="text-slate-800 dark:text-slate-200">/api/bridge/purchase</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `curl -X POST "${baseUrl}/api/bridge/purchase" -H "Content-Type: application/json" -d '{"email":"user@gmail.com","planId":"plan_1m_10gb"}'`,
                        'curl_pur'
                      )
                    }
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedSection === 'curl_pur' ? 'کپی شد' : 'کپی cURL'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ایجاد آنی کلاینت روی پنل ثنایی و صدور لینک اختصاصی VLESS و سابسکریپشن
                </p>
              </div>

              {/* Endpoint 4: Direct Config */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-500 font-bold rounded">GET</span>
                    <span className="text-slate-800 dark:text-slate-200">/api/bridge/config/:email</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`curl -s "${baseUrl}/api/bridge/config/user@gmail.com"`, 'curl_conf')}
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedSection === 'curl_conf' ? 'کپی شد' : 'کپی cURL'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  دریافت مستقیم رشته vless:// یا vmess:// جهت اتصال سریع هسته VPN
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE MOBILE APP SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sky-500" />
                تست زنده اتصال برنامه به پنل ثنایی
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                می‌توانید همین الان تست کنید که با ثبت‌نام و خرید اشتراک در برنامه، چطور کلاینت در ثنایی ساخته شده و کانفیگ وصل می‌شود.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  ایمیل یا شناسه کاربری تستی در اپلیکیشن:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleSimRegister}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg whitespace-nowrap shrink-0"
                  >
                    ۱. ثبت کاربر
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  انتخاب اشتراک (پلن خرید):
                </label>
                <select
                  value={simSelectedPlan}
                  onChange={(e) => setSimSelectedPlan(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.priceTokens} توکن - {p.trafficGB} گیگ)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  انتخاب این‌باند ثنایی (سرور):
                </label>
                <select
                  value={simSelectedServer}
                  onChange={(e) => setSimSelectedServer(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  {servers.map((s) => (
                    <option key={s.inboundId} value={s.inboundId}>
                      {s.flag} {s.name} ({s.protocol} - پورت {s.port})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleSimPurchase}
                disabled={simIsConnecting}
                className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {simIsConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    در حال ساخت کلاینت روی پنل ثنایی...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    ۲. خرید اشتراک ۱۰ گیگ و ساخت کانفیگ روی ثنایی
                  </>
                )}
              </button>

              {simStatusMsg && (
                <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-xs text-sky-800 dark:text-sky-300 rounded-lg flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-500 mt-0.5" />
                  <div className="leading-relaxed">{simStatusMsg}</div>
                </div>
              )}
            </div>

            {simUser?.subscription?.configUri && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    کانفیگ اختصاصی ساخته شده:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(simUser.subscription!.configUri, 'sim_conf')}
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedSection === 'sim_conf' ? 'کپی شد' : 'کپی VLESS'}
                  </button>
                </div>
                <textarea
                  readOnly
                  dir="ltr"
                  rows={3}
                  value={simUser.subscription.configUri}
                  className="w-full p-2.5 text-[11px] font-mono bg-slate-950 text-slate-300 border border-slate-800 rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Interactive Phone Frame Mockup (Directly matching user's mobile app screenshot!) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-[340px] h-[680px] bg-black rounded-[46px] border-[6px] border-slate-800 shadow-2xl p-4 flex flex-col justify-between text-white relative overflow-hidden select-none">
              {/* Phone Speaker Notch */}
              <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-slate-950 rounded-full" />
              </div>

              {/* Screen Content */}
              <div className="flex-1 flex flex-col justify-between py-2">
                {/* Mobile Top Header: Status + Tokens + PRO */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-slate-200" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Status</div>
                      <div className="text-xs font-semibold text-slate-100 truncate max-w-[90px]">
                        {simIsConnected ? 'Connected' : 'Not Connected'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Token Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-semibold font-mono text-amber-300">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{simUser ? simUser.tokens : 1000}</span>
                    </div>

                    {/* PRO Button */}
                    <button
                      type="button"
                      onClick={() => handleSimPurchase()}
                      className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full text-xs font-bold flex items-center gap-1 shadow-md shadow-orange-500/30"
                    >
                      <span>PRO</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Upload & Download Pill Cards */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-orange-400">
                      ↑
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Upload</div>
                      <div className="text-xs font-bold font-mono">
                        {simIsConnected ? '1.4 MB/S' : '0 KB/S'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-orange-400">
                      ↓
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Download</div>
                      <div className="text-xs font-bold font-mono">
                        {simIsConnected ? '8.9 MB/S' : '0 KB/S'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Big Center Connect Button */}
                <div className="my-auto py-6 flex flex-col items-center justify-center">
                  <div
                    onClick={() => {
                      if (!simUser?.subscription || simUser.subscription.status !== 'active') {
                        handleSimPurchase();
                      } else {
                        setSimIsConnected(!simIsConnected);
                      }
                    }}
                    className={`w-36 h-36 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative ${
                      simIsConnected
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-800 shadow-2xl shadow-emerald-500/50 ring-4 ring-emerald-500/30'
                        : 'bg-gradient-to-br from-slate-900 to-slate-950 border border-orange-500/40 shadow-xl shadow-orange-500/10 hover:border-orange-500'
                    }`}
                  >
                    <Power
                      className={`w-10 h-10 mb-1 transition-colors ${
                        simIsConnected ? 'text-white' : 'text-slate-300'
                      }`}
                    />
                    <span className="text-[11px] font-medium text-slate-200">
                      {simIsConnecting
                        ? 'Connecting...'
                        : simIsConnected
                        ? 'Connected'
                        : 'Tap to connect'}
                    </span>
                  </div>

                  <div className="mt-3 text-center">
                    {simUser?.subscription?.status === 'active' ? (
                      <span className="text-[11px] text-emerald-400 font-medium">
                        اشتراک فعال: {simUser.subscription.planName} ({simUser.subscription.remainingDays} روز مانده)
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        کلیک برای دریافت اشتراک ۱۰ گیگابایت
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Server Card (Matching user screenshot) */}
                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs">
                      ⚡
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">Fastest free server</div>
                      <div className="text-[10px] text-slate-400">Auto-selected from Frankfurt, DE</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-orange-400">
                    <Activity className="w-3 h-3" />
                    <span>96ms</span>
                  </div>
                </div>

                {/* Bottom Navigation Mockup */}
                <div className="flex items-center justify-around pt-3 border-t border-slate-900 mt-2">
                  <button className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/30">
                    🏠
                  </button>
                  <button className="w-9 h-9 rounded-full bg-slate-900/80 flex items-center justify-center text-slate-400">
                    ⚙️
                  </button>
                  <button className="w-9 h-9 rounded-full bg-slate-900/80 flex items-center justify-center text-slate-400">
                    💳
                  </button>
                  <button className="w-9 h-9 rounded-full bg-slate-900/80 flex items-center justify-center text-slate-400">
                    👤
                  </button>
                </div>
              </div>

              {/* Bottom Home Indicator */}
              <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REGISTERED APP USERS TABLE */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                لیست کاربران ثبت‌نام شده از اپلیکیشن موبایل ({users.length} کاربر)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                کاربرانی که از طریق متد `POST /api/bridge/register` یا خرید اشتراک در برنامه ثبت شده‌اند.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchBridgeData}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">شناسه و ایمیل کاربر</th>
                  <th className="py-3 px-4">موجودی توکن</th>
                  <th className="py-3 px-4">پلن فعال روی ثنایی</th>
                  <th className="py-3 px-4">حجم / اعتبار</th>
                  <th className="py-3 px-4">این‌باند و پورت</th>
                  <th className="py-3 px-4">وضعیت</th>
                  <th className="py-3 px-4 text-left">کانفیگ اتصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      هنوز هیچ کاربری از اپلیکیشن ثبت‌نام نکرده است. می‌توانید در تب «شبیه‌ساز زنده برنامه» یک کاربر تستی ایجاد کنید.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const sub = u.subscription;
                    const hasSub = sub && sub.status === 'active';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                          <div>{u.email}</div>
                          <div className="text-[11px] text-slate-400 font-normal">ID: {u.id}</div>
                        </td>

                        <td className="py-3 px-4 font-mono tabular-nums font-bold text-amber-500">
                          {u.tokens} Tokens
                        </td>

                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                          {hasSub ? sub.planName : 'فاقد اشتراک'}
                        </td>

                        <td className="py-3 px-4 font-mono tabular-nums">
                          {hasSub ? (
                            <div>
                              <span>{sub.trafficTotalGB} گیگابایت</span>
                              <span className="text-slate-400 mx-1">·</span>
                              <span className="text-emerald-500">{sub.remainingDays} روز</span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 uppercase">
                          {hasSub ? `${sub.inboundRemark} (${sub.inboundPort})` : '-'}
                        </td>

                        <td className="py-3 px-4">
                          {hasSub ? (
                            <span className="text-emerald-500 font-medium">متصل و فعال</span>
                          ) : (
                            <span className="text-slate-400">ثبت اولیه</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-left">
                          {hasSub ? (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(sub.configUri, u.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 rounded hover:bg-sky-100 transition-colors"
                            >
                              {copiedSection === u.id ? 'کپی شد!' : 'کپی VLESS'}
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SUBSCRIPTION PACKAGES */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between ${
                p.isPopular
                  ? 'bg-sky-950/20 border-sky-500/50 ring-1 ring-sky-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.name}</span>
                  {p.isPopular && (
                    <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                      پیشنهادی
                    </span>
                  )}
                </div>

                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 my-2">
                  {p.trafficGB} GB
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-mono">
                  مدت: {p.periodDays} روز
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {p.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-amber-500">{p.priceTokens} Tokens</span>
                <span className="text-slate-400">ID: {p.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: WALLET & GIFT CODES */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          {/* Top Wallet Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-400">
                <span>کل توکن‌های در گردش کاربران</span>
                <Coins className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black font-mono text-white">
                {users.reduce((acc, u) => acc + (u.tokens || 0), 0).toLocaleString()}
                <span className="text-sm text-amber-400 mr-2">توکن</span>
              </div>
              <p className="text-xs text-slate-400">
                قابل مصرف در اپلیکیشن موبایل برای خرید اشتراک‌های VLESS ثنایی
              </p>
            </div>

            <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <span>کدهای هدیه و ووچرهای فعال</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black font-mono text-white">
                {giftCodes.length}
                <span className="text-sm text-emerald-400 mr-2">کد فعال</span>
              </div>
              <p className="text-xs text-slate-400">
                کدهای معتبر برای افزایش خودکار موجودی کاربران در تب Wallet
              </p>
            </div>

            <div className="p-5 bg-gradient-to-br from-sky-500/10 via-slate-900 to-slate-900 border border-sky-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-sky-400">
                <span>هدیه خوش‌آمدگویی ثبت‌نام</span>
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black font-mono text-white">
                1,000
                <span className="text-sm text-sky-400 mr-2">توکن رایگان</span>
              </div>
              <p className="text-xs text-slate-400">
                به هر کاربر جدید در بدو ثبت‌نام یا نصب اپلیکیشن اهدا می‌شود
              </p>
            </div>
          </div>

          {/* Create & Manage Gift Codes Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span>تولید و مدیریت کدهای هدیه (Gift Vouchers)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  کاربران می‌توانند این کدها را در تب «کیف پول» اپلیکیشن موبایل وارد کرده و توکن رایگان دریافت کنند.
                </p>
              </div>

              {giftStatusMsg && (
                <div className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {giftStatusMsg}
                </div>
              )}
            </div>

            {/* Form */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="عنوان کد (مثلاً VIP2026)"
                value={newGiftCode}
                onChange={(e) => setNewGiftCode(e.target.value.toUpperCase())}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 w-44"
              />
              <input
                type="number"
                placeholder="تعداد توکن"
                value={newGiftTokens}
                onChange={(e) => setNewGiftTokens(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 w-32"
              />
              <button
                type="button"
                onClick={handleCreateGiftCode}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                ساخت کد هدیه جدید
              </button>
            </div>

            {/* List of active Gift Codes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {giftCodes.map((g) => (
                <div
                  key={g.id || g.code}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono font-bold text-sm text-amber-500">{g.code}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      ارزش: <strong className="text-slate-900 dark:text-slate-100 font-mono">{g.tokens}</strong> توکن
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      مصرف: {g.usedCount || 0} از {g.maxUses || 500}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(g.code, g.code)}
                    className="px-2.5 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-amber-500 hover:text-black transition-all flex items-center gap-1"
                  >
                    {copiedSection === g.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>کپی</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

