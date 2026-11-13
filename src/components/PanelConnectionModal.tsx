import React, { useState, useEffect } from 'react';
import { X, Server, Lock, Globe, ShieldAlert, FileJson, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { SanaeiPanelProfile } from '../types/sanaei';
import { parseManualSanaeiJson, createDemoSanaeiProfile } from '../utils/sanaeiHelpers';

interface PanelConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (profile: SanaeiPanelProfile) => void;
  initialProfile?: SanaeiPanelProfile | null;
}

export const PanelConnectionModal: React.FC<PanelConnectionModalProps> = ({
  isOpen,
  onClose,
  onSaveProfile,
  initialProfile,
}) => {
  const [tab, setTab] = useState<'live' | 'json'>(initialProfile?.mode === 'json' ? 'json' : 'live');
  const [name, setName] = useState(initialProfile?.name || '');
  const [panelUrl, setPanelUrl] = useState(initialProfile?.panelUrl || '');
  const [webBasePath, setWebBasePath] = useState(initialProfile?.webBasePath || '/');
  const [username, setUsername] = useState(initialProfile?.username || '');
  const [password, setPassword] = useState(initialProfile?.password || '');
  const [apiToken, setApiToken] = useState(initialProfile?.apiToken || '');
  const [twoFactorCode, setTwoFactorCode] = useState(initialProfile?.twoFactorCode || '');
  const [sessionCookie, setSessionCookie] = useState(initialProfile?.sessionCookie || '');
  const [subscriptionBaseUrl, setSubscriptionBaseUrl] = useState(initialProfile?.subscriptionBaseUrl || '');
  const [allowInsecure, setAllowInsecure] = useState(initialProfile?.allowInsecure ?? true);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // JSON Import Tab state
  const [jsonServerName, setJsonServerName] = useState(initialProfile?.name || '');
  const [jsonHost, setJsonHost] = useState(initialProfile?.hostname || '');
  const [rawJsonText, setRawJsonText] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name || '');
      setPanelUrl(initialProfile.panelUrl || '');
      setWebBasePath(initialProfile.webBasePath || '/');
      setUsername(initialProfile.username || '');
      setPassword(initialProfile.password || '');
      setApiToken(initialProfile.apiToken || '');
      setTwoFactorCode(initialProfile.twoFactorCode || '');
      setSessionCookie(initialProfile.sessionCookie || '');
      setSubscriptionBaseUrl(initialProfile.subscriptionBaseUrl || '');
      setAllowInsecure(initialProfile.allowInsecure ?? true);
    } else {
      setName('');
      setPanelUrl('');
      setWebBasePath('/');
      setUsername('');
      setPassword('');
      setApiToken('');
      setTwoFactorCode('');
      setSessionCookie('');
      setSubscriptionBaseUrl('');
      setAllowInsecure(true);
    }
  }, [initialProfile, isOpen]);

  if (!isOpen) return null;

  const handleLiveConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!panelUrl.trim()) {
      setErrorMsg('لطفاً آدرس پنل ثنایی (همراه با پورت) را وارد کنید.');
      return;
    }
    if (!apiToken.trim() && !sessionCookie.trim() && (!username.trim() || !password.trim())) {
      setErrorMsg('لطفاً نام کاربری و رمز عبور پنل ثنایی (یا API Token / کوکی نشست) را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/sanaei/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panelUrl: panelUrl.trim(),
          webBasePath: webBasePath.trim(),
          username: username.trim(),
          password,
          apiToken: apiToken.trim(),
          twoFactorCode: twoFactorCode.trim(),
          sessionCookie: sessionCookie.trim(),
          allowInsecure,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'اتصال به پنل ثنایی برقرار نشد.');
      }

      const newProfile: SanaeiPanelProfile = {
        id: initialProfile?.id || `panel-${Date.now()}`,
        name: name.trim() || `پنل ثنایی (${data.hostname})`,
        panelUrl: panelUrl.trim(),
        webBasePath: webBasePath.trim(),
        username: username.trim() || 'api-token',
        password,
        apiToken: apiToken.trim(),
        twoFactorCode: twoFactorCode.trim(),
        sessionCookie: data.sessionCookie || sessionCookie.trim(),
        allowInsecure,
        subscriptionBaseUrl: subscriptionBaseUrl.trim(),
        mode: 'live',
        hostname: data.hostname || 'localhost',
        lastSyncAt: Date.now(),
        inbounds: data.inbounds || [],
        onlineEmails: data.onlines || [],
      };

      setSuccessMsg(`اتصال برقرار شد! تعداد ${newProfile.inbounds.length} این‌باند از پنل دریافت گردید.`);
      setTimeout(() => {
        onSaveProfile(newProfile);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در برقراری ارتباط با سرور ثنایی.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJsonImport = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const inbounds = parseManualSanaeiJson(rawJsonText);
      const newProfile: SanaeiPanelProfile = {
        id: initialProfile?.id || `json-${Date.now()}`,
        name: jsonServerName.trim() || 'پنل ثنایی (JSON)',
        panelUrl: `https://${jsonHost.trim() || 'server.local'}:2053`,
        webBasePath: '/',
        username: 'manual-json',
        allowInsecure: true,
        mode: 'json',
        hostname: jsonHost.trim() || 'server.local',
        lastSyncAt: Date.now(),
        inbounds,
        onlineEmails: [],
      };
      onSaveProfile(newProfile);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'فرمت JSON واردشده معتبر نیست.');
    }
  };

  const fillSampleJson = () => {
    const demo = createDemoSanaeiProfile();
    const samplePayload = {
      success: true,
      msg: '',
      obj: demo.inbounds.slice(0, 2).map((inb) => ({
        id: inb.id,
        up: inb.up,
        down: inb.down,
        total: inb.total,
        remark: inb.remark,
        enable: inb.enable,
        expiryTime: inb.expiryTime,
        listen: inb.listen,
        port: inb.port,
        protocol: inb.protocol,
        settings: JSON.stringify({ clients: inb.clients }),
        streamSettings: JSON.stringify(inb.streamSettings),
        sniffing: JSON.stringify(inb.sniffing),
        clientStats: inb.clients.map((c) => ({
          id: 1,
          inboundId: inb.id,
          enable: c.enable,
          email: c.email,
          up: c.up,
          down: c.down,
          expiryTime: c.expiryTime,
          total: c.totalGB,
        })),
      })),
    };
    setRawJsonText(JSON.stringify(samplePayload, null, 2));
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {initialProfile ? 'ویرایش اطلاعات اتصال پنل ثنایی' : 'اتصال دستی به پنل ثنایی (3X-UI v3 / v2)'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-4 bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTab('live');
              setErrorMsg(null);
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              tab === 'live'
                ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            اتصال مستقیم با آدرس و رمز پنل (پشتیبانی از CSRF + کوکی)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('json');
              setErrorMsg(null);
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              tab === 'json'
                ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4" />
            ورود دستی خروجی JSON این‌باندها
          </button>
        </div>

        {tab === 'live' ? (
          <form onSubmit={handleLiveConnect} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  نام دلخواه سرور در پنل مدیریتی
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: سرور اصلی آلمان"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  مسیر مخفی پنل (WebBasePath - اختیاری)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={webBasePath}
                  onChange={(e) => setWebBasePath(e.target.value)}
                  placeholder="/"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                آدرس کامل پنل ثنایی (همراه با پورت و پروتکل http یا https) *
              </label>
              <input
                type="text"
                dir="ltr"
                required
                value={panelUrl}
                onChange={(e) => setPanelUrl(e.target.value)}
                placeholder="https://panel.yourdomain.com:2053"
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                توکن امنیتی `/csrf-token` و کوکی نشست `3x-ui` به صورت خودکار دریافت و ارسال می‌شود.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  نام کاربری پنل (Username) *
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  رمز عبور پنل (Password) *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* SSL self-signed toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowInsecure}
                  onChange={(e) => setAllowInsecure(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  نادیده گرفتن خطای گواهی SSL خودامضا (پیشنهادی برای پنل‌های روی IP یا گواهی غیررسمی)
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
              >
                {showAdvanced ? 'بستن تنظیمات پیشرفته' : 'تنظیمات پیشرفته (API Token / 2FA)'}
              </button>
            </div>

            {showAdvanced && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-sky-500" />
                    توکن API پنل ثنایی (Bearer API Token از بخش Settings → Security → API Token - اختیاری)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Bearer token..."
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      کد تایید دو مرحله‌ای (2FA Code - در صورت فعال بودن)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      آدرس پایه لینک اشتراک (Subscription URL)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={subscriptionBaseUrl}
                      onChange={(e) => setSubscriptionBaseUrl(e.target.value)}
                      placeholder="https://panel.yourdomain.com:2096/sub/"
                      className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    کوکی نشست دستی (Session Cookie `3x-ui` - اختیاری)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={sessionCookie}
                    onChange={(e) => setSessionCookie(e.target.value)}
                    placeholder="3x-ui=MTc0MjA4..."
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <div className="leading-relaxed">{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال اتصال و دریافت این‌باندها...
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    تست اتصال و دریافت این‌باندها
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJsonImport} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  نام پنل
                </label>
                <input
                  type="text"
                  value={jsonServerName}
                  onChange={(e) => setJsonServerName(e.target.value)}
                  placeholder="مثلاً: سرور ثنایی (JSON)"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  آدرس دامنه یا IP سرور (برای ساخت لینک کانفیگ)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={jsonHost}
                  onChange={(e) => setJsonHost(e.target.value)}
                  placeholder="panel.yourdomain.com"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  محتوای JSON این‌باندهای پنل ثنایی (خروجی `/panel/api/inbounds/list`)
                </label>
                <button
                  type="button"
                  onClick={fillSampleJson}
                  className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
                >
                  درج نمونه JSON استاندارد ثنایی
                </button>
              </div>
              <textarea
                dir="ltr"
                rows={7}
                required
                value={rawJsonText}
                onChange={(e) => setRawJsonText(e.target.value)}
                placeholder='{"success": true, "obj": [ ... ]}'
                className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                بارگذاری و نمایش این‌باندها
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
