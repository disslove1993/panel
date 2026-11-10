import React, { useState } from 'react';
import { X, Code2, Copy, Check } from 'lucide-react';
import { SanaeiInbound, SanaeiPanelProfile } from '../types/sanaei';
import { buildClientConfigUri, formatBytes } from '../utils/sanaeiHelpers';

interface InboundDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inbound: SanaeiInbound | null;
  profile: SanaeiPanelProfile;
}

export const InboundDetailsModal: React.FC<InboundDetailsModalProps> = ({
  isOpen,
  onClose,
  inbound,
  profile,
}) => {
  const [copiedBulk, setCopiedBulk] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen || !inbound) return null;

  const allUris = inbound.clients
    .map((c) => buildClientConfigUri(inbound, c, profile.hostname))
    .join('\n');

  const rawConfigJson = JSON.stringify(
    {
      id: inbound.id,
      remark: inbound.remark,
      port: inbound.port,
      protocol: inbound.protocol,
      network: inbound.network,
      security: inbound.security,
      streamSettings: inbound.streamSettings,
      sniffing: inbound.sniffing,
    },
    null,
    2
  );

  const handleCopyBulk = () => {
    if (!allUris) return;
    navigator.clipboard.writeText(allUris);
    setCopiedBulk(true);
    setTimeout(() => setCopiedBulk(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawConfigJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              جزئیات فنی و خروجی دسته‌ای این‌باند «{inbound.remark}»
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

        <div className="p-6 space-y-5">
          {/* Technical parameters summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
            <div>
              <div className="text-slate-500 dark:text-slate-400 mb-1">شناسه و تگ Xray</div>
              <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                #{inbound.id} · {inbound.tag}
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 mb-1">پورت و پروتکل</div>
              <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 uppercase">
                {inbound.port} · {inbound.protocol}
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 mb-1">بستر انتقال و امنیت</div>
              <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 uppercase">
                {inbound.network} · {inbound.security}
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 mb-1">مجموع مصرف این‌باند</div>
              <div className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100" dir="ltr">
                {formatBytes(inbound.up + inbound.down)}
              </div>
            </div>
          </div>

          {/* Bulk client links */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                لیست یکجای لینک اتصال تمام کاربران این این‌باند ({inbound.clients.length} کاربر):
              </label>
              <button
                type="button"
                onClick={handleCopyBulk}
                disabled={!allUris}
                className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                {copiedBulk ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    تمام لینک‌ها کپی شد!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    کپی همه لینک‌های این‌باند
                  </>
                )}
              </button>
            </div>
            <textarea
              readOnly
              dir="ltr"
              rows={4}
              value={allUris || '// هیچ کاربری در این این‌باند ثبت نشده است'}
              className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* StreamSettings JSON */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                ساختار پیکربندی StreamSettings و Sniffing در پنل ثنایی:
              </label>
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap shrink-0"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    کپی شد
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    کپی JSON
                  </>
                )}
              </button>
            </div>
            <pre
              dir="ltr"
              className="w-full p-3.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 overflow-x-auto max-h-56"
            >
              {rawConfigJson}
            </pre>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
