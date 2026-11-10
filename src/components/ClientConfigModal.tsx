import React, { useState } from 'react';
import { X, Copy, Check, Link2, Share2 } from 'lucide-react';
import { SanaeiClient, SanaeiInbound, SanaeiPanelProfile } from '../types/sanaei';
import { buildClientConfigUri, formatBytes, formatExpiryStatus } from '../utils/sanaeiHelpers';

interface ClientConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  inbound: SanaeiInbound | null;
  client: SanaeiClient | null;
  profile: SanaeiPanelProfile;
}

export const ClientConfigModal: React.FC<ClientConfigModalProps> = ({
  isOpen,
  onClose,
  inbound,
  client,
  profile,
}) => {
  const [copiedType, setCopiedType] = useState<'uri' | 'sub' | 'uuid' | null>(null);

  if (!isOpen || !inbound || !client) return null;

  const configUri = buildClientConfigUri(inbound, client, profile.hostname);
  const subUrl = client.subId
    ? `${(profile.subscriptionBaseUrl || `https://${profile.hostname}:2096/sub/`).replace(/\/+$/, '')}/${client.subId}`
    : '';

  const usedBytes = (client.up || 0) + (client.down || 0);
  const expiryInfo = formatExpiryStatus(client.expiryTime);

  const handleCopy = (text: string, type: 'uri' | 'sub' | 'uuid') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Link2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              لینک اتصال و مشخصات کاربر «{client.email}»
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
          {/* Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
            <div>
              <div className="text-slate-500 dark:text-slate-400 mb-1">این‌باند و پورت</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {inbound.remark} ({inbound.port})
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 mb-1">پروتکل · شبکه</div>
              <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 uppercase">
                {inbound.protocol} · {inbound.network} · {inbound.security}
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 mb-1">ترافیک مصرفی / کل</div>
              <div className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100" dir="ltr">
                {formatBytes(usedBytes)} / {client.totalGB > 0 ? formatBytes(client.totalGB) : '∞'}
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 mb-1">وضعیت اعتبار</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {expiryInfo.label}
              </div>
            </div>
          </div>

          {/* Direct Config URI */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                لینک مستقیم کانفیگ ({inbound.protocol.toUpperCase()}) قابل ایمپورت در v2rayNG / Streisand / V2Box:
              </label>
              <button
                type="button"
                onClick={() => handleCopy(configUri, 'uri')}
                className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
              >
                {copiedType === 'uri' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    کپی شد!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    کپی لینک اتصال
                  </>
                )}
              </button>
            </div>
            <textarea
              readOnly
              dir="ltr"
              rows={3}
              value={configUri}
              className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 select-all focus:outline-none"
            />
          </div>

          {/* Subscription Link if available */}
          {subUrl && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  لینک سابسکریپشن هوشمند (Subscription URL):
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(subUrl, 'sub')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
                >
                  {copiedType === 'sub' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      کپی شد!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      کپی لینک اشتراک
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                readOnly
                dir="ltr"
                value={subUrl}
                className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 select-all focus:outline-none"
              />
            </div>
          )}

          {/* Client UUID / Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                شناسه یکتا / رمز عبور (UUID / Password):
              </label>
              <button
                type="button"
                onClick={() => handleCopy(client.id, 'uuid')}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap shrink-0"
              >
                {copiedType === 'uuid' ? 'کپی شد' : 'کپی UUID'}
              </button>
            </div>
            <input
              type="text"
              readOnly
              dir="ltr"
              value={client.id}
              className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 select-all focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              بستن پنجره
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
