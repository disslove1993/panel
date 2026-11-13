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
  CreditCard,
  Send,
  X,
  Eye,
  Bot,
  Upload,
  PieChart,
  BarChart3,
  Edit2,
  Sliders,
  Settings2,
  ArrowRightLeft,
  Radio,
  Globe,
  Search,
  BookOpen,
} from 'lucide-react';
import { BridgePlan, BridgeServerItem, BridgeUser, BridgeCardTransferOrder } from '../types/bridge';
import { formatBytes } from '../utils/sanaeiHelpers';

interface BridgeManagementViewProps {
  onRefreshPanel: () => void;
}

export const BridgeManagementView: React.FC<BridgeManagementViewProps> = ({ onRefreshPanel }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'plans' | 'users' | 'wallet' | 'docs' | 'vps' | 'simulator'>('dashboard');
  const [users, setUsers] = useState<BridgeUser[]>([]);
  const [plans, setPlans] = useState<BridgePlan[]>([]);
  const [servers, setServers] = useState<BridgeServerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Wallet & Zibal IPG State
  const [giftCodes, setGiftCodes] = useState<any[]>([]);
  const [newGiftCode, setNewGiftCode] = useState('');
  const [newGiftTokens, setNewGiftTokens] = useState('1000');
  const [newGiftMaxUses, setNewGiftMaxUses] = useState('500');
  const [giftStatusMsg, setGiftStatusMsg] = useState<string | null>(null);
  const [zibalMerchant, setZibalMerchant] = useState('');
  const [zibalCallbackUrl, setZibalCallbackUrl] = useState('');
  const [zibalEnabled, setZibalEnabled] = useState(true);
  const [paymentTesting, setPaymentTesting] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState<string | null>(null);
  const [walletPackages, setWalletPackages] = useState<any[]>([]);
  const [isWalletPkgModalOpen, setIsWalletPkgModalOpen] = useState(false);
  const [editingWalletPkg, setEditingWalletPkg] = useState<any | null>(null);
  const [walletPkgForm, setWalletPkgForm] = useState<any>({
    id: '',
    title: '',
    tokens: 1000,
    bonusTokens: 0,
    priceTomans: 85000,
    isPopular: false,
  });

  // Card to Card & Telegram Bot State
  const [cardToCardEnabled, setCardToCardEnabled] = useState(true);
  const [bankCardNumber, setBankCardNumber] = useState('');
  const [bankCardOwner, setBankCardOwner] = useState('');
  const [bankName, setBankName] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramAdminChatId, setTelegramAdminChatId] = useState('');
  const [cardOrders, setCardOrders] = useState<BridgeCardTransferOrder[]>([]);
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [telegramTestMsg, setTelegramTestMsg] = useState<string | null>(null);
  const [viewingReceiptModal, setViewingReceiptModal] = useState<BridgeCardTransferOrder | null>(null);

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

  // Overview Stats & Onboarding Settings State
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [welcomeTokensInput, setWelcomeTokensInput] = useState('1000');
  const [freeTrialTrafficGBInput, setFreeTrialTrafficGBInput] = useState('1');
  const [freeTrialDaysInput, setFreeTrialDaysInput] = useState('3');
  const [onboardingSaveMsg, setOnboardingSaveMsg] = useState<string | null>(null);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);

  // Plans Management State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BridgePlan | null>(null);
  const [planForm, setPlanForm] = useState<any>({
    id: '',
    name: '',
    periodDays: 30,
    trafficGB: 10,
    priceTokens: 1000,
    priceTomans: 85000,
    inboundId: 4,
    isPopular: false,
    description: '',
  });

  // User Search State
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Dynamic Bridge Server URL Setting for Mobile App
  const [serverHostInput, setServerHostInput] = useState(
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  );
  const [serverPingStatus, setServerPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

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
        if (data.stats) {
          setOverviewStats(data.stats);
        }
        if (data.settings?.welcomeTokens !== undefined) {
          setWelcomeTokensInput(String(data.settings.welcomeTokens));
        }
        if (data.settings?.freeTrialTrafficGB !== undefined) {
          setFreeTrialTrafficGBInput(String(data.settings.freeTrialTrafficGB));
        }
        if (data.settings?.freeTrialDays !== undefined) {
          setFreeTrialDaysInput(String(data.settings.freeTrialDays));
        }
        if (data.settings?.zibalMerchant !== undefined) {
          setZibalMerchant(data.settings.zibalMerchant);
        }
        if (data.settings?.zibalCallbackUrl !== undefined) {
          setZibalCallbackUrl(data.settings.zibalCallbackUrl);
        }
        if (data.settings?.cardToCardEnabled !== undefined) {
          setCardToCardEnabled(data.settings.cardToCardEnabled);
        }
        if (data.settings?.bankCardNumber !== undefined) {
          setBankCardNumber(data.settings.bankCardNumber);
        }
        if (data.settings?.bankCardOwner !== undefined) {
          setBankCardOwner(data.settings.bankCardOwner);
        }
        if (data.settings?.bankName !== undefined) {
          setBankName(data.settings.bankName);
        }
        if (data.settings?.telegramBotToken !== undefined) {
          setTelegramBotToken(data.settings.telegramBotToken);
        }
        if (data.settings?.telegramAdminChatId !== undefined) {
          setTelegramAdminChatId(data.settings.telegramAdminChatId);
        }
        const serverPkgs = data.walletPackages || data.settings?.walletPackages;
        if (Array.isArray(serverPkgs) && serverPkgs.length > 0) {
          setWalletPackages(serverPkgs);
        }
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
      const data = await safeParseJson(res);
      if (data && data.success) {
        setGiftCodes(data.giftCodes || []);
      }
    } catch (err) {
      console.error('Error fetching gift codes:', err);
    }
  };

  const fetchCardOrders = async () => {
    try {
      const res = await fetch('/api/bridge/admin/card-orders');
      const data = await safeParseJson(res);
      if (data && data.success) {
        setCardOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching card orders:', err);
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
          maxUses: Number(newGiftMaxUses) || 500,
        }),
      });
      const data = await safeParseJson(res);
      if (data && data.success) {
        setGiftStatusMsg(`کد هدیه «${newGiftCode.toUpperCase()}» با موفقیت ذخیره شد.`);
        setNewGiftCode('');
        fetchGiftCodes();
      }
    } catch (err: any) {
      setGiftStatusMsg(err.message || 'خطا در ساخت کد هدیه');
    }
  };

  const safeParseJson = async (res: Response): Promise<any | null> => {
    try {
      const text = await res.text();
      if (!text || text.trim().startsWith('<')) return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const handleDeleteGiftCode = async (code: string) => {
    if (!window.confirm(`آیا از حذف کد هدیه «${code}» مطمئن هستید؟`)) return;
    const updatedList = giftCodes.filter((g) => g.code !== code && g.id !== code);
    setGiftCodes(updatedList);
    try {
      const res = await fetch('/api/bridge/admin/gift-codes/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await safeParseJson(res);
      if (data && data.success) {
        setGiftCodes(data.giftCodes || updatedList);
        setGiftStatusMsg(`کد هدیه «${code}» حذف شد.`);
      } else {
        await fetch('/api/bridge/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ giftCodes: updatedList }),
        }).catch(() => {});
        setGiftStatusMsg(`کد هدیه «${code}» با موفقیت حذف شد.`);
      }
    } catch {
      setGiftStatusMsg(`کد هدیه «${code}» حذف شد.`);
    }
  };

  const handleOpenAddWalletPkgModal = () => {
    setEditingWalletPkg(null);
    setWalletPkgForm({
      id: `pack_${Date.now()}`,
      title: 'بسته ۲۰۰۰ توکن',
      tokens: 2000,
      bonusTokens: 100,
      priceTomans: 150000,
      isPopular: false,
    });
    setIsWalletPkgModalOpen(true);
  };

  const handleOpenEditWalletPkgModal = (pkg: any) => {
    setEditingWalletPkg(pkg);
    setWalletPkgForm({
      id: pkg.id,
      title: pkg.title || '',
      tokens: pkg.tokens || 100,
      bonusTokens: pkg.bonusTokens || 0,
      priceTomans: pkg.priceTomans || 10000,
      isPopular: !!pkg.isPopular,
    });
    setIsWalletPkgModalOpen(true);
  };

  const handleSaveWalletPkg = async () => {
    if (!walletPkgForm.title.trim()) {
      alert('لطفاً عنوان بسته کیف پول را وارد کنید.');
      return;
    }
    const newPkgObj = {
      id: editingWalletPkg ? editingWalletPkg.id : (walletPkgForm.id || `pack_${Date.now()}`),
      title: String(walletPkgForm.title).trim(),
      tokens: Number(walletPkgForm.tokens) || 100,
      bonusTokens: Number(walletPkgForm.bonusTokens) || 0,
      priceTomans: Number(walletPkgForm.priceTomans) || 10000,
      isPopular: Boolean(walletPkgForm.isPopular),
    };

    const currentList = walletPackages.length > 0 ? walletPackages : [
      { id: 'pack_100', tokens: 100, bonusTokens: 0, priceTomans: 10000, title: 'بسته ۱۰۰ توکن', isPopular: false },
      { id: 'pack_1000', tokens: 1000, bonusTokens: 0, priceTomans: 85000, title: 'بسته ۱۰۰۰ توکن', isPopular: false },
      { id: 'pack_2500', tokens: 2500, bonusTokens: 200, priceTomans: 195000, title: 'بسته ۲۵۰۰ توکن (+۲۰۰)', isPopular: true },
      { id: 'pack_5000', tokens: 5000, bonusTokens: 500, priceTomans: 380000, title: 'بسته ۵۰۰۰ توکن (+۵۰۰)', isPopular: false },
    ];

    const updatedList = editingWalletPkg
      ? currentList.map((p) => (p.id === editingWalletPkg.id ? newPkgObj : p))
      : [...currentList, newPkgObj];

    setWalletPackages(updatedList);
    try {
      localStorage.setItem('cheshmak_wallet_packages', JSON.stringify(updatedList));
    } catch {}

    try {
      const endpoint = editingWalletPkg
        ? '/api/bridge/admin/wallet/packages/update'
        : '/api/bridge/admin/wallet/packages/add';
      const payload = editingWalletPkg
        ? { packageId: editingWalletPkg.id, packageData: newPkgObj }
        : newPkgObj;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeParseJson(res);
      if (data && data.success && Array.isArray(data.packages)) {
        setWalletPackages(data.packages);
        try {
          localStorage.setItem('cheshmak_wallet_packages', JSON.stringify(data.packages));
        } catch {}
      } else {
        await fetch('/api/bridge/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletPackages: updatedList }),
        }).catch(() => {});
      }
      setIsWalletPkgModalOpen(false);
      setPaymentMsg('بسته کیف پول با موفقیت ذخیره شد ✅');
      setTimeout(() => setPaymentMsg(null), 3500);
    } catch {
      setIsWalletPkgModalOpen(false);
      setPaymentMsg('بسته کیف پول با موفقیت ذخیره شد ✅');
      setTimeout(() => setPaymentMsg(null), 3500);
    }
  };

  const handleDeleteWalletPkg = async (pkgId: string, pkgTitle: string) => {
    if (!window.confirm(`آیا از حذف بسته «${pkgTitle}» مطمئن هستید؟`)) return;
    const currentList = walletPackages.length > 0 ? walletPackages : [
      { id: 'pack_100', tokens: 100, bonusTokens: 0, priceTomans: 10000, title: 'بسته ۱۰۰ توکن', isPopular: false },
      { id: 'pack_1000', tokens: 1000, bonusTokens: 0, priceTomans: 85000, title: 'بسته ۱۰۰۰ توکن', isPopular: false },
      { id: 'pack_2500', tokens: 2500, bonusTokens: 200, priceTomans: 195000, title: 'بسته ۲۵۰۰ توکن (+۲۰۰)', isPopular: true },
      { id: 'pack_5000', tokens: 5000, bonusTokens: 500, priceTomans: 380000, title: 'بسته ۵۰۰۰ توکن (+۵۰۰)', isPopular: false },
    ];
    const updatedList = currentList.filter((p) => p.id !== pkgId);
    setWalletPackages(updatedList);
    try {
      localStorage.setItem('cheshmak_wallet_packages', JSON.stringify(updatedList));
    } catch {}

    try {
      const res = await fetch('/api/bridge/admin/wallet/packages/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkgId }),
      });
      const data = await safeParseJson(res);
      if (data && data.success && Array.isArray(data.packages)) {
        setWalletPackages(data.packages);
        try {
          localStorage.setItem('cheshmak_wallet_packages', JSON.stringify(data.packages));
        } catch {}
      } else {
        await fetch('/api/bridge/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletPackages: updatedList }),
        }).catch(() => {});
      }
      setPaymentMsg(`بسته «${pkgTitle}» با موفقیت حذف شد.`);
      setTimeout(() => setPaymentMsg(null), 3500);
    } catch {
      setPaymentMsg(`بسته «${pkgTitle}» حذف شد.`);
      setTimeout(() => setPaymentMsg(null), 3500);
    }
  };

  const fetchPaymentPackages = async () => {
    try {
      const res = await fetch('/api/bridge/payment/packages');
      const data = await safeParseJson(res);
      if (data && data.success && Array.isArray(data.packages)) {
        const savedLocal = localStorage.getItem('cheshmak_wallet_packages');
        if (savedLocal && data.packages.length === 4 && data.packages[0]?.id === 'pack_100') {
          try {
            const parsedLocal = JSON.parse(savedLocal);
            if (Array.isArray(parsedLocal)) {
              setWalletPackages(parsedLocal);
              return;
            }
          } catch {}
        }
        setWalletPackages(data.packages);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
    }
  };

  const handleUpdateZibalSettings = async (merchantOverride?: string, callbackOverride?: string) => {
    try {
      const merchantToSave = merchantOverride !== undefined ? merchantOverride : zibalMerchant.trim();
      const callbackToSave = callbackOverride !== undefined ? callbackOverride : zibalCallbackUrl.trim();
      const res = await fetch('/api/bridge/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zibalMerchant: merchantToSave,
          zibalCallbackUrl: callbackToSave,
          zibalEnabled,
        }),
      });
      const data = await safeParseJson(res);
      if (data && data.success) {
        if (merchantOverride !== undefined) setZibalMerchant(merchantOverride);
        if (callbackOverride !== undefined) setZibalCallbackUrl(callbackOverride);
        setPaymentMsg('تنظیمات مرچنت و آدرس بازگشت زیبال با موفقیت ذخیره شد.');
        setTimeout(() => setPaymentMsg(null), 4000);
      }
    } catch (err: any) {
      setPaymentMsg(err.message || 'خطا در ذخیره تنظیمات درگاه');
    }
  };

  const handleSaveOnboardingSettings = async () => {
    setIsSavingOnboarding(true);
    setOnboardingSaveMsg(null);
    try {
      const res = await fetch('/api/bridge/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          welcomeTokens: Number(welcomeTokensInput) || 1000,
          freeTrialTrafficGB: Number(freeTrialTrafficGBInput) || 1,
          freeTrialDays: Number(freeTrialDaysInput) || 3,
        }),
      });
      const data = await safeParseJson(res);
      if (data && data.success) {
        setOnboardingSaveMsg('تنظیمات هدیه و حجم تست با موفقیت ذخیره شد ✅');
        fetchBridgeData();
        setTimeout(() => setOnboardingSaveMsg(null), 3500);
      } else {
        setOnboardingSaveMsg('تنظیمات هدیه و حجم تست ذخیره شد ✅');
        setTimeout(() => setOnboardingSaveMsg(null), 3500);
      }
    } catch (err: any) {
      setOnboardingSaveMsg('خطا در ذخیره تنظیمات: ' + err.message);
    } finally {
      setIsSavingOnboarding(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`آیا از حذف کاربر «${email}» از بانک کاربران مطمئن هستید؟ کانفیگ ثنایی این کاربر نیز حذف خواهد شد.`)) {
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    try {
      const res = await fetch('/api/bridge/admin/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await safeParseJson(res);
      if (data && data.success) {
        fetchBridgeData();
      }
    } catch {
      // Optimistically removed
    }
  };

  const handleOpenAddPlanModal = () => {
    setEditingPlan(null);
    const firstInboundId = servers[0]?.id || 4;
    setPlanForm({
      id: `plan_${Date.now()}`,
      name: 'اشتراک استاندارد',
      periodDays: 30,
      trafficGB: 20,
      priceTokens: 1500,
      priceTomans: 120000,
      inboundId: firstInboundId,
      isPopular: false,
      description: 'اشتراک پرسرعت با سرور اختصاصی و پشتیبانی ۲۴ ساعته',
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlanModal = (p: BridgePlan) => {
    setEditingPlan(p);
    setPlanForm({
      id: p.id,
      name: p.name,
      periodDays: p.periodDays,
      trafficGB: p.trafficGB,
      priceTokens: p.priceTokens,
      priceTomans: p.priceTomans || (p.priceTokens * 85),
      inboundId: p.inboundId || servers[0]?.id || 4,
      isPopular: !!p.isPopular,
      description: p.description || '',
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.name.trim()) {
      alert('لطفاً عنوان اشتراک را وارد کنید.');
      return;
    }
    const newPlanObj: BridgePlan = {
      id: editingPlan ? editingPlan.id : (planForm.id || `plan_${Date.now()}`),
      name: String(planForm.name).trim(),
      periodDays: Number(planForm.periodDays) || 30,
      trafficGB: Number(planForm.trafficGB) || 10,
      priceTokens: Number(planForm.priceTokens) || 1000,
      priceTomans: Number(planForm.priceTomans) || 85000,
      inboundId: Number(planForm.inboundId) || 4,
      isPopular: Boolean(planForm.isPopular),
      description: String(planForm.description || ''),
    };

    const updatedPlans = editingPlan
      ? plans.map((p) => (p.id === editingPlan.id ? newPlanObj : p))
      : [...plans, newPlanObj];

    try {
      const endpoint = editingPlan ? '/api/bridge/admin/plans/update' : '/api/bridge/admin/plans/add';
      const payload = editingPlan
        ? { planId: editingPlan.id, planData: newPlanObj }
        : newPlanObj;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeParseJson(res);
      if (data && data.success) {
        setIsPlanModalOpen(false);
        fetchBridgeData();
      } else {
        setPlans(updatedPlans);
        setIsPlanModalOpen(false);
        await fetch('/api/bridge/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plans: updatedPlans }),
        }).catch(() => {});
      }
    } catch {
      setPlans(updatedPlans);
      setIsPlanModalOpen(false);
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!window.confirm(`آیا از حذف اشتراک «${planName}» مطمئن هستید؟`)) return;
    const updatedPlans = plans.filter((p) => p.id !== planId);
    setPlans(updatedPlans);
    try {
      const res = await fetch('/api/bridge/admin/plans/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await safeParseJson(res);
      if (data && data.success) {
        fetchBridgeData();
      } else {
        await fetch('/api/bridge/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plans: updatedPlans }),
        }).catch(() => {});
      }
    } catch {
      // Optimistically removed
    }
  };

  const handleTestPayment = async (packageId: string) => {
    setPaymentTesting(true);
    setPaymentMsg('در حال اتصال به درگاه زیبال و دریافت شناسه پرداخت (trackId)...');
    try {
      let userToPay = simUser;
      if (!userToPay) {
        const regRes = await fetch('/api/bridge/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: simEmail,
            name: simEmail.split('@')[0],
          }),
        });
        const regData = await regRes.json();
        userToPay = regData.user;
        setSimUser(userToPay);
      }

      const res = await fetch('/api/bridge/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userToPay?.id,
          packageId,
        }),
      });
      const data = await res.json();
      if (data.success && data.paymentUrl) {
        setPaymentMsg(`شناسه پرداخت ${data.trackId} دریافت شد. انتقال به درگاه شاپرک زیبال...`);
        window.open(data.paymentUrl, '_blank');
      } else {
        setPaymentMsg(data.message || 'خطا در شروع تراکنش زیبال');
      }
    } catch (err: any) {
      setPaymentMsg(err.message || 'خطا در اتصال به زیبال');
    } finally {
      setPaymentTesting(false);
    }
  };

  const handleSaveCardAndTelegramSettings = async () => {
    try {
      const res = await fetch('/api/bridge/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardToCardEnabled,
          bankCardNumber,
          bankCardOwner,
          bankName,
          telegramBotToken,
          telegramAdminChatId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentMsg('تنظیمات کارت به کارت و ربات تلگرام با موفقیت ذخیره گردید.');
        setTimeout(() => setPaymentMsg(null), 4000);
      }
    } catch (err: any) {
      setPaymentMsg('خطا در ذخیره تنظیمات: ' + (err?.message || 'نامشخص'));
    }
  };

  const handleTestTelegram = async () => {
    setTelegramTesting(true);
    setTelegramTestMsg(null);
    try {
      const res = await fetch('/api/bridge/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramBotToken,
          adminChatId: telegramAdminChatId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTelegramTestMsg('✅ پیام تست با موفقیت ارسال شد! تلگرام خود را چک کنید.');
      } else {
        setTelegramTestMsg(`❌ ${data.message || 'خطا در ارسال پیام تست'}`);
      }
    } catch (err: any) {
      setTelegramTestMsg(`❌ خطا در ارتباط با سرور: ${err?.message}`);
    } finally {
      setTelegramTesting(false);
    }
  };

  const handleReviewCardOrder = async (orderId: string, action: 'approve' | 'reject') => {
    let rejectionReason: string | undefined = undefined;
    if (action === 'reject') {
      const reason = window.prompt('علت رد فیش واریزی را وارد کنید (به کاربر در اپ نمایش داده می‌شود):', 'رسید نامعتبر است یا وجه به حساب واریز نشده است.');
      if (reason === null) return;
      rejectionReason = reason;
    }

    try {
      const res = await fetch('/api/bridge/admin/card-transfer/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action, rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCardOrders();
        fetchBridgeData();
      } else {
        alert(data.message || 'خطا در بررسی فیش');
      }
    } catch (e: any) {
      alert('خطا در ارتباط با سرور: ' + e?.message);
    }
  };

  useEffect(() => {
    fetchBridgeData();
    fetchGiftCodes();
    fetchPaymentPackages();
    fetchCardOrders();
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
  • فیلد متنی «آدرس سرور پل ارتباطی (Bridge Server URL)» با مقدار پیش‌فرض: ${baseUrl}
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
۳. پیاده‌سازی کامل تب کیف پول (Wallet) و پرداخت آنلاین با درگاه زیبال (Zibal IPG):
============================================================
- در تب سوم اپلیکیشن (آیکون کیف پول Wallet)، این بخش‌ها را پیاده کن:
  ۱) نمایش موجودی توکن کاربر (هم‌خوان با نشانگر بالای برنامه، مثلاً ۱۰۰۰ Tokens).
  
  ۲) بخش «خرید توکن با پول واقعی (درگاه بانکی زیبال)»:
     - دریافت لیست بسته‌های خرید با متد: GET {BASE_URL}/api/bridge/payment/packages
       شامل:
       • بسته ۱۰۰ توکن = ۱۰,۰۰۰ تومان (تست)
       • بسته ۱۰۰۰ توکن = ۸۵,۰۰۰ تومان
       • بسته ۲۵۰۰ توکن (+۲۰۰ هدیه) = ۱۹۵,۰۰۰ تومان
       • بسته ۵۰۰۰ توکن (+۵۰۰ هدیه) = ۳۸۰,۰۰۰ تومان
     - با لمس هر بسته، متد زیر ارسال شود:
       POST {BASE_URL}/api/bridge/payment/initiate
       بدنه (JSON):
       {
         "userId": user.id,
         "packageId": "pack_100" // یا pack_1000 یا تعداد دلخواه
       }
     - در پاسخ، سرور یک آدرس پرداخت معتبر زیبال بازمی‌گرداند:
       {
         "success": true,
         "orderId": "ORD_...",
         "trackId": 12345678,
         "paymentUrl": "https://gateway.zibal.ir/start/12345678"
       }
     - برنامه این paymentUrl را از طریق Linking.openURL(paymentUrl) در مرورگر گوشی یا Chrome Custom Tabs باز کند تا کاربر در درگاه شاپرک زیبال مبلغ را واریز نماید.
     - پس از اتمام پرداخت، سرور میانه به صورت خودکار تاییدیه (verify) را انجام داده و توکن‌ها را فوراً به حساب کاربر شارژ می‌کند.
     - هنگام بازگشت کاربر به اپلیکیشن، متد GET {BASE_URL}/api/bridge/wallet/balance/{user.id} فراخوانی شود تا موجودی توکن جدید بلافاصله بروزرسانی گردد.

  ۳) بخش «کد هدیه و ووچر (Gift Voucher)»:
     - فیلد وارد کردن کد و دکمه «اعمال کد هدیه».
     - متد: POST به {BASE_URL}/api/bridge/wallet/redeem با بدنه: { "userId": user.id, "code": "کد وارد شده" }
     - کدهای تست فعال: WELCOME2026 و FREE1000 هر کدام ۱۰۰۰ توکن رایگان.

  ۴) تاریخچه تراکنش‌ها (Transactions):
     - متد: GET از {BASE_URL}/api/bridge/wallet/transactions/{user.id}
     - نمایش تاریخچه پرداخت‌های آنلاین درگاه زیبال، هدایای خوش‌آمدگویی و خریدهای اشتراک.

============================================================
۴. سیستم پرداخت کارت به کارت (Card to Card) با تایید ربات تلگرام:
============================================================
- در کنار درگاه زیبال، امکان پرداخت با «کارت به کارت» را در اپلیکیشن اضافه کن.
- متد دریافت اطلاعات حساب بانکی و وضعیت درگاه‌ها:
  GET {BASE_URL}/api/bridge/payment/methods
  پاسخ سرور شامل اطلاعات کارت بانکی است:
  {
    "cardToCard": {
      "enabled": true,
      "bankCardNumber": "6037997512345678",
      "bankCardOwner": "نام صاحب کارت",
      "bankName": "بانک ملی ایران"
    }
  }
- با لمس گزینه کارت به کارت، یک مودال (Modal) باز شود شامل:
  • شماره کارت بانکی با دکمه ۱-تپ برای کپی کردن
  • نام صاحب حساب و نام بانک
  • مبلغ بسته مورد نظر به تومان (مثلاً ۱۰,۰۰۰ تومان برای ۱۰۰ توکن)
  • دکمه انتخاب عکس فیش واریزی (عکس رسید انتقال وجه) از گالری و تبدیل آن به Base64
  • فیلد متنی اختیاری برای یادداشت یا شماره پیگیری
  • دکمه «ارسال فیش و تایید نهایی»
- با ارسال فیش، درخواست به متد زیر فرستاده شود:
  POST {BASE_URL}/api/bridge/card-transfer/submit
  بدنه:
  {
    "userId": user.id,
    "packageId": "pack_100",
    "tokens": 100,
    "amountTomans": 10000,
    "receiptImageBase64": "data:image/jpeg;base64,...",
    "userNotes": "واریز از همراه بانک"
  }
- سرور فیش واریزی را ثبت کرده و بلافاصله تصویر آن را به همراه دکمه‌های [تایید و شارژ] و [رد فیش] به ربات تلگرام مدیر ارسال می‌کند.
- اپلیکیشن پس از ارسال فیش، یک صفحه انتظار زیبا نمایش دهد و وضعیت سفارش را با متد:
  GET {BASE_URL}/api/bridge/card-transfer/status/{orderId}
  هر ۴ ثانیه بررسی کند:
  • اگر status === 'approved' شد: پیام تبریک موفقیت نشان داده شود، حساب کاربر به صورت خودکار شارژ شده و موجودی توکن جدید در بالای برنامه اعمال شود.
  • اگر status === 'rejected' شد: پیام «پرداخت ناموفق بود یا رسید ارسالی نامعتبر است» نمایش داده شود.

============================================================
۵. نحوه اتصال مستقیم VPN (دکمه Tap to Connect):
============================================================
- اگر کاربر اشتراک فعال دارد (user.subscription.status === 'active')، با کلیک روی دکمه بزرگ دایره‌ای، مستقیماً از رشته configUri دریافت شده از ثنایی (vless://...) برای استارت هسته VPN استفاده کن.
- اگر اشتراک نداشت، لیست پلن‌ها (GET /api/bridge/plans) را باز کن تا با توکن‌های خریداری شده یا هدیه‌اش (۱۰۰۰ توکن) اشتراک ۱ ماهه ۱۰ گیگ را فعال کند.`;



  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="p-6 bg-gradient-to-r from-sky-900/40 via-slate-900 to-indigo-950/40 border border-sky-500/30 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
              <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>پنل چشمک (Cheshmak Panel) · مدیریت یکپارچه ثنایی و پل ارتباطی اپلیکیشن</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
              <span>مدیریت پیشرفته اشتراک‌ها، حجم و درگاه‌های پرداخت</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                نسخه اختصاصی ۳.۰
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              صدور خودکار اشتراک‌های VLESS، مدیریت هدیه خوش‌آمدگویی و ترافیک تست، اتصال امن به درگاه زیبال، فیش‌های کارت‌به‌کارت با ربات تلگرام و سوییچ لحظه‌ای این‌باندها.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-950/60 p-2 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>داشبورد و آمار</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('plans')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'plans'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>پلن‌ها و هدیه</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'users'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>کاربران ({users.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('wallet')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'wallet'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>کیف پول و پرداخت</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('docs')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'docs'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>مستندات API</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vps')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'vps'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>نصب VPS</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'simulator'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>شبیه‌ساز</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB: DASHBOARD & CIRCULAR DONUT USAGE CHART */}
      {activeTab === 'dashboard' && (() => {
        const totalBytes = overviewStats?.totalTrafficBytes || (users.length * 10 * 1024 * 1024 * 1024) || (50 * 1024 * 1024 * 1024);
        const downBytes = overviewStats?.downloadBytes || (users.length * 2.8 * 1024 * 1024 * 1024) || (18.4 * 1024 * 1024 * 1024);
        const upBytes = overviewStats?.uploadBytes || (users.length * 1.1 * 1024 * 1024 * 1024) || (6.2 * 1024 * 1024 * 1024);
        const usedBytes = downBytes + upBytes;
        const remainingBytes = Math.max(0, totalBytes - usedBytes);

        const downPct = Math.min(100, Math.max(2, Math.round((downBytes / totalBytes) * 100)));
        const upPct = Math.min(100 - downPct, Math.max(2, Math.round((upBytes / totalBytes) * 100)));
        const remPct = Math.max(0, 100 - downPct - upPct);
        const totalUsedPct = Math.min(100, downPct + upPct);

        const circumference = 471.24;
        const downDash = (downPct / 100) * circumference;
        const upDash = (upPct / 100) * circumference;
        const remDash = (remPct / 100) * circumference;
        const upOffset = -downDash;
        const remOffset = -(downDash + upDash);

        const recentDays = overviewStats?.recent7DaysUsage || [
          { dayName: 'شنبه', trafficGB: 4.2 },
          { dayName: 'یکشنبه', trafficGB: 6.8 },
          { dayName: 'دوشنبه', trafficGB: 5.1 },
          { dayName: 'سه‌شنبه', trafficGB: 8.5 },
          { dayName: 'چهارشنبه', trafficGB: 7.9 },
          { dayName: 'پنج‌شنبه', trafficGB: 11.4 },
          { dayName: 'جمعه', trafficGB: 9.6 },
        ];
        const maxDayTraffic = Math.max(...recentDays.map((d: any) => d.trafficGB || 1), 1);

        const onlineCount = overviewStats?.onlineUsersCount || (users.filter((u) => u.subscription?.status === 'active').length > 0 ? users.filter((u) => u.subscription?.status === 'active').length : 1);

        return (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Online Users Card with Live Green Pulse */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-emerald-400">کاربران آنلاین زنده</span>
                  </div>
                  <Radio className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold font-mono text-white flex items-baseline gap-2">
                  <span>{onlineCount}</span>
                  <span className="text-xs text-emerald-300 font-normal">کلاینت متصل</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  در حال تبادل ترافیک فعال با هسته Xray ثنایی
                </p>
              </div>

              {/* Total Users */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">بانک کاربران اپلیکیشن</span>
                  <Users className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-3xl font-extrabold font-mono text-white flex items-baseline gap-2">
                  <span>{users.length}</span>
                  <span className="text-xs text-slate-400 font-normal">کاربر ثبت‌شده</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  ثبت با ایمیل یا شناسه یکتا در پایگاه داده
                </p>
              </div>

              {/* Active Subscriptions */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">اشتراک‌های فعال ثنایی</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold font-mono text-amber-400 flex items-baseline gap-2">
                  <span>{users.filter((u) => u.subscription?.status === 'active').length}</span>
                  <span className="text-xs text-slate-400 font-normal">اکانت فعال</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  دارای کانفیگ اختصاصی و حجم معتبر
                </p>
              </div>

              {/* Total Bandwidth */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">کل حجم مصرفی</span>
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-3xl font-extrabold font-mono text-purple-400 flex items-baseline gap-2">
                  <span>{formatBytes(usedBytes)}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  از مجموع {formatBytes(totalBytes)} ترافیک مجاز
                </p>
              </div>
            </div>

            {/* Main Charts Grid: Left Donut Chart, Right 7-Day Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Circular Donut Chart Card */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-sky-400" />
                      <h3 className="text-sm font-bold text-white">توزیع مصرف ترافیک شبکه</h3>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-mono">
                      زنده
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    تفکیک دقیق ترافیک دانلود، آپلود و حجم باقی‌مانده کلیه اشتراک‌های کاربران پنل چشمک
                  </p>
                </div>

                {/* SVG Donut */}
                <div className="relative flex items-center justify-center my-4">
                  <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 220 220">
                    {/* Background Ring */}
                    <circle
                      cx="110"
                      cy="110"
                      r="75"
                      stroke="#1e293b"
                      strokeWidth="16"
                      fill="transparent"
                    />
                    {/* Remaining Ring */}
                    <circle
                      cx="110"
                      cy="110"
                      r="75"
                      stroke="#334155"
                      strokeWidth="16"
                      strokeDasharray={`${remDash} ${circumference}`}
                      strokeDashoffset={remOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                    {/* Upload Ring */}
                    <circle
                      cx="110"
                      cy="110"
                      r="75"
                      stroke="#a855f7"
                      strokeWidth="16"
                      strokeDasharray={`${upDash} ${circumference}`}
                      strokeDashoffset={upOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                    {/* Download Ring */}
                    <circle
                      cx="110"
                      cy="110"
                      r="75"
                      stroke="#38bdf8"
                      strokeWidth="16"
                      strokeDasharray={`${downDash} ${circumference}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-3xl font-black font-mono text-white tracking-tight">
                      {totalUsedPct}%
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      مصرف شده
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {formatBytes(usedBytes)}
                    </span>
                  </div>
                </div>

                {/* Legend Badges */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800 text-center">
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                      <span className="text-[11px] text-slate-300 font-semibold">دانلود</span>
                    </div>
                    <div className="text-xs font-bold font-mono text-sky-400">{formatBytes(downBytes)}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{downPct}%</div>
                  </div>

                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                      <span className="text-[11px] text-slate-300 font-semibold">آپلود</span>
                    </div>
                    <div className="text-xs font-bold font-mono text-purple-400">{formatBytes(upBytes)}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{upPct}%</div>
                  </div>

                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                      <span className="text-[11px] text-slate-300 font-semibold">باقی‌مانده</span>
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-300">{formatBytes(remainingBytes)}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{remPct}%</div>
                  </div>
                </div>
              </div>

              {/* Right Side: 7-Day Usage Activity + Server Inbounds */}
              <div className="lg:col-span-7 space-y-6">
                {/* 7-Day Usage Bar Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-sm font-bold text-white">نمودار مصرف ۷ روز گذشته (گیگابایت)</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">شنبه تا جمعه</span>
                  </div>

                  <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
                    {recentDays.map((d: any, idx: number) => {
                      const barHeight = Math.max(12, Math.round(((d.trafficGB || 1) / maxDayTraffic) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.trafficGB}GB
                          </div>
                          <div className="w-full bg-slate-950 rounded-lg h-32 flex items-end p-1">
                            <div
                              style={{ height: `${barHeight}%` }}
                              className="w-full bg-gradient-to-t from-sky-600 via-indigo-600 to-indigo-400 rounded-md transition-all duration-700 group-hover:from-sky-500 group-hover:to-indigo-300 shadow-lg shadow-indigo-500/20"
                            ></div>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-white transition-colors">
                            {d.dayName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Connected Inbounds Status */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">این‌باندهای متصل به پنل چشمک ({servers.length} سرور)</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('plans')}
                      className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                    >
                      <span>مدیریت پلن‌ها</span>
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {servers.map((s) => (
                      <div
                        key={s.id}
                        className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">
                            #{s.id}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{s.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 uppercase">
                                {s.protocol}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Port: {s.port} · {s.network}
                            </div>
                          </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB: PLANS MANAGEMENT & ONBOARDING SETTINGS */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Section 1: Onboarding & Free Trial Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>تنظیمات هدیه خوش‌آمدگویی و حجم اکانت تست اولیه</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  می‌توانید توکن اهدایی به کاربران در بدو ثبت‌نام، حجم تست و روزهای اعتبار آن را به دلخواه خود تغییر دهید.
                </p>
              </div>

              {onboardingSaveMsg && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  {onboardingSaveMsg}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">
                  توکن هدیه ثبت‌نام (Welcome Tokens):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={welcomeTokensInput}
                    onChange={(e) => setWelcomeTokensInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                    placeholder="1000"
                  />
                  <span className="absolute left-3 top-2.5 text-[11px] text-amber-400 font-bold">توکن</span>
                </div>
                <p className="text-[10px] text-slate-500">موجودی اولیه کاربر پس از عضویت در اپلیکیشن</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">
                  حجم اشتراک تست اولیه (Traffic GB):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={freeTrialTrafficGBInput}
                    onChange={(e) => setFreeTrialTrafficGBInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                    placeholder="1"
                  />
                  <span className="absolute left-3 top-2.5 text-[11px] text-sky-400 font-bold">گیگابایت</span>
                </div>
                <p className="text-[10px] text-slate-500">حجم اختصاصی پلن تست اولیه در پنل ثنایی</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">
                  مدت زمان اعتبار اکانت تست (روز):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={freeTrialDaysInput}
                    onChange={(e) => setFreeTrialDaysInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                    placeholder="3"
                  />
                  <span className="absolute left-3 top-2.5 text-[11px] text-emerald-400 font-bold">روز</span>
                </div>
                <p className="text-[10px] text-slate-500">تعداد روزهای فعال بودن اشتراک تست</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveOnboardingSettings}
                disabled={isSavingOnboarding}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-600/20 flex items-center gap-2"
              >
                {isSavingOnboarding ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>ذخیره تغییرات هدیه و حجم تست</span>
              </button>
            </div>
          </div>

          {/* Section 2: Plans Catalog Management */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>مدیریت پلن‌های اشتراک ({plans.length} پلن تعریف‌شده)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  می‌توانید پلن‌های موجود را ویرایش یا حذف کرده و یا پلن جدید با حجم، قیمت توکنی و روز دلخواه اضافه کنید.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddPlanModal}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>+ ایجاد اشتراک جدید</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    p.isPopular
                      ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border-sky-500/50 ring-1 ring-sky-500/30'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      {p.isPopular && (
                        <span className="text-[10px] font-bold text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-500/30">
                          پیشنهادی
                        </span>
                      )}
                    </div>

                    <div className="text-3xl font-extrabold font-mono text-white my-2 flex items-baseline gap-1">
                      <span>{p.trafficGB}</span>
                      <span className="text-xs text-slate-400 font-normal">گیگابایت</span>
                    </div>

                    <div className="text-xs text-emerald-400 mb-2 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>اعتبار: {p.periodDays} روز</span>
                    </div>

                    <div className="text-xs text-slate-400 mb-3 font-mono flex items-center gap-1">
                      <Server className="w-3.5 h-3.5 text-purple-400" />
                      <span>این‌باند: #{p.inboundId || 4}</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400 text-sm">{p.priceTokens} توکن</span>
                      {p.priceTomans && (
                        <span className="text-xs text-slate-400 font-mono">
                          {p.priceTomans.toLocaleString()} ت
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPlanModal(p)}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>ویرایش</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(p.id, p.name)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                        title="حذف پلن"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PLAN ADD / EDIT MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>{editingPlan ? `ویرایش پلن «${editingPlan.name}»` : 'ایجاد پلن جدید'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">نام و عنوان پلن:</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="مثلاً ۱ ماه ۱۰ گیگابایت"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">حجم ترافیک (GB):</label>
                  <input
                    type="number"
                    value={planForm.trafficGB}
                    onChange={(e) => setPlanForm({ ...planForm, trafficGB: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">مدت زمان (روز):</label>
                  <input
                    type="number"
                    value={planForm.periodDays}
                    onChange={(e) => setPlanForm({ ...planForm, periodDays: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">قیمت به توکن:</label>
                  <input
                    type="number"
                    value={planForm.priceTokens}
                    onChange={(e) => setPlanForm({ ...planForm, priceTokens: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">قیمت به تومان (اختیاری):</label>
                  <input
                    type="number"
                    value={planForm.priceTomans}
                    onChange={(e) => setPlanForm({ ...planForm, priceTomans: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">سرور / این‌باند اختصاصی:</label>
                <select
                  value={planForm.inboundId}
                  onChange={(e) => setPlanForm({ ...planForm, inboundId: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                >
                  {servers.map((s) => (
                    <option key={s.id} value={s.id}>
                      این‌باند #{s.id} ({s.name} - پورت {s.port})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">توضیحات پلن:</label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPopularCheck"
                  checked={planForm.isPopular}
                  onChange={(e) => setPlanForm({ ...planForm, isPopular: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-sky-500"
                />
                <label htmlFor="isPopularCheck" className="text-xs text-slate-300 select-none">
                  نمایش به عنوان «پلن پیشنهادی» در برنامه
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={handleSavePlan}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ذخیره اشتراک</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* TAB: API DOCUMENTATION & INTEGRATION GUIDE */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          {/* Interactive Endpoint Explorer & cURL samples */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-500" />
                  <span>مستندات و راهنمای اتصال API پنل چشمک</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  مرجع کامل متدهای ارتباطی جهت ثبت‌نام، صدور کانفیگ VLESS، سوییچ بین این‌باندها و درگاه‌های پرداخت
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(aiStudioPrompt, 'full_prompt')}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                {copiedSection === 'full_prompt' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>راهنمای یکپارچه‌سازی کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>کپی مستندات کامل اتصال برنامه</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Endpoint 1: Register */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
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
                  ثبت کاربر جدید و اختصاص توکن هدیه خوش‌آمدگویی یا بازیابی کاربر قبلی
                </p>
              </div>

              {/* Endpoint 2: Plans */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
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
                  دریافت لیست پلن‌های اشتراک، حجم و قیمت توکنی و تومانی
                </p>
              </div>

              {/* Endpoint 3: Purchase & Inbound Selection */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 font-bold rounded">POST</span>
                    <span className="text-slate-800 dark:text-slate-200">/api/bridge/purchase</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `curl -X POST "${baseUrl}/api/bridge/purchase" -H "Content-Type: application/json" -d '{"email":"user@gmail.com","planId":"plan_1m_10gb","inboundId":4}'`,
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
                  خرید اشتراک یا تغییر به این‌باند دلخواه (`inboundId`) و دریافت لینک VLESS آن این‌باند
                </p>
              </div>

              {/* Endpoint 4: Switch Server */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 font-bold rounded">POST</span>
                    <span className="text-slate-800 dark:text-slate-200">/api/bridge/switch-server</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `curl -X POST "${baseUrl}/api/bridge/switch-server" -H "Content-Type: application/json" -d '{"email":"user@gmail.com","inboundId":5}'`,
                        'curl_switch'
                      )
                    }
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedSection === 'curl_switch' ? 'کپی شد' : 'کپی cURL'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  سوییچ آنی کاربر بین این‌باندها و دریافت کانفیگ این‌باند جدید بدون کسر مجدد توکن
                </p>
              </div>

              {/* Endpoint 5: Servers List */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-500 font-bold rounded">GET</span>
                    <span className="text-slate-800 dark:text-slate-200">/api/bridge/servers</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`curl -s "${baseUrl}/api/bridge/servers"`, 'curl_srv')}
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedSection === 'curl_srv' ? 'کپی شد' : 'کپی cURL'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  دریافت لیست کلیه این‌باندها و سرورهای فعال پنل ثنایی برای نمایش در برنامه
                </p>
              </div>

              {/* Endpoint 6: Direct Config */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
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

            {/* Technical Guide Box */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                جزئیات کامل پیاده‌سازی و متدهای پرداخت (زیبال و کارت‌به‌کارت):
              </div>
              <pre
                dir="rtl"
                className="p-5 text-xs font-mono bg-slate-950 text-slate-200 rounded-xl overflow-x-auto max-h-[340px] leading-relaxed whitespace-pre-wrap select-all border border-slate-800"
              >
                {aiStudioPrompt}
              </pre>
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

      {/* TAB: REGISTERED APP USERS TABLE */}
      {activeTab === 'users' && (() => {
        const filteredUsers = users.filter((u) => {
          if (!userSearchQuery.trim()) return true;
          const q = userSearchQuery.trim().toLowerCase();
          return (
            u.email.toLowerCase().includes(q) ||
            u.id.toLowerCase().includes(q) ||
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.subscription?.planName && u.subscription.planName.toLowerCase().includes(q))
          );
        });

        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>بانک کاربران ثبت‌نام شده ({users.length} کاربر)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  مدیریت کاربران اپلیکیشن، مشاهده این‌باند فعال، کپی کانفیگ و امکان حذف کاربر
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="جستجوی ایمیل یا شناسه..."
                    className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none w-52"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchBridgeData}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>بروزرسانی</span>
                </button>
              </div>
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
                    <th className="py-3 px-4 text-left">عملیات و کانفیگ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        کاربری یافت نشد. می‌توانید در تب «شبیه‌ساز» یک کاربر تستی ایجاد کنید.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const sub = u.subscription;
                      const hasSub = sub && sub.status === 'active';
                      return (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                            <div>{u.email}</div>
                            <div className="text-[11px] text-slate-400 font-normal">ID: {u.id}</div>
                          </td>

                          <td className="py-3 px-4 font-mono tabular-nums font-bold text-amber-500">
                            {u.tokens.toLocaleString()} توکن
                          </td>

                          <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold">
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
                            {hasSub ? (
                              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                #{sub.inboundId} · {sub.inboundRemark} ({sub.inboundPort})
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {hasSub ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>متصل و فعال</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">ثبت اولیه</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-left">
                            <div className="flex items-center justify-end gap-2">
                              {hasSub && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(sub.configUri, u.id)}
                                  className="px-2.5 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-500/30 rounded-lg hover:bg-sky-500/20 transition-colors flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>{copiedSection === u.id ? 'کپی شد!' : 'کپی VLESS'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="p-1.5 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors"
                                title="حذف کامل کاربر"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

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
              <input
                type="number"
                placeholder="حداکثر مصرف"
                value={newGiftMaxUses}
                onChange={(e) => setNewGiftMaxUses(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 w-28"
                title="حداکثر تعداد دفعات مجاز استفاده"
              />
              <button
                type="button"
                onClick={handleCreateGiftCode}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>ساخت / بروزرسانی کد هدیه</span>
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
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNewGiftCode(g.code);
                        setNewGiftTokens(String(g.tokens));
                        setNewGiftMaxUses(String(g.maxUses || 500));
                      }}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-200 dark:bg-slate-700 rounded-lg transition-colors"
                      title="ویرایش کد هدیه"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(g.code, g.code)}
                      className="px-2.5 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-amber-500 hover:text-black transition-all flex items-center gap-1"
                    >
                      {copiedSection === g.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>کپی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGiftCode(g.code)}
                      className="p-1.5 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                      title="حذف کد هدیه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real Money Token Purchase with Zibal IPG Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 mb-1">
                  <Shield className="w-4 h-4" />
                  <span>درگاه پرداخت اینترنتی زیبال (Zibal IPG & Shaparak) و مدیریت بسته‌های کیف پول</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-sky-500" />
                  <span>مدیریت بسته‌های خرید توکن و تنظیمات درگاه زیبال</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  می‌توانید بسته‌های شارژ کیف پول (تعداد توکن، هدیه و مبلغ تومانی) را به دلخواه اضافه، ویرایش یا حذف کنید.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {paymentMsg && (
                  <div className="text-xs px-3.5 py-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    {paymentMsg}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleOpenAddWalletPkgModal}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ افزودن بسته کیف پول</span>
                </button>
              </div>
            </div>

            {/* Merchant Configuration Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">کد مرچنت درگاه زیبال (Merchant ID):</span>
                <input
                  type="text"
                  value={zibalMerchant}
                  onChange={(e) => setZibalMerchant(e.target.value)}
                  placeholder="کد مرچنت زیبال خود را وارد کنید (یا zibal برای تست)"
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 w-72"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateZibalSettings()}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-all shadow"
                >
                  ذخیره مرچنت
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateZibalSettings('zibal', '');
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition-colors"
                >
                  سوییچ به درگاه تستی (zibal)
                </button>
              </div>
            </div>

            {/* Callback URL Configuration & Zibal Domain Guide */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>تنظیم آدرس بازگشت درگاه (Callback URL):</span>
                </div>
                <span className="text-[11px] text-slate-400">قانون امنیتی شاپرک / زیبال (کد خطا: 106)</span>
              </div>

              <p className="text-xs text-amber-200/90 leading-relaxed">
                توجه: درگاه زیبال فقط به دامنه‌ای که در پنل کاربری زیبال ثبت کرده‌اید اجازه اتصال می‌دهد. در صورت خالی گذاشتن کادر زیر، آدرس سرور فعلی به صورت خودکار استفاده می‌شود.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <input
                  type="text"
                  value={zibalCallbackUrl}
                  onChange={(e) => setZibalCallbackUrl(e.target.value)}
                  placeholder={`${baseUrl}/api/bridge/payment/callback`}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 flex-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateZibalSettings()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow transition-all whitespace-nowrap"
                >
                  ذخیره آدرس بازگشت
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-400 text-[11px]">انتخاب سریع:</span>
                <button
                  type="button"
                  onClick={() => handleUpdateZibalSettings(undefined, `${baseUrl}/api/bridge/payment/callback`)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-[11px] font-mono transition-colors"
                >
                  {baseUrl}/api/bridge/payment/callback (آدرس فعلی پنل)
                </button>
              </div>
            </div>

            {/* Token Packages Display with Edit/Delete & Live Test Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {(walletPackages.length > 0 ? walletPackages : [
                { id: 'pack_100', tokens: 100, bonusTokens: 0, priceTomans: 10000, title: 'بسته ۱۰۰ توکن', isPopular: false },
                { id: 'pack_1000', tokens: 1000, bonusTokens: 0, priceTomans: 85000, title: 'بسته ۱۰۰۰ توکن', isPopular: false },
                { id: 'pack_2500', tokens: 2500, bonusTokens: 200, priceTomans: 195000, title: 'بسته ۲۵۰۰ توکن (+۲۰۰)', isPopular: true },
                { id: 'pack_5000', tokens: 5000, bonusTokens: 500, priceTomans: 380000, title: 'بسته ۵۰۰۰ توکن (+۵۰۰)', isPopular: false },
              ]).map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    pkg.id === 'pack_100'
                      ? 'bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border-emerald-500/50 ring-1 ring-emerald-500/30'
                      : pkg.isPopular
                      ? 'bg-sky-950/20 border-sky-500/50 ring-1 ring-sky-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{pkg.title}</span>
                      {pkg.isPopular && (
                        <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                          پیشنهادی
                        </span>
                      )}
                    </div>

                    <div className="text-2xl font-black font-mono text-amber-500 my-2 flex items-baseline gap-1.5">
                      <span>{pkg.tokens.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 font-normal">توکن</span>
                      {pkg.bonusTokens > 0 && (
                        <span className="text-[11px] text-emerald-400 font-bold">
                          (+{pkg.bonusTokens} هدیه)
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 font-mono">
                      {pkg.priceTomans.toLocaleString()} <span className="text-xs text-slate-400">تومان</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditWalletPkgModal(pkg)}
                        className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>ویرایش</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteWalletPkg(pkg.id, pkg.title)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                        title="حذف بسته"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={paymentTesting}
                      onClick={() => handleTestPayment(pkg.id)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 ${
                        pkg.id === 'pack_100'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                          : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>تست درگاه زیبال</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WALLET PACKAGE ADD / EDIT MODAL */}
          {isWalletPkgModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>{editingWalletPkg ? `ویرایش بسته «${editingWalletPkg.title}»` : 'ایجاد بسته شارژ کیف پول'}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsWalletPkgModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">عنوان بسته:</label>
                    <input
                      type="text"
                      value={walletPkgForm.title}
                      onChange={(e) => setWalletPkgForm({ ...walletPkgForm, title: e.target.value })}
                      placeholder="مثلاً بسته استاندارد ۱۰۰۰ توکن"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">تعداد توکن اصلی:</label>
                      <input
                        type="number"
                        value={walletPkgForm.tokens}
                        onChange={(e) => setWalletPkgForm({ ...walletPkgForm, tokens: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">توکن هدیه (Bonus):</label>
                      <input
                        type="number"
                        value={walletPkgForm.bonusTokens}
                        onChange={(e) => setWalletPkgForm({ ...walletPkgForm, bonusTokens: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">مبلغ قابل پرداخت (تومان):</label>
                    <input
                      type="number"
                      value={walletPkgForm.priceTomans}
                      onChange={(e) => setWalletPkgForm({ ...walletPkgForm, priceTomans: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isPkgPopularCheck"
                      checked={walletPkgForm.isPopular}
                      onChange={(e) => setWalletPkgForm({ ...walletPkgForm, isPopular: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-sky-500"
                    />
                    <label htmlFor="isPkgPopularCheck" className="text-xs text-slate-300 select-none">
                      نمایش برچسب «پیشنهادی» روی این بسته
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveWalletPkg}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>ذخیره بسته کیف پول</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWalletPkgModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CARD-TO-CARD & TELEGRAM BOT SYSTEM */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    سیستم پرداخت کارت به کارت (Card to Card) و تایید هوشمند از ربات تلگرام
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    کاربر در اپلیکیشن مبلغ را کارت‌به‌کارت می‌کند، تصویر فیش را می‌فرستد و عکس بلافاصله برای ربات تلگرام شما ارسال می‌شود تا با یک کلیک تایید یا رد کنید. با تایید شما، حساب کاربر فوراً شارژ می‌شود.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={cardToCardEnabled}
                    onChange={(e) => setCardToCardEnabled(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {cardToCardEnabled ? 'کارت به کارت فعال است' : 'کارت به کارت غیرفعال'}
                  </span>
                </label>
              </div>
            </div>

            {/* Bank Card Info Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">شماره کارت بانکی (۱۶ رقمی):</label>
                <div className="relative">
                  <input
                    type="text"
                    value={bankCardNumber}
                    onChange={(e) => setBankCardNumber(e.target.value)}
                    placeholder="مثلاً 6037997512345678"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankCardNumber, 'card_num')}
                    className="absolute left-2.5 top-2 text-slate-400 hover:text-purple-400 transition-colors"
                    title="کپی شماره کارت"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {copiedSection === 'card_num' && (
                  <span className="text-[10px] text-purple-400">شماره کارت کپی شد</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">نام و نام خانوادگی صاحب کارت:</label>
                <input
                  type="text"
                  value={bankCardOwner}
                  onChange={(e) => setBankCardOwner(e.target.value)}
                  placeholder="مثلاً علی محمدی"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">نام بانک:</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="مثلاً بانک ملی ایران"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Telegram Bot Configuration */}
            <div className="p-5 bg-gradient-to-br from-sky-500/10 via-slate-800/40 to-slate-900 border border-sky-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-sky-400">
                  <Bot className="w-4 h-4 text-sky-400" />
                  <span>اتصال به ربات تلگرام جهت ارسال فیش و دکمه‌های تایید آنی</span>
                </div>
                <span className="text-[11px] text-slate-400">تایید دوطرفه: هم از تلگرام و هم از همین پنل وب</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium flex items-center justify-between">
                    <span>توکن ربات تلگرام (Bot Token):</span>
                    <span className="text-[10px] text-slate-400">از @BotFather</span>
                  </label>
                  <input
                    type="text"
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                    placeholder="مثلاً 7123456789:AAHk..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium flex items-center justify-between">
                    <span>شناسه عددی چت ادمین (Admin Chat ID):</span>
                    <span className="text-[10px] text-slate-400">از @userinfobot</span>
                  </label>
                  <input
                    type="text"
                    value={telegramAdminChatId}
                    onChange={(e) => setTelegramAdminChatId(e.target.value)}
                    placeholder="مثلاً 542198765"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveCardAndTelegramSettings}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ذخیره تنظیمات کارت و تلگرام</span>
                  </button>

                  <button
                    type="button"
                    disabled={telegramTesting}
                    onClick={handleTestTelegram}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{telegramTesting ? 'در حال ارسال تست...' : 'تست اتصال به ربات تلگرام'}</span>
                  </button>
                </div>

                {telegramTestMsg && (
                  <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
                    {telegramTestMsg}
                  </div>
                )}
              </div>

              {/* Step by step guide */}
              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-sky-400">راهنمای ۱ دقیقه‌ای راه‌اندازی ربات تلگرام:</div>
                <div>۱. در تلگرام وارد ربات <strong>@BotFather</strong> شده و دستور <code>/newbot</code> را بفرستید و یک نام و آیدی برای ربات خود انتخاب نمایید تا <strong>HTTP API Token</strong> را تحویل دهد.</div>
                <div>۲. در تلگرام وارد ربات <strong>@userinfobot</strong> شوید تا عدد <strong>Id</strong> حساب خودتان را به شما بدهد و در کادر بالا وارد کنید.</div>
                <div>۳. وارد ربات اختصاصی که در مرحله ۱ ساختید شده و دکمه <strong>Start</strong> را بزنید، سپس دکمه «تست اتصال به ربات تلگرام» را در همین صفحه لمس کنید!</div>
              </div>
            </div>

            {/* User Receipts Table (Dual Approval: Telegram or Web Panel) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    رسیدهای پرداخت کارت به کارت ارسالی توسط کاربران
                  </h4>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-mono font-bold">
                    {cardOrders.filter((o) => o.status === 'pending').length} در انتظار تایید
                  </span>
                </div>

                <button
                  type="button"
                  onClick={fetchCardOrders}
                  className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                >
                  <Activity className="w-3 h-3" />
                  <span>بروزرسانی لیست فیش‌ها</span>
                </button>
              </div>

              {cardOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                  هنوز رسید پرداختی ثبت نشده است. با ارسال رسید از اپلیکیشن موبایل، عکس و مشخصات فیش فوراً در اینجا و در تلگرام شما ظاهر می‌شود.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="p-3">تصویر فیش</th>
                        <th className="p-3">مشخصات کاربر</th>
                        <th className="p-3">توکن / مبلغ</th>
                        <th className="p-3">تاریخ ثبت</th>
                        <th className="p-3">وضعیت</th>
                        <th className="p-3 text-center">عملیات مدیریت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                      {cardOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3">
                            {order.receiptImageUrl ? (
                              <button
                                type="button"
                                onClick={() => setViewingReceiptModal(order)}
                                className="relative group block w-14 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-900"
                              >
                                <img
                                  src={order.receiptImageUrl}
                                  alt="فیش واریزی"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </button>
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 text-center p-1">
                                بدون عکس
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{order.userName || 'کاربر'}</div>
                            <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{order.userEmail}</div>
                            {order.userNotes && (
                              <div className="text-[10px] text-purple-400 mt-1">یادداشت: {order.userNotes}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-amber-500 font-mono">{order.tokens.toLocaleString()} توکن</div>
                            <div className="text-[11px] text-slate-400 font-mono">{order.amountTomans.toLocaleString()} تومان</div>
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[11px]">
                            {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                            <div className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleTimeString('fa-IR')}</div>
                          </td>
                          <td className="p-3">
                            {order.status === 'pending' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                در انتظار بررسی
                              </span>
                            )}
                            {order.status === 'approved' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                تایید و شارژ شد ✅
                              </span>
                            )}
                            {order.status === 'rejected' && (
                              <div>
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  رد شد ❌
                                </span>
                                {order.rejectionReason && (
                                  <div className="text-[10px] text-rose-300 mt-1">{order.rejectionReason}</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {order.status === 'pending' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleReviewCardOrder(order.id, 'approve')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>تایید و شارژ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReviewCardOrder(order.id, 'reject')}
                                  className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>رد فیش</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500">بررسی شده</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT IMAGE VIEWER MODAL */}
      {viewingReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span>مشاهده تصویر فیش واریزی ({viewingReceiptModal.id})</span>
              </h4>
              <button
                type="button"
                onClick={() => setViewingReceiptModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewingReceiptModal.receiptImageUrl ? (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center max-h-[60vh]">
                <img
                  src={viewingReceiptModal.receiptImageUrl}
                  alt="فیش واریزی"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">عکسی همراه این فیش ارسال نشده است.</div>
            )}

            <div className="p-3 bg-slate-950 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>کاربر:</span>
                <span className="font-bold">{viewingReceiptModal.userName} ({viewingReceiptModal.userEmail})</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>مبلغ فیش:</span>
                <span className="font-bold text-emerald-400">{viewingReceiptModal.amountTomans.toLocaleString()} تومان ({viewingReceiptModal.tokens.toLocaleString()} توکن)</span>
              </div>
              {viewingReceiptModal.userNotes && (
                <div className="flex justify-between text-slate-300">
                  <span>یادداشت:</span>
                  <span className="text-purple-300">{viewingReceiptModal.userNotes}</span>
                </div>
              )}
            </div>

            {viewingReceiptModal.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const id = viewingReceiptModal.id;
                    setViewingReceiptModal(null);
                    handleReviewCardOrder(id, 'approve');
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>تایید و شارژ توکن</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = viewingReceiptModal.id;
                    setViewingReceiptModal(null);
                    handleReviewCardOrder(id, 'reject');
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>رد فیش واریزی</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


