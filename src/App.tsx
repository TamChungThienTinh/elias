import {useCallback, useEffect, useMemo, useState} from 'react';
import {CHAPTERS} from './data/chapters';
import {MERCH_ITEMS} from './data/merch';
import {isSupabaseConfigured, supabase} from './lib/supabase';
import {
  fetchSupabaseProfile,
  redeemVipCodeService,
  syncLibraryToSupabase,
} from './services/vipService';
import {
  clearOfflineContentCache,
  downloadChapterForOffline,
  hasCachedOfflineContent,
  removeOfflineChapterFromCache,
} from './services/offlineService';
import type {
  AppBackupPayload,
  AuthUser,
  MerchItem,
  OfflineChapterRecord,
  ReaderProfile,
  ReaderSettings,
  ViewRoute,
  VipRedeemResult,
} from './types';
import {
  calculateCartTotals,
  canUseOfflineDownload,
  isChapterVipCurrentlyLocked,
  isUserVipActive,
  shouldPurgeOfflineStorage,
} from './utils/readerLogic';
import {
  createBackupPayload,
  loadPersistedState,
  savePersistedState,
  type PersistedState,
} from './utils/storage';
import {Header} from './components/Header';
import {Footer} from './components/Footer';
import {HomeView} from './components/HomeView';
import {CatalogView} from './components/CatalogView';
import {ReaderView} from './components/ReaderView';
import {MerchView} from './components/MerchView';
import {LibraryView, type LibraryTab} from './components/LibraryView';
import {MerchModal} from './components/MerchModal';
import {CartDrawer} from './components/CartDrawer';
import {AuthModal} from './components/AuthModal';
import {VipGuideModal} from './components/VipGuideModal';
import {VipOfflineGateModal} from './components/VipOfflineGateModal';
import {buildRoutePath, parsePathnameRoute} from './utils/routing';

export default function App() {
  const [persisted, setPersisted] = useState<PersistedState>(() =>
    loadPersistedState()
  );
  const [initialRoute] = useState(() =>
    parsePathnameRoute(window.location.pathname, window.location.hash)
  );
  const [route, setRoute] = useState<ViewRoute>(initialRoute.route);
  const [activeChapterId, setActiveChapterId] = useState<string>(
    initialRoute.chapterId ||
      persisted.progress?.chapterId ||
      CHAPTERS[0].id
  );
  const [selectedMerch, setSelectedMerch] = useState<MerchItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [vipGuideOpen, setVipGuideOpen] = useState(false);
  const [offlineGateOpen, setOfflineGateOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | null>(null);
  const [requestedLibraryTab, setRequestedLibraryTab] =
    useState<LibraryTab | null>(null);
  const [focusVipInputSignal, setFocusVipInputSignal] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Đảm bảo tiêu đề tab trình duyệt luôn là "Huyết Án Đa Diện"
  useEffect(() => {
    document.title = 'Huyết Án Đa Diện';
  }, [route, activeChapterId]);

  // Đồng bộ lưu trạng thái vào localStorage
  useEffect(() => {
    savePersistedState(persisted);
  }, [persisted]);

  // Lắng nghe phiên đăng nhập Supabase thật (khi đã cấu hình VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const applySupabaseSession = async (
      sessionUser: {
        id: string;
        email?: string;
        app_metadata?: {provider?: string};
        user_metadata?: {
          full_name?: string;
          name?: string;
          display_name?: string;
          avatar_url?: string;
        };
      } | null
    ) => {
      if (!sessionUser) {
        clearOfflineContentCache();
        setPersisted((prev) => ({
          ...prev,
          authUser: null,
          offlineChapters: [],
          profile: {
            ...prev.profile,
            isVip: false,
            vipExpiresAt: null,
          },
        }));
        return;
      }

      const cloudProfile = await fetchSupabaseProfile(sessionUser.id);
      const fallbackName =
        sessionUser.user_metadata?.full_name ||
        sessionUser.user_metadata?.name ||
        sessionUser.user_metadata?.display_name ||
        (sessionUser.email ? sessionUser.email.split('@')[0] : 'Độc giả');

      const displayName = cloudProfile?.display_name || fallbackName;
      const avatarUrl =
        cloudProfile?.avatar_url || sessionUser.user_metadata?.avatar_url;

      const authUser: AuthUser = {
        id: sessionUser.id,
        email: sessionUser.email || cloudProfile?.email || '',
        displayName,
        avatarUrl,
        provider:
          sessionUser.app_metadata?.provider === 'google' ? 'google' : 'email',
      };

      const cloudVipValid = isUserVipActive(
        Boolean(cloudProfile?.is_vip),
        cloudProfile?.vip_expires_at ?? null
      );
      if (!cloudVipValid) {
        clearOfflineContentCache();
      }

      setPersisted((prev) => {
        const mergedHistory = Array.from(
          new Set([...(cloudProfile?.read_history || []), ...prev.readHistory])
        ).slice(0, 30);
        const mergedFavorites = Array.from(
          new Set([...(cloudProfile?.favorites || []), ...prev.favorites])
        );

        return {
          ...prev,
          authUser,
          readHistory: mergedHistory,
          favorites: mergedFavorites,
          offlineChapters: cloudVipValid ? prev.offlineChapters : [],
          profile: {
            ...prev.profile,
            displayName,
            email: authUser.email,
            avatarUrl,
            isVip: Boolean(cloudProfile?.is_vip),
            vipExpiresAt: cloudProfile?.vip_expires_at ?? null,
          },
        };
      });
    };

    supabase.auth.getSession().then(({data}) => {
      applySupabaseSession(data.session?.user ?? null);
    });

    const {data: listener} = supabase.auth.onAuthStateChange((_event, session) => {
      applySupabaseSession(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Tự động đồng bộ readHistory & favorites lên bảng profiles của Supabase khi user đã đăng nhập
  useEffect(() => {
    if (!isSupabaseConfigured || !persisted.authUser) return;
    const timer = window.setTimeout(() => {
      syncLibraryToSupabase({
        userId: persisted.authUser!.id,
        displayName: persisted.profile.displayName,
        readHistory: persisted.readHistory,
        favorites: persisted.favorites,
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [
    persisted.authUser,
    persisted.profile.displayName,
    persisted.readHistory,
    persisted.favorites,
  ]);

  // Đồng bộ History API sạch (/muc-luc, /thu-vien, /chuong/1) cho nút Back/Forward
  useEffect(() => {
    if (initialRoute.shouldReplaceCleanPath) {
      window.history.replaceState(
        {route: initialRoute.route, chapterId: initialRoute.chapterId},
        '',
        initialRoute.shouldReplaceCleanPath
      );
    }

    const onPopState = () => {
      const next = parsePathnameRoute(
        window.location.pathname,
        window.location.hash
      );
      setRoute(next.route);
      if (next.chapterId) {
        setActiveChapterId(next.chapterId);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [initialRoute]);

  const navigate = useCallback((nextRoute: ViewRoute, chapterId?: string) => {
    setRoute(nextRoute);
    if (nextRoute === 'reader' && chapterId) {
      setActiveChapterId(chapterId);
    }
    const nextPath = buildRoutePath(nextRoute, chapterId);
    if (window.location.pathname !== nextPath || window.location.hash !== '') {
      window.history.pushState(
        {route: nextRoute, chapterId},
        '',
        nextPath
      );
    }
    window.scrollTo({top: 0, behavior: 'auto'});
  }, []);

  const openChapter = useCallback(
    (chapterId: string) => {
      setPersisted((prev) => {
        const nextHistory = [
          chapterId,
          ...prev.readHistory.filter((id) => id !== chapterId),
        ].slice(0, 20);
        const sameChapter = prev.progress?.chapterId === chapterId;
        return {
          ...prev,
          readHistory: nextHistory,
          progress: sameChapter
            ? prev.progress
            : {
                chapterId,
                scrollPercent: 0,
                pageIndex: 0,
                updatedAt: new Date().toISOString(),
              },
        };
      });
      navigate('reader', chapterId);
    },
    [navigate]
  );

  const handleStartFromBeginning = useCallback(() => {
    openChapter(CHAPTERS[0].id);
  }, [openChapter]);

  const handleOpenAuthModal = useCallback((reason?: string) => {
    setAuthReason(reason || null);
    setAuthModalOpen(true);
  }, []);

  const handleEmailLogin = useCallback(
    async (email: string, password: string): Promise<{error?: string}> => {
      if (isSupabaseConfigured && supabase) {
        const {error} = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          return {
            error:
              error.message === 'Invalid login credentials'
                ? 'Email hoặc mật khẩu chưa chính xác.'
                : error.message,
          };
        }
        showToast('Đăng nhập thành công!');
        return {};
      }

      // Mock Mode đăng nhập nhanh khi chưa gắn Supabase thật
      const nameFromEmail = email.split('@')[0] || 'Độc giả';
      const displayName =
        nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      const mockUser: AuthUser = {
        id: `mock-${email.toLowerCase()}`,
        email,
        displayName,
        provider: 'mock',
      };
      setPersisted((prev) => ({
        ...prev,
        authUser: mockUser,
        profile: {
          ...prev.profile,
          displayName:
            prev.profile.email === email && prev.profile.displayName
              ? prev.profile.displayName
              : displayName,
          email,
        },
      }));
      showToast(`Chào mừng ${displayName} quay trở lại!`);
      return {};
    },
    [showToast]
  );

  const handleEmailSignUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string
    ): Promise<{error?: string; info?: string}> => {
      if (isSupabaseConfigured && supabase) {
        const {data, error} = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {full_name: displayName, display_name: displayName},
          },
        });
        if (error) {
          return {error: error.message};
        }
        if (!data.session) {
          return {
            info: 'Đăng ký thành công! Vui lòng kiểm tra hộp thư email để xác nhận tài khoản trước khi đăng nhập.',
          };
        }
        showToast(`Chào mừng ${displayName} gia nhập Huyết Nguyệt!`);
        return {};
      }

      // Mock Mode tạo tài khoản
      const mockUser: AuthUser = {
        id: `mock-${email.toLowerCase()}`,
        email,
        displayName,
        provider: 'mock',
      };
      setPersisted((prev) => ({
        ...prev,
        authUser: mockUser,
        profile: {
          ...prev.profile,
          displayName,
          email,
        },
      }));
      showToast(`Đã tạo tài khoản ${displayName} thành công!`);
      return {};
    },
    [showToast]
  );

  const handleGoogleLogin = useCallback(async (): Promise<{error?: string}> => {
    if (isSupabaseConfigured && supabase) {
      const {error} = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });
      if (error) {
        return {error: error.message};
      }
      return {};
    }

    // Mock Mode Google OAuth
    const mockUser: AuthUser = {
      id: 'mock-google-reader',
      email: 'docgia.thachuyen@gmail.com',
      displayName: 'Minh Quân',
      provider: 'google',
    };
    setPersisted((prev) => ({
      ...prev,
      authUser: mockUser,
      profile: {
        ...prev.profile,
        displayName: mockUser.displayName,
        email: mockUser.email,
      },
    }));
    showToast('Đã đăng nhập nhanh với Google (Chế độ thử nghiệm).');
    return {};
  }, [showToast]);

  const handleSignOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    clearOfflineContentCache();
    setPersisted((prev) => ({
      ...prev,
      authUser: null,
      offlineChapters: [],
      profile: {
        ...prev.profile,
        isVip: false,
        vipExpiresAt: null,
      },
    }));
    showToast('Đã đăng xuất và tự động dọn bộ nhớ chương ngoại tuyến.');
  }, [showToast]);

  const handleRedeemVipCode = useCallback(
    async (inputCode: string): Promise<VipRedeemResult> => {
      const result = await redeemVipCodeService({
        inputCode,
        authUser: persisted.authUser,
        currentIsVip: persisted.profile.isVip,
        currentVipExpiresAt: persisted.profile.vipExpiresAt,
        usedMockCodes: persisted.usedMockVipCodes,
      });

      if (result.success) {
        setPersisted((prev) => ({
          ...prev,
          usedMockVipCodes: result.redeemedCode
            ? Array.from(new Set([...prev.usedMockVipCodes, result.redeemedCode]))
            : prev.usedMockVipCodes,
          profile: {
            ...prev.profile,
            isVip: true,
            vipExpiresAt: result.vipExpiresAt ?? null,
            vipPlan:
              result.vipExpiresAt === null
                ? 'VIP Vĩnh viễn'
                : result.durationDays
                ? `VIP ${result.durationDays} ngày`
                : 'VIP',
            vipActivatedAt: new Date().toLocaleDateString('vi-VN'),
          },
        }));
        showToast(result.message);
      }

      return result;
    },
    [
      persisted.authUser,
      persisted.profile.isVip,
      persisted.profile.vipExpiresAt,
      persisted.usedMockVipCodes,
      showToast,
    ]
  );

  const handleAddToCart = useCallback(
    (item: MerchItem) => {
      if (item.status === 'het-hang') return;
      setPersisted((prev) => {
        const existing = prev.cart.find((c) => c.merchId === item.id);
        const nextCart = existing
          ? prev.cart.map((c) =>
              c.merchId === item.id ? {...c, quantity: c.quantity + 1} : c
            )
          : [...prev.cart, {merchId: item.id, quantity: 1}];
        return {...prev, cart: nextCart};
      });
      showToast(`Đã thêm "${item.name}" vào giỏ hàng.`);
    },
    [showToast]
  );

  const handleUpdateCartQuantity = useCallback(
    (merchId: string, delta: number) => {
      setPersisted((prev) => ({
        ...prev,
        cart: prev.cart
          .map((c) =>
            c.merchId === merchId ? {...c, quantity: c.quantity + delta} : c
          )
          .filter((c) => c.quantity > 0),
      }));
    },
    []
  );

  const handleRemoveCartItem = useCallback((merchId: string) => {
    setPersisted((prev) => ({
      ...prev,
      cart: prev.cart.filter((c) => c.merchId !== merchId),
    }));
  }, []);

  const handleClearCart = useCallback(() => {
    setPersisted((prev) => ({...prev, cart: []}));
    showToast('Đã xóa toàn bộ sản phẩm trong giỏ hàng.');
  }, [showToast]);

  const handleUpdateSettings = useCallback((patch: Partial<ReaderSettings>) => {
    setPersisted((prev) => ({
      ...prev,
      settings: {...prev.settings, ...patch},
    }));
  }, []);

  const handleSaveProgress = useCallback(
    (chapterId: string, scrollPercent: number, pageIndex: number) => {
      setPersisted((prev) => ({
        ...prev,
        progress: {
          chapterId,
          scrollPercent,
          pageIndex,
          updatedAt: new Date().toISOString(),
        },
        profile: prev.profile.autoBackupEnabled
          ? {
              ...prev.profile,
              lastBackupAt: new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : prev.profile,
      }));
    },
    []
  );

  const handleToggleFavorite = useCallback(
    (chapterId: string) => {
      const exists = persisted.favorites.includes(chapterId);
      setPersisted((prev) => ({
        ...prev,
        favorites: exists
          ? prev.favorites.filter((id) => id !== chapterId)
          : [chapterId, ...prev.favorites],
      }));
      showToast(
        exists
          ? 'Đã bỏ đánh dấu khỏi danh sách yêu thích.'
          : 'Đã lưu chương vào danh sách yêu thích.'
      );
    },
    [persisted.favorites, showToast]
  );

  const handleToggleOffline = useCallback(
    async (chapterId: string) => {
      // Kiểm tra bắt buộc quyền VIP còn hạn ở tầng dữ liệu trước khi gọi tải nội dung
      if (
        !canUseOfflineDownload(
          persisted.profile.isVip,
          persisted.profile.vipExpiresAt
        )
      ) {
        setOfflineGateOpen(true);
        return;
      }

      const exists = persisted.offlineChapters.some(
        (r) => r.chapterId === chapterId
      );
      const chapter = CHAPTERS.find((c) => c.id === chapterId);
      if (!chapter) return;

      if (exists) {
        removeOfflineChapterFromCache(chapterId);
        setPersisted((prev) => ({
          ...prev,
          offlineChapters: prev.offlineChapters.filter(
            (r) => r.chapterId !== chapterId
          ),
        }));
        showToast(`Đã xóa Chương ${chapter.number} khỏi bộ nhớ ngoại tuyến.`);
        return;
      }

      const downloaded = await downloadChapterForOffline({
        chapter,
        isVip: persisted.profile.isVip,
        vipExpiresAt: persisted.profile.vipExpiresAt,
      });

      if (!downloaded.allowed) {
        setOfflineGateOpen(true);
        return;
      }

      setPersisted((prev) => ({
        ...prev,
        offlineChapters: [
          {
            chapterId: downloaded.record.chapterId,
            savedAt: downloaded.record.savedAt,
            sizeKb: downloaded.record.sizeKb,
          },
          ...prev.offlineChapters.filter((r) => r.chapterId !== chapterId),
        ],
      }));
      showToast(`Đã tải Chương ${chapter.number} để đọc ngoại tuyến.`);
    },
    [
      persisted.offlineChapters,
      persisted.profile.isVip,
      persisted.profile.vipExpiresAt,
      showToast,
    ]
  );

  const handleDownloadAllOffline = useCallback(async () => {
    if (
      !canUseOfflineDownload(
        persisted.profile.isVip,
        persisted.profile.vipExpiresAt
      )
    ) {
      setOfflineGateOpen(true);
      return;
    }

    const records: OfflineChapterRecord[] = [];
    for (const ch of CHAPTERS) {
      const downloaded = await downloadChapterForOffline({
        chapter: ch,
        isVip: persisted.profile.isVip,
        vipExpiresAt: persisted.profile.vipExpiresAt,
      });
      if (!downloaded.allowed) {
        setOfflineGateOpen(true);
        return;
      }
      records.push({
        chapterId: downloaded.record.chapterId,
        savedAt: downloaded.record.savedAt,
        sizeKb: downloaded.record.sizeKb,
      });
    }

    setPersisted((prev) => ({
      ...prev,
      offlineChapters: records,
    }));
    showToast(`Đã lưu toàn bộ ${records.length} chương để đọc ngoại tuyến.`);
  }, [persisted.profile.isVip, persisted.profile.vipExpiresAt, showToast]);

  const handleUpdateProfile = useCallback((patch: Partial<ReaderProfile>) => {
    setPersisted((prev) => ({
      ...prev,
      authUser:
        prev.authUser && patch.displayName
          ? {...prev.authUser, displayName: patch.displayName}
          : prev.authUser,
      profile: {...prev.profile, ...patch},
    }));
  }, []);

  const handleImportBackup = useCallback(
    (payload: AppBackupPayload) => {
      const importedVipValid = isUserVipActive(
        payload.profile.isVip,
        payload.profile.vipExpiresAt
      );
      if (!importedVipValid) {
        clearOfflineContentCache();
      }
      setPersisted((prev) => ({
        ...prev,
        profile: payload.profile,
        settings: payload.settings,
        progress: payload.progress,
        readHistory: payload.readHistory,
        favorites: payload.favorites,
        offlineChapters: importedVipValid ? payload.offlineChapters : [],
        comments: payload.comments.length > 0 ? payload.comments : prev.comments,
      }));
      showToast('Đã khôi phục toàn bộ thư viện và tiến độ đọc thành công.');
    },
    [showToast]
  );

  const handleAddComment = useCallback(
    (chapterId: string, author: string, content: string) => {
      setPersisted((prev) => ({
        ...prev,
        profile: {...prev.profile, displayName: author},
        comments: [
          {
            id: `cmt-${Date.now()}`,
            chapterId,
            author,
            content,
            createdAt: new Date().toLocaleDateString('vi-VN'),
            likes: 0,
            isVipBadge: isUserVipActive(
              prev.profile.isVip,
              prev.profile.vipExpiresAt
            ),
          },
          ...prev.comments,
        ],
      }));
      showToast('Đã đăng bình luận của bạn.');
    },
    [showToast]
  );

  const handleToggleLikeComment = useCallback((commentId: string) => {
    setPersisted((prev) => {
      const exists = prev.likedCommentIds.includes(commentId);
      return {
        ...prev,
        likedCommentIds: exists
          ? prev.likedCommentIds.filter((id) => id !== commentId)
          : [...prev.likedCommentIds, commentId],
      };
    });
  }, []);

  const handleEnableNotifications = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await window.Notification.requestPermission();
        if (permission === 'granted') {
          handleUpdateProfile({notificationsEnabled: true});
          showToast('Đã bật thông báo đẩy trình duyệt cho chương mới.');
          return;
        }
      } catch {
        // Fallback sang thông báo nội trang
      }
    }
    handleUpdateProfile({notificationsEnabled: true});
    showToast('Đã bật chế độ thông báo chương mới ngay trên trang.');
  }, [handleUpdateProfile, showToast]);

  const handleTriggerNotificationTest = useCallback(() => {
    const latest = CHAPTERS[CHAPTERS.length - 1];
    const title = 'Huyết Án Đa Diện — Chương mới đã phát hành';
    const body = `Chương ${latest.number}: ${latest.title}`;

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      window.Notification.permission === 'granted'
    ) {
      try {
        new window.Notification(title, {body});
      } catch {
        // Bỏ qua nếu môi trường iframe chặn Notification constructor
      }
    }
    showToast(`Thông báo mới: ${body}`);
  }, [showToast]);

  const activeChapter = useMemo(
    () => CHAPTERS.find((c) => c.id === activeChapterId) || CHAPTERS[0],
    [activeChapterId]
  );

  const isVipActive = useMemo(
    () =>
      isUserVipActive(persisted.profile.isVip, persisted.profile.vipExpiresAt),
    [persisted.profile.isVip, persisted.profile.vipExpiresAt]
  );

  // Tự động dọn bộ nhớ ngoại tuyến ngay lập tức khi gói VIP hết hạn hoặc tài khoản không còn quyền VIP
  useEffect(() => {
    const enforceOfflineEntitlement = () => {
      const needsPurge =
        shouldPurgeOfflineStorage(
          persisted.profile.isVip,
          persisted.profile.vipExpiresAt,
          persisted.offlineChapters.length
        ) ||
        (!isUserVipActive(
          persisted.profile.isVip,
          persisted.profile.vipExpiresAt
        ) &&
          hasCachedOfflineContent());

      if (needsPurge) {
        clearOfflineContentCache();
        if (persisted.offlineChapters.length > 0) {
          setPersisted((prev) => ({
            ...prev,
            offlineChapters: [],
          }));
        }
      }
    };

    enforceOfflineEntitlement();
    const interval = window.setInterval(enforceOfflineEntitlement, 60_000);
    window.addEventListener('visibilitychange', enforceOfflineEntitlement);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('visibilitychange', enforceOfflineEntitlement);
    };
  }, [
    persisted.profile.isVip,
    persisted.profile.vipExpiresAt,
    persisted.offlineChapters.length,
  ]);

  const handleOpenVipTab = useCallback(() => {
    setRequestedLibraryTab('vip');
    navigate('library');
  }, [navigate]);

  const handleGoToRedeemInputFromGuide = useCallback(() => {
    setVipGuideOpen(false);
    setOfflineGateOpen(false);
    if (
      route === 'reader' &&
      isChapterVipCurrentlyLocked(activeChapter, isVipActive)
    ) {
      setFocusVipInputSignal((n) => n + 1);
      return;
    }
    setRequestedLibraryTab('vip');
    navigate('library');
    setFocusVipInputSignal((n) => n + 1);
  }, [route, activeChapter, isVipActive, navigate]);

  const backupPayload = useMemo(
    () => createBackupPayload(persisted),
    [persisted]
  );

  const cartTotals = useMemo(
    () => calculateCartTotals(persisted.cart, MERCH_ITEMS),
    [persisted.cart]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0D12] text-[#E6E3DC]">
      <Header
        currentRoute={route}
        cartCount={cartTotals.totalQuantity}
        authUser={persisted.authUser}
        isVipActive={isVipActive}
        onNavigate={(r) => navigate(r)}
        onOpenCart={() => setCartOpen(true)}
        onOpenAuthModal={() => handleOpenAuthModal()}
        onOpenVipTab={handleOpenVipTab}
        onSignOut={handleSignOut}
      />

      <main className="flex-1">
        {route === 'home' && (
          <HomeView
            progress={persisted.progress}
            readHistory={persisted.readHistory}
            favorites={persisted.favorites}
            isVip={isVipActive}
            notificationsEnabled={persisted.profile.notificationsEnabled}
            onStartFromBeginning={handleStartFromBeginning}
            onOpenChapter={openChapter}
            onNavigate={(r) => navigate(r)}
            onSelectMerch={setSelectedMerch}
            onAddToCart={handleAddToCart}
            onOpenVipModal={() => setVipGuideOpen(true)}
            onEnableNotifications={handleEnableNotifications}
          />
        )}

        {route === 'catalog' && (
          <CatalogView
            progress={persisted.progress}
            readHistory={persisted.readHistory}
            favorites={persisted.favorites}
            offlineChapters={isVipActive ? persisted.offlineChapters : []}
            isVip={isVipActive}
            onOpenChapter={openChapter}
            onToggleFavorite={handleToggleFavorite}
            onToggleOffline={handleToggleOffline}
            onDownloadAllOffline={handleDownloadAllOffline}
            onOpenVipActivation={handleGoToRedeemInputFromGuide}
            onOpenVipGuide={() => setVipGuideOpen(true)}
          />
        )}

        {route === 'reader' && (
          <ReaderView
            chapter={activeChapter}
            settings={persisted.settings}
            progress={persisted.progress}
            authUser={persisted.authUser}
            isFavorite={persisted.favorites.includes(activeChapter.id)}
            isOfflineSaved={
              isVipActive &&
              persisted.offlineChapters.some(
                (r) => r.chapterId === activeChapter.id
              )
            }
            isVip={isVipActive}
            focusVipInputSignal={focusVipInputSignal}
            defaultAuthorName={
              persisted.authUser?.displayName || persisted.profile.displayName
            }
            comments={persisted.comments}
            likedCommentIds={persisted.likedCommentIds}
            onUpdateSettings={handleUpdateSettings}
            onSaveProgress={handleSaveProgress}
            onSelectChapter={openChapter}
            onBackToCatalog={() => navigate('catalog')}
            onToggleFavorite={handleToggleFavorite}
            onToggleOffline={handleToggleOffline}
            onOpenAuthModal={handleOpenAuthModal}
            onOpenVipGuideModal={() => setVipGuideOpen(true)}
            onRedeemVipCode={handleRedeemVipCode}
            onAddComment={handleAddComment}
            onToggleLikeComment={handleToggleLikeComment}
          />
        )}

        {route === 'merch' && (
          <MerchView
            onSelectMerch={setSelectedMerch}
            onAddToCart={handleAddToCart}
          />
        )}

        {route === 'library' && (
          <LibraryView
            authUser={persisted.authUser}
            profile={persisted.profile}
            progress={persisted.progress}
            readHistory={persisted.readHistory}
            favorites={persisted.favorites}
            offlineChapters={persisted.offlineChapters}
            backupPayload={backupPayload}
            requestedTab={requestedLibraryTab}
            focusVipInputSignal={focusVipInputSignal}
            onConsumeRequestedTab={() => setRequestedLibraryTab(null)}
            onOpenChapter={openChapter}
            onNavigate={(r) => navigate(r)}
            onToggleFavorite={handleToggleFavorite}
            onToggleOffline={handleToggleOffline}
            onDownloadAllOffline={handleDownloadAllOffline}
            onUpdateProfile={handleUpdateProfile}
            onImportBackup={handleImportBackup}
            onTriggerNotificationTest={handleTriggerNotificationTest}
            onEnableNotifications={handleEnableNotifications}
            onOpenAuthModal={handleOpenAuthModal}
            onSignOut={handleSignOut}
            onOpenVipGuideModal={() => setVipGuideOpen(true)}
            onRedeemVipCode={handleRedeemVipCode}
            onNotifyToast={showToast}
          />
        )}
      </main>

      {route !== 'reader' && <Footer onNavigate={(r) => navigate(r)} />}

      {/* Modals & Drawers */}
      <MerchModal
        item={selectedMerch}
        onClose={() => setSelectedMerch(null)}
        onAddToCart={handleAddToCart}
      />
      <CartDrawer
        open={cartOpen}
        cart={persisted.cart}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onBrowseMerch={() => navigate('merch')}
        onNotifyToast={showToast}
      />
      <AuthModal
        open={authModalOpen}
        reasonMessage={authReason}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthReason(null);
        }}
        onEmailLogin={handleEmailLogin}
        onEmailSignUp={handleEmailSignUp}
        onGoogleLogin={handleGoogleLogin}
      />
      <VipGuideModal
        open={vipGuideOpen}
        authUser={persisted.authUser}
        onClose={() => setVipGuideOpen(false)}
        onGoToRedeemInput={handleGoToRedeemInputFromGuide}
        onNotifyToast={showToast}
      />
      <VipOfflineGateModal
        open={offlineGateOpen}
        onClose={() => setOfflineGateOpen(false)}
        onActivateCode={handleGoToRedeemInputFromGuide}
        onOpenVipGuide={() => {
          setOfflineGateOpen(false);
          setVipGuideOpen(true);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-lg bg-[#1A1F2B] border border-[#C69B53]/45 text-xs sm:text-sm font-medium text-[#F5F1E8] shadow-xl"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
