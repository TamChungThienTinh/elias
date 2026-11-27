import {useCallback, useEffect, useMemo, useState} from 'react';
import {CHAPTERS} from './data/chapters';
import type {
  AppBackupPayload,
  MerchItem,
  ReaderProfile,
  ReaderSettings,
  ViewRoute,
} from './types';
import {estimateChapterSizeKb} from './utils/readerLogic';
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
import {LibraryView} from './components/LibraryView';
import {MerchModal} from './components/MerchModal';
import {VipCheckoutModal} from './components/VipCheckoutModal';

function parseHashRoute(): {route: ViewRoute; chapterId?: string} {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('doc/')) {
    const id = hash.slice(4);
    if (CHAPTERS.some((c) => c.id === id)) {
      return {route: 'reader', chapterId: id};
    }
  }
  if (hash === 'muc-luc' || hash === 'catalog') return {route: 'catalog'};
  if (hash === 'cua-hang' || hash === 'merch') return {route: 'merch'};
  if (hash === 'thu-vien' || hash === 'library') return {route: 'library'};
  return {route: 'home'};
}

export default function App() {
  const [persisted, setPersisted] = useState<PersistedState>(() =>
    loadPersistedState()
  );
  const initialRoute = parseHashRoute();
  const [route, setRoute] = useState<ViewRoute>(initialRoute.route);
  const [activeChapterId, setActiveChapterId] = useState<string>(
    initialRoute.chapterId ||
      persisted.progress?.chapterId ||
      CHAPTERS[0].id
  );
  const [selectedMerch, setSelectedMerch] = useState<MerchItem | null>(null);
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Đồng bộ lưu trạng thái vào localStorage
  useEffect(() => {
    savePersistedState(persisted);
  }, [persisted]);

  // Đồng bộ hash URL cho nút Back/Forward của trình duyệt (an toàn với GitHub Pages base './')
  useEffect(() => {
    const onHashChange = () => {
      const next = parseHashRoute();
      setRoute(next.route);
      if (next.chapterId) {
        setActiveChapterId(next.chapterId);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((nextRoute: ViewRoute, chapterId?: string) => {
    setRoute(nextRoute);
    if (nextRoute === 'reader' && chapterId) {
      setActiveChapterId(chapterId);
      window.location.hash = `#/doc/${chapterId}`;
    } else if (nextRoute === 'catalog') {
      window.location.hash = '#/muc-luc';
    } else if (nextRoute === 'merch') {
      window.location.hash = '#/cua-hang';
    } else if (nextRoute === 'library') {
      window.location.hash = '#/thu-vien';
    } else {
      window.location.hash = '#/';
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

  const handlePrimaryReadClick = useCallback(() => {
    const targetId = persisted.progress?.chapterId || CHAPTERS[0].id;
    openChapter(targetId);
  }, [persisted.progress?.chapterId, openChapter]);

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
    (chapterId: string) => {
      const exists = persisted.offlineChapters.some(
        (r) => r.chapterId === chapterId
      );
      const chapter = CHAPTERS.find((c) => c.id === chapterId);
      if (!chapter) return;

      setPersisted((prev) => ({
        ...prev,
        offlineChapters: exists
          ? prev.offlineChapters.filter((r) => r.chapterId !== chapterId)
          : [
              {
                chapterId,
                savedAt: new Date().toLocaleDateString('vi-VN'),
                sizeKb: estimateChapterSizeKb(chapter),
              },
              ...prev.offlineChapters,
            ],
      }));
      showToast(
        exists
          ? `Đã xóa Chương ${chapter.number} khỏi bộ nhớ ngoại tuyến.`
          : `Đã tải Chương ${chapter.number} để đọc ngoại tuyến.`
      );
    },
    [persisted.offlineChapters, showToast]
  );

  const handleDownloadAllOffline = useCallback(() => {
    const today = new Date().toLocaleDateString('vi-VN');
    setPersisted((prev) => ({
      ...prev,
      offlineChapters: CHAPTERS.map((ch) => ({
        chapterId: ch.id,
        savedAt: today,
        sizeKb: estimateChapterSizeKb(ch),
      })),
    }));
    showToast(`Đã lưu toàn bộ ${CHAPTERS.length} chương để đọc ngoại tuyến.`);
  }, [showToast]);

  const handleUpdateProfile = useCallback((patch: Partial<ReaderProfile>) => {
    setPersisted((prev) => ({
      ...prev,
      profile: {...prev.profile, ...patch},
    }));
  }, []);

  const handleImportBackup = useCallback(
    (payload: AppBackupPayload) => {
      setPersisted((prev) => ({
        ...prev,
        profile: payload.profile,
        settings: payload.settings,
        progress: payload.progress,
        readHistory: payload.readHistory,
        favorites: payload.favorites,
        offlineChapters: payload.offlineChapters,
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
            isVipBadge: prev.profile.isVip,
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

  const handleActivateVip = useCallback(
    (planName: string, displayName: string, contact: string) => {
      setPersisted((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          displayName,
          email: contact,
          isVip: true,
          vipPlan: planName,
          vipActivatedAt: new Date().toLocaleDateString('vi-VN'),
        },
      }));
      showToast(`Đã kích hoạt ${planName} — toàn bộ chương VIP đã mở khóa!`);
    },
    [showToast]
  );

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
    const title = 'Huyết Nguyệt Cố Đô — Chương mới đã phát hành';
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

  const backupPayload = useMemo(
    () => createBackupPayload(persisted),
    [persisted]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0D12] text-[#E6E3DC]">
      <Header
        currentRoute={route}
        progress={persisted.progress}
        onNavigate={(r) => navigate(r)}
        onPrimaryReadClick={handlePrimaryReadClick}
      />

      <main className="flex-1">
        {route === 'home' && (
          <HomeView
            progress={persisted.progress}
            readHistory={persisted.readHistory}
            favorites={persisted.favorites}
            isVip={persisted.profile.isVip}
            onStartFromBeginning={handleStartFromBeginning}
            onOpenChapter={openChapter}
            onNavigate={(r) => navigate(r)}
            onSelectMerch={setSelectedMerch}
          />
        )}

        {route === 'catalog' && (
          <CatalogView
            progress={persisted.progress}
            favorites={persisted.favorites}
            offlineChapters={persisted.offlineChapters}
            isVip={persisted.profile.isVip}
            onOpenChapter={openChapter}
            onToggleFavorite={handleToggleFavorite}
            onToggleOffline={handleToggleOffline}
            onDownloadAllOffline={handleDownloadAllOffline}
          />
        )}

        {route === 'reader' && (
          <ReaderView
            chapter={activeChapter}
            settings={persisted.settings}
            progress={persisted.progress}
            isFavorite={persisted.favorites.includes(activeChapter.id)}
            isOfflineSaved={persisted.offlineChapters.some(
              (r) => r.chapterId === activeChapter.id
            )}
            isVip={persisted.profile.isVip}
            defaultAuthorName={persisted.profile.displayName}
            comments={persisted.comments}
            likedCommentIds={persisted.likedCommentIds}
            onUpdateSettings={handleUpdateSettings}
            onSaveProgress={handleSaveProgress}
            onSelectChapter={openChapter}
            onBackToCatalog={() => navigate('catalog')}
            onToggleFavorite={handleToggleFavorite}
            onToggleOffline={handleToggleOffline}
            onOpenVipModal={() => setVipModalOpen(true)}
            onAddComment={handleAddComment}
            onToggleLikeComment={handleToggleLikeComment}
          />
        )}

        {route === 'merch' && <MerchView onSelectMerch={setSelectedMerch} />}

        {route === 'library' && (
          <LibraryView
            profile={persisted.profile}
            progress={persisted.progress}
            readHistory={persisted.readHistory}
            favorites={persisted.favorites}
            offlineChapters={persisted.offlineChapters}
            backupPayload={backupPayload}
            onOpenChapter={openChapter}
            onToggleFavorite={handleToggleFavorite}
            onToggleOffline={handleToggleOffline}
            onDownloadAllOffline={handleDownloadAllOffline}
            onUpdateProfile={handleUpdateProfile}
            onImportBackup={handleImportBackup}
            onTriggerNotificationTest={handleTriggerNotificationTest}
            onEnableNotifications={handleEnableNotifications}
            onOpenVipModal={() => setVipModalOpen(true)}
            onNotifyToast={showToast}
          />
        )}
      </main>

      {route !== 'reader' && <Footer onNavigate={(r) => navigate(r)} />}

      {/* Modals */}
      <MerchModal item={selectedMerch} onClose={() => setSelectedMerch(null)} />
      <VipCheckoutModal
        open={vipModalOpen}
        defaultName={persisted.profile.displayName}
        defaultEmail={persisted.profile.email}
        onClose={() => setVipModalOpen(false)}
        onActivateVip={handleActivateVip}
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
