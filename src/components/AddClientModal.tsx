import React, { useState } from 'react';
import { X, UserPlus, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { SanaeiClient, SanaeiInbound, SanaeiPanelProfile } from '../types/sanaei';
import { generateSubId, generateUuid } from '../utils/sanaeiHelpers';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  inbound: SanaeiInbound | null;
  activeProfile: SanaeiPanelProfile;
  onClientAdded: (updatedInbounds: SanaeiInbound[], message: string) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  inbound,
  activeProfile,
  onClientAdded,
}) => {
  const [email, setEmail] = useState('');
  const [uuidOrPass, setUuidOrPass] = useState(() => generateUuid());
  const [totalGBInput, setTotalGBInput] = useState('30');
  const [expiryDaysInput, setExpiryDaysInput] = useState('30');
  const [limitIpInput, setLimitIpInput] = useState('2');
  const [flow, setFlow] = useState('xtls-rprx-vision');
  const [subId, setSubId] = useState(() => generateSubId(14));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !inbound) return null;

  const isRealityOrTlsVless = inbound.protocol === 'vless' && (inbound.security === 'reality' || inbound.security === 'tls') && inbound.network === 'tcp';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('نام کاربری / ایمیل کاربر (Remark) الزامی است.');
      return;
    }

    const totalBytes = Math.max(0, Number(totalGBInput) || 0) * 1024 * 1024 * 1024;
    const days = Number(expiryDaysInput) || 0;
    const expiryTime = days > 0 ? Date.now() + days * 24 * 60 * 60 * 1000 : 0;

    const newClientPayload: Record<string, any> = {
      id: uuidOrPass.trim(),
      password: uuidOrPass.trim(),
      email: email.trim(),
      limitIp: Math.max(0, Number(limitIpInput) || 0),
      totalGB: totalBytes,
      expiryTime,
      enable: true,
      tgId: '',
      subId: subId.trim(),
      flow: isRealityOrTlsVless ? flow : '',
    };

    if (activeProfile.mode === 'live') {
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/sanaei/add-client', {
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
            client: newClientPayload,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'خطا در ثبت کاربر روی پنل ثنایی.');
        }
        onClientAdded(data.inbounds, `کاربر «${email.trim()}» با موفقیت در پنل ثنایی به این‌باند #${inbound.id} اضافه شد.`);
        onClose();
      } catch (err: any) {
        setErrorMsg(err?.message || 'خطا در ارتباط با پنل ثنایی');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Local Demo or JSON mode update
      const createdClient: SanaeiClient = {
        id: uuidOrPass.trim(),
        password: uuidOrPass.trim(),
        email: email.trim(),
        flow: isRealityOrTlsVless ? flow : '',
        limitIp: Math.max(0, Number(limitIpInput) || 0),
        totalGB: totalBytes,
        expiryTime,
        enable: true,
        tgId: '',
        subId: subId.trim(),
        up: 0,
        down: 0,
      };

      const updatedInbounds = activeProfile.inbounds.map((item) =>
        item.id === inbound.id
          ? {
              ...item,
              clients: [createdClient, ...item.clients],
            }
          : item
      );
      onClientAdded(updatedInbounds, `کاربر «${email.trim()}» به این‌باند «${inbound.remark}» اضافه شد.`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              افزودن کاربر جدید به این‌باند «{inbound.remark}» (پورت {inbound.port})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                نام کاربری / شناسه (Email) *
              </label>
              <input
                type="text"
                dir="ltr"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user_vip_01"
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                شناسه اشتراک (Sub ID)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  dir="ltr"
                  value={subId}
                  onChange={(e) => setSubId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setSubId(generateSubId(14))}
                  className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  title="تولید مجدد"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {inbound.protocol === 'trojan' || inbound.protocol === 'shadowsocks' ? 'رمز عبور کاربر (Password)' : 'شناسه یکتا (UUID)'}
              </label>
              <button
                type="button"
                onClick={() => setUuidOrPass(generateUuid())}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                تولید UUID تصادفی
              </button>
            </div>
            <input
              type="text"
              dir="ltr"
              required
              value={uuidOrPass}
              onChange={(e) => setUuidOrPass(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                حجم کل (گیگابایت)
              </label>
              <input
                type="number"
                dir="ltr"
                min="0"
                step="1"
                value={totalGBInput}
                onChange={(e) => setTotalGBInput(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <span className="text-[11px] text-slate-400">۰ = نامحدود</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                مدت اعتبار (روز)
              </label>
              <input
                type="number"
                dir="ltr"
                min="0"
                step="1"
                value={expiryDaysInput}
                onChange={(e) => setExpiryDaysInput(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <span className="text-[11px] text-slate-400">۰ = بدون انقضا</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                محدودیت IP همزمان
              </label>
              <input
                type="number"
                dir="ltr"
                min="0"
                step="1"
                value={limitIpInput}
                onChange={(e) => setLimitIpInput(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <span className="text-[11px] text-slate-400">۰ = نامحدود</span>
            </div>
          </div>

          {isRealityOrTlsVless && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                الگوریتم Flow (مخصوص VLESS Reality / XTLS)
              </label>
              <select
                dir="ltr"
                value={flow}
                onChange={(e) => setFlow(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="xtls-rprx-vision">xtls-rprx-vision</option>
                <option value="xtls-rprx-vision-udp443">xtls-rprx-vision-udp443</option>
                <option value="">بدون Flow (None)</option>
              </select>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap shrink-0"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ثبت در پنل ثنایی...
                </>
              ) : (
                'ایجاد کاربر در این‌باند'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
