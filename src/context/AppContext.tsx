import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../lib/firebase.ts';
import {
  DUMMY_ALL_USERS,
  DUMMY_AUDIT_LOGS,
  DUMMY_CART,
  DUMMY_FAVORITES,
  DUMMY_FINANCIAL_TX,
  DUMMY_INVENTORY_MOVEMENTS,
  DUMMY_MARKETING_CONTENTS,
  DUMMY_MENTORING_SESSIONS,
  DUMMY_NOTIFICATIONS,
  DUMMY_ORDERS,
  DUMMY_PROFILES,
  DUMMY_ROUTINE_IDS,
  DUMMY_STORE_CHATS,
  DUMMY_TRAINING_REGISTRATIONS,
  DUMMY_USER_POINTS,
  DUMMY_VOUCHER_REDEMPTIONS,
  INITIAL_CATEGORIES,
  INITIAL_GAMES,
  INITIAL_MATERIALS,
  INITIAL_MENTORS,
  INITIAL_NEWS_ARTICLES,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_ROUTINE_COACHING,
  INITIAL_SETTINGS,
  INITIAL_STORES,
  INITIAL_TRAININGS,
  INITIAL_VERIFICATION_HISTORY,
  INITIAL_VERIFICATIONS,
  INITIAL_VOUCHERS,
  INITIAL_WEBINARS,
} from '../lib/seedData.ts';
import { generateSha256Hex } from '../lib/utils.ts';
import type {
  AiConversation,
  AppNotification,
  AuditLog,
  BChainStatus,
  BEduNewsArticle,
  BEduWebinar,
  CartItem,
  Category,
  ContentStatus,
  EducationalGame,
  Favorite,
  FinancialTransaction,
  InventoryMovement,
  LearningMaterial,
  MarketingContent,
  Mentor,
  MentoringSession,
  Order,
  OrderStatus,
  Product,
  ProductVerification,
  Review,
  RoutineCoachingSchedule,
  StoreChatMessage,
  SystemSetting,
  TrainingProgram,
  TrainingRegistration,
  UmkmStore,
  UserPoint,
  UserProfile,
  UserRole,
  VerificationHistoryItem,
  Voucher,
  VoucherRedemption,
} from '../types.ts';

const ADMIN_EMAIL = '24080574281@mhs.unesa.ac.id';

interface AppContextValue {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  isDemoMode: boolean;
  isAuthenticated: boolean;
  activeUid: string | null;
  authLoading: boolean;
  activePortal: UserRole;
  setActivePortal: (portal: UserRole) => void;
  isAdminAccount: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Catalog & Public Data
  stores: UmkmStore[];
  categories: Category[];
  products: Product[];
  reviews: Review[];
  verifications: ProductVerification[];
  verificationHistory: VerificationHistoryItem[];
  games: EducationalGame[];
  vouchers: Voucher[];
  trainings: TrainingProgram[];
  mentors: Mentor[];
  routineCoaching: RoutineCoachingSchedule[];
  registeredRoutineIds: string[];
  materials: LearningMaterial[];
  webinars: BEduWebinar[];
  registeredWebinarIds: string[];
  newsArticles: BEduNewsArticle[];
  readNewsIds: string[];
  savedNewsIds: string[];
  settings: SystemSetting;

  // User & Store Scoped Data
  favorites: Favorite[];
  cart: CartItem[];
  orders: Order[];
  aiConversations: AiConversation[];
  marketingContents: MarketingContent[];
  financialTransactions: FinancialTransaction[];
  inventoryMovements: InventoryMovement[];
  userPoints: UserPoint[];
  voucherRedemptions: VoucherRedemption[];
  trainingRegistrations: TrainingRegistration[];
  mentoringSessions: MentoringSession[];
  notifications: AppNotification[];
  storeChats: StoreChatMessage[];

  // Admin Data
  allUsers: UserProfile[];
  allOrders: Order[];
  auditLogs: AuditLog[];

  // Demo & Auth Actions
  enterDemoMode: (role: UserRole, storeId?: string) => void;
  switchDemoStore: (storeId: string) => void;
  resetDemoData: () => void;
  signInWithGoogle: (
    selectedRole: UserRole,
    extra?: {
      displayName?: string;
      phone?: string;
      storeIdToClaim?: string;
      newStoreName?: string;
      newStoreCategory?: string;
    }
  ) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleFavorite: (productId: string) => Promise<void>;
  addToCart: (product: Product, qty?: number) => Promise<void>;
  updateCartQty: (productId: string, qty: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  placeOrder: (payload: {
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    paymentMethod: string;
    voucherRedemptionId?: string;
  }) => Promise<Order | null>;
  submitReview: (
    productId: string,
    storeId: string,
    rating: number,
    comment: string,
    photoUrl?: string | null
  ) => Promise<void>;

  // UMKM Actions
  claimStore: (storeId: string) => Promise<void>;
  createStore: (data: Partial<UmkmStore>) => Promise<UmkmStore | null>;
  updateStore: (storeId: string, updates: Partial<UmkmStore>) => Promise<void>;
  saveProduct: (
    product: Partial<Product> & { name: string; storeId: string; storeName: string; category: string }
  ) => Promise<string | null>;
  removeProduct: (productId: string) => Promise<void>;
  adjustInventory: (product: Product, type: 'IN' | 'OUT', qty: number, note: string) => Promise<void>;
  submitToBChain: (
    product: Product,
    details: {
      productCode: string;
      batchNumber: string;
      productionDate: string;
      shelfLife: string;
      expiryDate: string;
      legalityInfo: string;
    }
  ) => Promise<void>;
  saveMarketingContent: (
    content: Partial<MarketingContent> & {
      storeId: string;
      title: string;
      channel: MarketingContent['channel'];
      caption: string;
      headline: string;
      cta: string;
      scheduledDate: string;
      status: ContentStatus;
    }
  ) => Promise<void>;
  updateMarketingStatus: (id: string, status: ContentStatus) => Promise<void>;
  deleteMarketingContent: (id: string) => Promise<void>;
  addFinancialTx: (tx: Omit<FinancialTransaction, 'id' | 'ownerUid' | 'createdAt'>) => Promise<void>;
  deleteFinancialTx: (id: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;

  // B-EDU Actions
  completeQuizGame: (game: EducationalGame, correctCount: number) => Promise<number>;
  claimDailyStreak: () => Promise<{ pointsEarned: number; streakCount: number; alreadyClaimed: boolean }>;
  crackEggReward: () => Promise<{
    type: 'points' | 'voucher';
    title: string;
    subtitle: string;
    amount?: number;
    voucherCode?: string;
  } | null>;
  redeemVoucher: (voucher: Voucher) => Promise<VoucherRedemption | null>;
  registerTraining: (program: TrainingProgram) => Promise<void>;
  registerRoutineCoaching: (schedule: RoutineCoachingSchedule) => Promise<void>;
  registerWebinar: (webinar: BEduWebinar) => Promise<void>;
  markNewsRead: (article: BEduNewsArticle) => Promise<void>;
  toggleSaveNews: (articleId: string) => void;
  bookMentoring: (mentor: Mentor, topic: string, requestedDate: string) => Promise<void>;

  // AI Conversation persistence
  saveAiConversation: (conv: AiConversation) => Promise<void>;

  // Direct In-App Store Chat (Customer <-> UMKM)
  sendStoreChatMessage: (payload: {
    storeId: string;
    storeName: string;
    customerUid: string;
    customerName: string;
    productId?: string | null;
    productName?: string | null;
    senderRole: 'customer' | 'umkm';
    text: string;
  }) => Promise<void>;

  // Notifications
  markNotificationRead: (notifId: string) => Promise<void>;

  // Admin Actions
  verifyBChainRecord: (verification: ProductVerification, status: BChainStatus, note: string) => Promise<void>;
  saveCategory: (category: Partial<Category> & { name: string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  saveGame: (game: EducationalGame) => Promise<void>;
  saveVoucher: (voucher: Voucher) => Promise<void>;
  saveTraining: (training: TrainingProgram) => Promise<void>;
  saveMentor: (mentor: Mentor) => Promise<void>;
  saveMaterial: (material: LearningMaterial) => Promise<void>;
  saveSystemSettings: (settings: SystemSetting) => Promise<void>;
  adminUpdateUserRole: (uid: string, role: UserRole) => Promise<void>;
  adminToggleStoreVerification: (storeId: string, verified: boolean) => Promise<void>;
  seedInitialDataToFirestore: (forceRefresh?: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(DUMMY_PROFILES.customer);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [activePortal, setActivePortal] = useState<UserRole>('customer');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Public & Demo datasets initialized with rich realistic dummy data immediately
  const [stores, setStores] = useState<UmkmStore[]>(INITIAL_STORES);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [verifications, setVerifications] = useState<ProductVerification[]>(INITIAL_VERIFICATIONS);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistoryItem[]>(INITIAL_VERIFICATION_HISTORY);
  const [games, setGames] = useState<EducationalGame[]>(INITIAL_GAMES);
  const [vouchers, setVouchers] = useState<Voucher[]>(INITIAL_VOUCHERS);
  const [trainings, setTrainings] = useState<TrainingProgram[]>(INITIAL_TRAININGS);
  const [mentors, setMentors] = useState<Mentor[]>(INITIAL_MENTORS);
  const [routineCoaching, setRoutineCoaching] = useState<RoutineCoachingSchedule[]>(INITIAL_ROUTINE_COACHING);
  const [registeredRoutineIds, setRegisteredRoutineIds] = useState<string[]>(DUMMY_ROUTINE_IDS);
  const [materials, setMaterials] = useState<LearningMaterial[]>(INITIAL_MATERIALS);
  const [webinars, setWebinars] = useState<BEduWebinar[]>(INITIAL_WEBINARS);
  const [registeredWebinarIds, setRegisteredWebinarIds] = useState<string[]>(['web-01']);
  const [newsArticles] = useState<BEduNewsArticle[]>(INITIAL_NEWS_ARTICLES);
  const [readNewsIds, setReadNewsIds] = useState<string[]>([]);
  const [savedNewsIds, setSavedNewsIds] = useState<string[]>(['news-01']);
  const [settings, setSettings] = useState<SystemSetting>(INITIAL_SETTINGS);

  // Authenticated / Demo datasets
  const [favorites, setFavorites] = useState<Favorite[]>(DUMMY_FAVORITES);
  const [cart, setCart] = useState<CartItem[]>(DUMMY_CART);
  const [orders, setOrders] = useState<Order[]>(
    DUMMY_ORDERS.filter((o) => o.customerUid === DUMMY_PROFILES.customer.uid)
  );
  const [aiConversations, setAiConversations] = useState<AiConversation[]>([]);
  const [marketingContents, setMarketingContents] = useState<MarketingContent[]>(DUMMY_MARKETING_CONTENTS);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(DUMMY_FINANCIAL_TX);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(DUMMY_INVENTORY_MOVEMENTS);
  const [userPoints, setUserPoints] = useState<UserPoint[]>(DUMMY_USER_POINTS);
  const [voucherRedemptions, setVoucherRedemptions] = useState<VoucherRedemption[]>(DUMMY_VOUCHER_REDEMPTIONS);
  const [trainingRegistrations, setTrainingRegistrations] = useState<TrainingRegistration[]>(DUMMY_TRAINING_REGISTRATIONS);
  const [mentoringSessions, setMentoringSessions] = useState<MentoringSession[]>(DUMMY_MENTORING_SESSIONS);
  const [notifications, setNotifications] = useState<AppNotification[]>(DUMMY_NOTIFICATIONS);
  const [storeChats, setStoreChats] = useState<StoreChatMessage[]>(DUMMY_STORE_CHATS);

  // Admin datasets
  const [allUsers, setAllUsers] = useState<UserProfile[]>(DUMMY_ALL_USERS);
  const [allOrders, setAllOrders] = useState<Order[]>(DUMMY_ORDERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(DUMMY_AUDIT_LOGS);

  const isAuthenticated = Boolean(firebaseUser) || isDemoMode;
  const activeUid = firebaseUser?.uid || (isDemoMode ? userProfile?.uid || 'demo-customer-01' : null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3800);
  }, []);

  const isAdminAccount = useMemo(() => {
    if (firebaseUser) {
      return firebaseUser.email === ADMIN_EMAIL || userProfile?.role === 'admin';
    }
    return isDemoMode && userProfile?.role === 'admin';
  }, [firebaseUser, isDemoMode, userProfile]);

  const enterDemoMode = useCallback(
    (role: UserRole, storeId?: string) => {
      setIsDemoMode(true);
      const base = { ...DUMMY_PROFILES[role] };
      if (role === 'umkm') {
        const pickedStore = stores.find((s) => s.id === (storeId || base.managedStoreId)) || stores[0];
        base.managedStoreId = pickedStore?.id || 'botega';
        base.displayName = pickedStore ? `${pickedStore.ownerName || 'Pemilik'} (${pickedStore.name})` : base.displayName;
      }
      setUserProfile(base);
      setActivePortal(role);
      showToast(
        `Mode Demo APK aktif sebagai ${
          role === 'customer' ? 'Customer' : role === 'umkm' ? 'UMKM Binaan' : 'Administrator'
        }`,
        'success'
      );
    },
    [stores, showToast]
  );

  const switchDemoStore = useCallback(
    (storeId: string) => {
      const store = stores.find((s) => s.id === storeId);
      if (!store) return;
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              managedStoreId: storeId,
              displayName: `${store.ownerName || 'Pemilik'} (${store.name})`,
            }
          : prev
      );
      showToast(`Beralih mengelola toko ${store.name}`, 'info');
    },
    [stores, showToast]
  );

  const resetDemoData = useCallback(() => {
    setStores(INITIAL_STORES);
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    setReviews(INITIAL_REVIEWS);
    setVerifications(INITIAL_VERIFICATIONS);
    setVerificationHistory(INITIAL_VERIFICATION_HISTORY);
    setGames(INITIAL_GAMES);
    setVouchers(INITIAL_VOUCHERS);
    setTrainings(INITIAL_TRAININGS);
    setMentors(INITIAL_MENTORS);
    setRoutineCoaching(INITIAL_ROUTINE_COACHING);
    setRegisteredRoutineIds(DUMMY_ROUTINE_IDS);
    setMaterials(INITIAL_MATERIALS);
    setWebinars(INITIAL_WEBINARS);
    setRegisteredWebinarIds(['web-01']);
    setReadNewsIds([]);
    setSavedNewsIds(['news-01']);
    setSettings(INITIAL_SETTINGS);
    setFavorites(DUMMY_FAVORITES);
    setCart(DUMMY_CART);
    setOrders(DUMMY_ORDERS.filter((o) => o.customerUid === DUMMY_PROFILES.customer.uid));
    setMarketingContents(DUMMY_MARKETING_CONTENTS);
    setFinancialTransactions(DUMMY_FINANCIAL_TX);
    setInventoryMovements(DUMMY_INVENTORY_MOVEMENTS);
    setUserPoints(DUMMY_USER_POINTS);
    setVoucherRedemptions(DUMMY_VOUCHER_REDEMPTIONS);
    setTrainingRegistrations(DUMMY_TRAINING_REGISTRATIONS);
    setMentoringSessions(DUMMY_MENTORING_SESSIONS);
    setNotifications(DUMMY_NOTIFICATIONS);
    setStoreChats(DUMMY_STORE_CHATS);
    setAllUsers(DUMMY_ALL_USERS);
    setAllOrders(DUMMY_ORDERS);
    setAuditLogs(DUMMY_AUDIT_LOGS);
    showToast('Data dummy APK berhasil direset ke kondisi awal.', 'success');
  }, [showToast]);

  const writeAuditLog = useCallback(
    async (action: string, targetType: string, targetId: string, details: string) => {
      const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const logEntry: AuditLog = {
        id,
        actorUid: auth.currentUser?.uid || activeUid || 'demo-actor',
        actorName: userProfile?.displayName || auth.currentUser?.displayName || 'Pengguna',
        actorRole: userProfile?.role || 'customer',
        action,
        targetType,
        targetId,
        details,
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => [logEntry, ...prev]);
      if (!auth.currentUser) return;
      try {
        await setDoc(doc(db, 'auditLogs', id), logEntry);
      } catch {
        // Non-blocking audit log write
      }
    },
    [userProfile, activeUid]
  );

  const pushNotification = useCallback(
    async (userId: string, title: string, message: string, type = 'info') => {
      if (!userId) return;
      const id = `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: AppNotification = {
        id,
        userId,
        title,
        message,
        type,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      if (!auth.currentUser || userId === activeUid) {
        setNotifications((prev) => [item, ...prev]);
      }
      if (!auth.currentUser) return;
      try {
        await setDoc(doc(db, 'notifications', id), item);
      } catch {
        // Non-blocking notification
      }
    },
    [activeUid]
  );

  const firebaseUserRef = useRef<User | null>(null);
  useEffect(() => {
    firebaseUserRef.current = firebaseUser;
  }, [firebaseUser]);

  const seedInitialDataToFirestore = useCallback(async (forceRefresh = false) => {
    if (!auth.currentUser) return;
    try {
      const [prodSnap, storeSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'umkmStores')),
      ]);
      const existingProdIds = new Set(prodSnap.docs.map((d) => d.id));
      const existingStoreIds = new Set(storeSnap.docs.map((d) => d.id));
      const hasAllCatalogProducts = INITIAL_PRODUCTS.every((p) => {
        if (!existingProdIds.has(p.id)) return false;
        const docData = prodSnap.docs.find((d) => d.id === p.id)?.data();
        return Boolean(docData?.photoUrl && docData?.videoUrl);
      });
      const hasAllStoresWithPhotos = INITIAL_STORES.every((s) => {
        if (!existingStoreIds.has(s.id)) return false;
        const docData = storeSnap.docs.find((d) => d.id === s.id)?.data();
        return Boolean(docData?.photoUrl);
      });

      const needsRichSeed =
        forceRefresh ||
        prodSnap.empty ||
        !hasAllCatalogProducts ||
        !hasAllStoresWithPhotos;

      if (needsRichSeed && auth.currentUser.email === ADMIN_EMAIL) {
        for (const s of INITIAL_STORES) {
          await setDoc(doc(db, 'umkmStores', s.id), s);
        }
        for (const c of INITIAL_CATEGORIES) {
          await setDoc(doc(db, 'categories', c.id), c);
        }
        for (const p of INITIAL_PRODUCTS) {
          await setDoc(doc(db, 'products', p.id), p);
        }
        for (const v of INITIAL_VERIFICATIONS) {
          await setDoc(doc(db, 'productVerifications', v.id), v);
        }
        for (const vh of INITIAL_VERIFICATION_HISTORY) {
          await setDoc(doc(db, 'verificationHistory', vh.id), {
            ...vh,
            actorUid: auth.currentUser.uid,
          });
        }
        for (const r of INITIAL_REVIEWS) {
          await setDoc(doc(db, 'reviews', r.id), {
            ...r,
            userId: auth.currentUser.uid,
          });
        }
        for (const g of INITIAL_GAMES) await setDoc(doc(db, 'educationalGames', g.id), g);
        for (const v of INITIAL_VOUCHERS) await setDoc(doc(db, 'vouchers', v.id), v);
        for (const t of INITIAL_TRAININGS) await setDoc(doc(db, 'trainingPrograms', t.id), t);
        for (const m of INITIAL_MENTORS) await setDoc(doc(db, 'mentors', m.id), m);
        for (const mat of INITIAL_MATERIALS) await setDoc(doc(db, 'learningMaterials', mat.id), mat);
        await setDoc(doc(db, 'systemSettings', 'global'), INITIAL_SETTINGS);
      }
    } catch (err) {
      console.warn('Seed check notice:', err);
    }
  }, []);

  // Test connection & subscribe to public collections when logged into Firebase
  useEffect(() => {
    testFirestoreConnection();

    const initialStoreMap = new Map(INITIAL_STORES.map((s) => [s.id, s]));
    const initialProductMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
    const initialReviewMap = new Map(INITIAL_REVIEWS.map((r) => [r.id, r]));

    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(collection(db, 'umkmStores'), (snap) => {
        if (!firebaseUserRef.current || snap.empty) return;
        const list = snap.docs.map((d) => {
          const raw = { id: d.id, ...(d.data() as Omit<UmkmStore, 'id'>) };
          const fallback = initialStoreMap.get(d.id);
          return fallback
            ? {
                ...fallback,
                ...raw,
                photoUrl: raw.photoUrl || fallback.photoUrl,
                foundedYear: raw.foundedYear || fallback.foundedYear,
                foundingStory: raw.foundingStory || fallback.foundingStory,
                milestones: raw.milestones && raw.milestones.length > 0 ? raw.milestones : fallback.milestones,
              }
            : raw;
        });
        const mergedIds = new Set(list.map((s) => s.id));
        const missingInitialStores = INITIAL_STORES.filter((s) => !mergedIds.has(s.id));
        if (list.some((s) => s.city !== null || s.photoUrl !== null)) {
          setStores([...list, ...missingInitialStores]);
        }
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'categories'), (snap) => {
        if (!firebaseUserRef.current || snap.empty) return;
        setCategories(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) })));
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'products'), (snap) => {
        if (!firebaseUserRef.current || snap.empty) return;
        const list = snap.docs.map((d) => {
          const raw = { id: d.id, ...(d.data() as Omit<Product, 'id'>) };
          const fallback = initialProductMap.get(d.id);
          return fallback
            ? {
                ...fallback,
                ...raw,
                photoUrl: raw.photoUrl || fallback.photoUrl,
                videoUrl: raw.videoUrl || fallback.videoUrl,
                videoTitle: raw.videoTitle || fallback.videoTitle,
              }
            : raw;
        });
        const mergedIds = new Set(list.map((p) => p.id));
        const missingInitialProducts = INITIAL_PRODUCTS.filter((p) => !mergedIds.has(p.id));
        if (list.some((p) => p.price !== null)) {
          setProducts([...list, ...missingInitialProducts]);
        }
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'reviews'), (snap) => {
        if (!firebaseUserRef.current || snap.empty) return;
        const list = snap.docs.map((d) => {
          const raw = { id: d.id, ...(d.data() as Omit<Review, 'id'>) };
          const fallback = initialReviewMap.get(d.id);
          return fallback
            ? { ...fallback, ...raw, photoUrl: raw.photoUrl || fallback.photoUrl }
            : raw;
        });
        setReviews(list);
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'productVerifications'), (snap) => {
        if (!firebaseUserRef.current || snap.empty) return;
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProductVerification, 'id'>) }));
        if (list.some((v) => v.batchNumber !== null)) {
          setVerifications(list);
        }
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'verificationHistory'), (snap) => {
        if (!firebaseUserRef.current || snap.empty) return;
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VerificationHistoryItem, 'id'>) }));
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setVerificationHistory(items);
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'educationalGames'), (snap) => {
        if (!firebaseUserRef.current || snap.empty) return;
        setGames(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EducationalGame, 'id'>) })));
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'vouchers'), (snap) => {
        if (!firebaseUserRef.current || snap.empty) return;
        setVouchers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Voucher, 'id'>) })));
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'trainingPrograms'), (snap) => {
        if (!firebaseUserRef.current || snap.empty) return;
        setTrainings(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TrainingProgram, 'id'>) })));
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'mentors'), (snap) => {
        if (!firebaseUserRef.current || snap.empty) return;
        setMentors(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Mentor, 'id'>) })));
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'learningMaterials'), (snap) => {
        if (!firebaseUserRef.current || snap.empty) return;
        setMaterials(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LearningMaterial, 'id'>) })));
      }, () => {})
    );

    unsubs.push(
      onSnapshot(doc(db, 'systemSettings', 'global'), (snap) => {
        if (!firebaseUserRef.current || !snap.exists()) return;
        setSettings({ id: snap.id, ...(snap.data() as Omit<SystemSetting, 'id'>) });
      }, () => {})
    );

    return () => unsubs.forEach((u) => u());
  }, []);

  // Auth State Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      firebaseUserRef.current = user;
      setFirebaseUser(user);
      if (user) {
        setIsDemoMode(false);
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const prof = snap.data() as UserProfile;
            setUserProfile(prof);
            setActivePortal(prof.role);
          } else {
            const defaultRole: UserRole = user.email === ADMIN_EMAIL ? 'admin' : 'customer';
            const now = new Date().toISOString();
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Pengguna BSI',
              role: defaultRole,
              managedStoreId: null,
              points: 0,
              createdAt: now,
              updatedAt: now,
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
            setActivePortal(defaultRole);
          }
          await seedInitialDataToFirestore();
        } catch (err) {
          console.error('Auth profile load failed:', err);
        }
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [seedInitialDataToFirestore]);

  // Authenticated user subscriptions (only when logged into Firebase)
  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(doc(db, 'users', uid), (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`))
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'favorites'), where('userId', '==', uid)), (snap) => {
        setFavorites(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Favorite, 'id'>) })));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'favorites'))
    );

    unsubs.push(
      onSnapshot(doc(db, 'carts', uid), (snap) => {
        if (snap.exists()) {
          setCart((snap.data().items as CartItem[]) || []);
        } else {
          setCart([]);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `carts/${uid}`))
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'orders'), where('customerUid', '==', uid)), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setOrders(list);
      }, () => {})
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'aiConversations'), where('userId', '==', uid)), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AiConversation, 'id'>) }));
        list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setAiConversations(list);
      }, () => {})
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'userPoints'), where('userId', '==', uid)), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserPoint, 'id'>) }));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setUserPoints(list);
      }, () => {})
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'voucherRedemptions'), where('userId', '==', uid)), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VoucherRedemption, 'id'>) }));
        list.sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt));
        setVoucherRedemptions(list);
      }, () => {})
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'trainingRegistrations'), where('userId', '==', uid)), (snap) => {
        setTrainingRegistrations(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TrainingRegistration, 'id'>) })));
      }, () => {})
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'mentoringSessions'), where('userId', '==', uid)), (snap) => {
        setMentoringSessions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MentoringSession, 'id'>) })));
      }, () => {})
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'notifications'), where('userId', '==', uid)), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, 'id'>) }));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setNotifications(list);
      }, () => {})
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'marketingContents'), where('ownerUid', '==', uid)), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MarketingContent, 'id'>) }));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setMarketingContents(list);
      }, () => {})
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'financialTransactions'), where('ownerUid', '==', uid)), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FinancialTransaction, 'id'>) }));
        list.sort((a, b) => b.date.localeCompare(a.date));
        setFinancialTransactions(list);
      }, () => {})
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'inventoryMovements'), where('actorUid', '==', uid)), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InventoryMovement, 'id'>) }));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setInventoryMovements(list);
      }, () => {})
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'storeChats'), where('customerUid', '==', uid)), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StoreChatMessage, 'id'>) }));
        setStoreChats((prev) => {
          const map = new Map(prev.map((m) => [m.id, m]));
          list.forEach((m) => map.set(m.id, m));
          return Array.from(map.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        });
      }, () => {})
    );

    return () => unsubs.forEach((u) => u());
  }, [firebaseUser]);

  // Additional Store-owner & Admin Subscriptions
  useEffect(() => {
    if (!firebaseUser || !userProfile) return;
    const unsubs: (() => void)[] = [];

    if (userProfile.managedStoreId) {
      unsubs.push(
        onSnapshot(query(collection(db, 'orders'), where('storeOwnerUid', '==', firebaseUser.uid)), (snap) => {
          const storeOrders = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
          setAllOrders((prev) => {
            const map = new Map(prev.map((o) => [o.id, o]));
            storeOrders.forEach((o) => map.set(o.id, o));
            return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          });
        }, () => {})
      );
      unsubs.push(
        onSnapshot(query(collection(db, 'storeChats'), where('storeId', '==', userProfile.managedStoreId)), (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StoreChatMessage, 'id'>) }));
          setStoreChats((prev) => {
            const map = new Map(prev.map((m) => [m.id, m]));
            list.forEach((m) => map.set(m.id, m));
            return Array.from(map.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          });
        }, () => {})
      );
    }

    if (isAdminAccount) {
      unsubs.push(
        onSnapshot(collection(db, 'users'), (snap) => {
          setAllUsers(snap.docs.map((d) => d.data() as UserProfile));
        }, () => {})
      );
      unsubs.push(
        onSnapshot(collection(db, 'orders'), (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
          list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setAllOrders(list);
        }, () => {})
      );
      unsubs.push(
        onSnapshot(query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(80)), (snap) => {
          setAuditLogs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLog, 'id'>) })));
        }, () => {})
      );
      unsubs.push(
        onSnapshot(collection(db, 'financialTransactions'), (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FinancialTransaction, 'id'>) }));
          list.sort((a, b) => b.date.localeCompare(a.date));
          setFinancialTransactions(list);
        }, () => {})
      );
      unsubs.push(
        onSnapshot(collection(db, 'marketingContents'), (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MarketingContent, 'id'>) }));
          setMarketingContents(list);
        }, () => {})
      );
      unsubs.push(
        onSnapshot(collection(db, 'inventoryMovements'), (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InventoryMovement, 'id'>) }));
          list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setInventoryMovements(list);
        }, () => {})
      );
    }

    return () => unsubs.forEach((u) => u());
  }, [firebaseUser, userProfile, isAdminAccount]);

  const signInWithGoogle = async (
    selectedRole: UserRole,
    extra?: {
      displayName?: string;
      phone?: string;
      storeIdToClaim?: string;
      newStoreName?: string;
      newStoreCategory?: string;
    }
  ): Promise<UserProfile | null> => {
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const user = cred.user;
      setIsDemoMode(false);
      const now = new Date().toISOString();
      const effectiveRole: UserRole =
        selectedRole === 'admin' && user.email !== ADMIN_EMAIL
          ? 'customer'
          : selectedRole;

      const userRef = doc(db, 'users', user.uid);
      const existingSnap = await getDoc(userRef);

      let managedStoreId: string | null = existingSnap.exists()
        ? (existingSnap.data().managedStoreId ?? null)
        : null;

      if (effectiveRole === 'umkm') {
        if (extra?.storeIdToClaim) {
          const storeRef = doc(db, 'umkmStores', extra.storeIdToClaim);
          const storeSnap = await getDoc(storeRef);
          if (storeSnap.exists() && (!storeSnap.data().ownerUid || storeSnap.data().ownerUid === user.uid)) {
            await updateDoc(storeRef, {
              ownerUid: user.uid,
              ownerName: extra.displayName || user.displayName || 'Pemilik UMKM',
              updatedAt: now,
            });
            const pSnap = await getDocs(query(collection(db, 'products'), where('storeId', '==', extra.storeIdToClaim)));
            for (const pDoc of pSnap.docs) {
              await updateDoc(pDoc.ref, { storeOwnerUid: user.uid, updatedAt: now });
            }
            managedStoreId = extra.storeIdToClaim;
          }
        } else if (extra?.newStoreName && extra.newStoreName.trim()) {
          const newId = `umkm-${Date.now()}`;
          const newStore: UmkmStore = {
            id: newId,
            name: extra.newStoreName.trim(),
            description: null,
            category: extra.newStoreCategory || 'Kuliner & Makanan',
            city: null,
            address: null,
            whatsapp: extra.phone || null,
            ownerName: extra.displayName || user.displayName || 'Pemilik UMKM',
            ownerUid: user.uid,
            photoUrl: null,
            legalitySummary: null,
            isVerifiedUmkm: false,
            ratingAvg: 0,
            reviewCount: 0,
            createdAt: now,
            updatedAt: now,
          };
          await setDoc(doc(db, 'umkmStores', newId), newStore);
          managedStoreId = newId;
        }
      }

      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: extra?.displayName?.trim() || user.displayName || existingSnap.data()?.displayName || 'Pengguna BSI',
        role: effectiveRole,
        managedStoreId,
        points: existingSnap.exists() ? (existingSnap.data().points ?? 0) : 0,
        phone: extra?.phone || existingSnap.data()?.phone || '',
        address: existingSnap.data()?.address || '',
        city: existingSnap.data()?.city || '',
        createdAt: existingSnap.exists() ? existingSnap.data().createdAt : now,
        updatedAt: now,
      };

      await setDoc(userRef, profile, { merge: true });
      setUserProfile(profile);
      setActivePortal(effectiveRole);
      await seedInitialDataToFirestore();
      await writeAuditLog('LOGIN', 'USER', user.uid, `Masuk sebagai ${effectiveRole}`);
      showToast(`Selamat datang, ${profile.displayName}!`, 'success');
      return profile;
    } catch (err: any) {
      showToast(err?.message || 'Gagal masuk dengan Google.', 'error');
      return null;
    }
  };

  const logout = async () => {
    if (firebaseUser) {
      await signOut(auth);
      setIsDemoMode(true);
      setUserProfile(DUMMY_PROFILES.customer);
      resetDemoData();
    } else {
      setIsDemoMode(false);
      setUserProfile(null);
    }
    setActivePortal('customer');
    showToast('Anda telah keluar dari akun.', 'info');
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!activeUid || !userProfile) return;
    const now = new Date().toISOString();
    setUserProfile((prev) => (prev ? { ...prev, ...updates, updatedAt: now } : prev));
    if (!firebaseUser) {
      showToast('Profil mode demo berhasil diperbarui.', 'success');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), { ...updates, updatedAt: now });
      showToast('Profil berhasil diperbarui.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const toggleFavorite = async (productId: string) => {
    if (!activeUid) {
      showToast('Silakan masuk terlebih dahulu untuk menyukai produk.', 'info');
      return;
    }
    const favId = `${activeUid}_${productId}`;
    const existingFav = favorites.find((f) => f.productId === productId);
    if (!firebaseUser) {
      if (existingFav) {
        setFavorites((prev) => prev.filter((f) => f.productId !== productId));
        showToast('Produk dihapus dari favorit.', 'info');
      } else {
        setFavorites((prev) => [...prev, { id: favId, userId: activeUid, productId, createdAt: new Date().toISOString() }]);
        showToast('Produk ditambahkan ke favorit!', 'success');
      }
      return;
    }
    try {
      if (existingFav) {
        await deleteDoc(doc(db, 'favorites', existingFav.id));
        showToast('Produk dihapus dari favorit.', 'info');
      } else {
        await setDoc(doc(db, 'favorites', favId), {
          id: favId,
          userId: firebaseUser.uid,
          productId,
          createdAt: new Date().toISOString(),
        });
        showToast('Produk ditambahkan ke favorit!', 'success');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `favorites/${favId}`);
    }
  };

  const syncCartToFirestore = async (nextItems: CartItem[]) => {
    if (!firebaseUser) return;
    try {
      await setDoc(doc(db, 'carts', firebaseUser.uid), {
        userId: firebaseUser.uid,
        items: nextItems,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `carts/${firebaseUser.uid}`);
    }
  };

  const addToCart = async (product: Product, qty = 1) => {
    if (!isAuthenticated) {
      showToast('Silakan masuk untuk menambahkan produk ke keranjang.', 'info');
      return;
    }
    if (product.price === null || product.price <= 0) {
      showToast('Harga produk belum ditetapkan oleh pemilik toko.', 'error');
      return;
    }
    if (product.stock === null || product.stock < qty) {
      showToast('Stok produk belum tersedia atau tidak mencukupi.', 'error');
      return;
    }
    const existingItem = cart.find((c) => c.productId === product.id);
    const next = existingItem
      ? cart.map((c) =>
          c.productId === product.id
            ? { ...c, quantity: Math.min(product.stock || 99, c.quantity + qty) }
            : c
        )
      : [
          ...cart,
          {
            productId: product.id,
            storeId: product.storeId,
            storeName: product.storeName,
            productName: product.name,
            price: product.price,
            quantity: qty,
            photoUrl: product.photoUrl,
          },
        ];
    setCart(next);
    await syncCartToFirestore(next);
    showToast(`${product.name} masuk ke keranjang.`, 'success');
  };

  const updateCartQty = async (productId: string, qty: number) => {
    if (qty <= 0) {
      await removeFromCart(productId);
      return;
    }
    const next = cart.map((c) => (c.productId === productId ? { ...c, quantity: qty } : c));
    setCart(next);
    await syncCartToFirestore(next);
  };

  const removeFromCart = async (productId: string) => {
    const next = cart.filter((c) => c.productId !== productId);
    setCart(next);
    await syncCartToFirestore(next);
  };

  const clearCart = async () => {
    setCart([]);
    await syncCartToFirestore([]);
  };

  const placeOrder = async (payload: {
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    paymentMethod: string;
    voucherRedemptionId?: string;
  }): Promise<Order | null> => {
    if (!activeUid || cart.length === 0) return null;
    const now = new Date().toISOString();
    const firstItem = cart[0];
    const storeObj = stores.find((s) => s.id === firstItem.storeId);
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    let discountAmount = 0;
    if (payload.voucherRedemptionId) {
      const redeemed = voucherRedemptions.find(
        (v) => v.id === payload.voucherRedemptionId && v.status === 'Aktif'
      );
      if (redeemed) {
        const titleLower = redeemed.voucherTitle.toLowerCase();
        if (titleLower.includes('50.000')) discountAmount = 50000;
        else if (titleLower.includes('20.000')) discountAmount = 20000;
        else discountAmount = 15000;
      }
    }
    const finalTotal = Math.max(0, subtotal - discountAmount);
    const orderId = `ord-${Date.now()}`;
    const orderNumber = `BSI-${Date.now().toString().slice(-6)}`;

    const order: Order = {
      id: orderId,
      orderNumber,
      customerUid: activeUid,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      shippingAddress: payload.shippingAddress,
      storeId: firstItem.storeId,
      storeName: firstItem.storeName,
      storeOwnerUid: storeObj?.ownerUid || null,
      items: cart,
      subtotal,
      total: finalTotal,
      paymentMethod: payload.paymentMethod,
      status: 'Menunggu Konfirmasi',
      createdAt: now,
      updatedAt: now,
    };

    const pts = settings.pointsPerOrder || 20;

    if (!firebaseUser) {
      setOrders((prev) => [order, ...prev]);
      setAllOrders((prev) => [order, ...prev]);
      setProducts((prev) =>
        prev.map((p) => {
          const ordered = cart.find((c) => c.productId === p.id);
          if (!ordered) return p;
          return {
            ...p,
            stock: Math.max(0, (p.stock ?? 0) - ordered.quantity),
            soldCount: (p.soldCount || 0) + ordered.quantity,
            updatedAt: now,
          };
        })
      );
      setFinancialTransactions((prev) => [
        {
          id: `fin-ord-${Date.now()}`,
          storeId: firstItem.storeId,
          ownerUid: 'demo-umkm-botega',
          type: 'PEMASUKAN',
          category: 'Penjualan',
          description: `Pesanan B-Market ${orderNumber} (${cart.map((i) => i.productName).join(', ')})`,
          amount: subtotal,
          date: now.slice(0, 10),
          source: 'B-Market',
          orderId,
          createdAt: now,
        },
        ...prev,
      ]);
      if (payload.voucherRedemptionId) {
        setVoucherRedemptions((prev) =>
          prev.map((v) => (v.id === payload.voucherRedemptionId ? { ...v, status: 'Terpakai' } : v))
        );
      }
      setUserPoints((prev) => [
        {
          id: `pt-ord-${Date.now()}`,
          userId: activeUid,
          amount: pts,
          type: 'EARN',
          reason: `Transaksi B-Market ${orderNumber}`,
          createdAt: now,
        },
        ...prev,
      ]);
      setUserProfile((prev) => (prev ? { ...prev, points: (prev.points || 0) + pts, updatedAt: now } : prev));
      await pushNotification(
        activeUid,
        'Pesanan Berhasil Dibuat',
        `Pesanan ${orderNumber} berhasil dikonfirmasi. Anda mendapatkan +${pts} poin B-Edu!`,
        'order'
      );
      await clearCart();
      await writeAuditLog('CREATE_ORDER', 'ORDER', orderId, `Pesanan ${orderNumber} sebesar Rp ${subtotal}`);
      return order;
    }

    try {
      await setDoc(doc(db, 'orders', orderId), order);

      for (const item of cart) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const prevStock = prod.stock ?? 0;
          const nextStock = Math.max(0, prevStock - item.quantity);
          await updateDoc(doc(db, 'products', prod.id), {
            stock: nextStock,
            soldCount: (prod.soldCount || 0) + item.quantity,
            updatedAt: now,
          });
        }
      }

      if (storeObj?.ownerUid) {
        const txId = `fin-ord-${Date.now()}`;
        await setDoc(doc(db, 'financialTransactions', txId), {
          id: txId,
          storeId: storeObj.id,
          ownerUid: storeObj.ownerUid,
          type: 'PEMASUKAN',
          category: 'Penjualan',
          description: `Pesanan B-Market ${orderNumber} (${cart.map((i) => i.productName).join(', ')})`,
          amount: subtotal,
          date: now.slice(0, 10),
          source: 'B-Market',
          orderId,
          createdAt: now,
        });
        await pushNotification(
          storeObj.ownerUid,
          'Pesanan Baru Masuk!',
          `Pesanan ${orderNumber} senilai Rp ${subtotal.toLocaleString('id-ID')} menunggu konfirmasi.`,
          'order'
        );
      }

      if (payload.voucherRedemptionId) {
        await updateDoc(doc(db, 'voucherRedemptions', payload.voucherRedemptionId), {
          status: 'Terpakai',
        });
      }

      const ptId = `pt-ord-${Date.now()}`;
      await setDoc(doc(db, 'userPoints', ptId), {
        id: ptId,
        userId: firebaseUser.uid,
        amount: pts,
        type: 'EARN',
        reason: `Transaksi B-Market ${orderNumber}`,
        createdAt: now,
      });
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        points: (userProfile?.points || 0) + pts,
        updatedAt: now,
      });

      await pushNotification(
        firebaseUser.uid,
        'Pesanan Berhasil Dibuat',
        `Pesanan ${orderNumber} berhasil dikonfirmasi. Anda mendapatkan +${pts} poin B-Edu!`,
        'order'
      );

      await clearCart();
      await writeAuditLog('CREATE_ORDER', 'ORDER', orderId, `Pesanan ${orderNumber} sebesar Rp ${subtotal}`);
      return order;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
      return null;
    }
  };

  const submitReview = async (
    productId: string,
    storeId: string,
    rating: number,
    comment: string,
    photoUrl?: string | null
  ) => {
    if (!activeUid) {
      showToast('Silakan masuk untuk memberikan ulasan.', 'info');
      return;
    }
    const id = `rev-${Date.now()}`;
    const now = new Date().toISOString();
    const newRev: Review = {
      id,
      productId,
      storeId,
      userId: activeUid,
      userName: userProfile?.displayName || firebaseUser?.displayName || 'Customer',
      rating,
      comment,
      photoUrl: photoUrl || null,
      createdAt: now,
    };

    if (!firebaseUser) {
      setReviews((prev) => [newRev, ...prev]);
      const prodReviews = [...reviews.filter((r) => r.productId === productId), { rating }];
      const avg = Number((prodReviews.reduce((s, r) => s + r.rating, 0) / prodReviews.length).toFixed(1));
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ratingAvg: avg, reviewCount: prodReviews.length } : p))
      );
      showToast('Ulasan Anda berhasil diterbitkan!', 'success');
      return;
    }

    try {
      await setDoc(doc(db, 'reviews', id), newRev);

      const prodReviews = [...reviews.filter((r) => r.productId === productId), { rating }];
      const avg = prodReviews.reduce((s, r) => s + r.rating, 0) / prodReviews.length;
      await updateDoc(doc(db, 'products', productId), {
        ratingAvg: Number(avg.toFixed(1)),
        reviewCount: prodReviews.length,
        updatedAt: now,
      });

      const storeReviews = [...reviews.filter((r) => r.storeId === storeId), { rating }];
      const storeAvg = storeReviews.reduce((s, r) => s + r.rating, 0) / storeReviews.length;
      await updateDoc(doc(db, 'umkmStores', storeId), {
        ratingAvg: Number(storeAvg.toFixed(1)),
        reviewCount: storeReviews.length,
      });

      showToast('Ulasan Anda berhasil diterbitkan!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `reviews/${id}`);
    }
  };

  const claimStore = async (storeId: string) => {
    if (!activeUid || !userProfile) return;
    const now = new Date().toISOString();
    if (!firebaseUser) {
      switchDemoStore(storeId);
      return;
    }
    try {
      await updateDoc(doc(db, 'umkmStores', storeId), {
        ownerUid: firebaseUser.uid,
        ownerName: userProfile.displayName,
        updatedAt: now,
      });
      const pSnap = await getDocs(query(collection(db, 'products'), where('storeId', '==', storeId)));
      for (const pDoc of pSnap.docs) {
        await updateDoc(pDoc.ref, { storeOwnerUid: firebaseUser.uid, updatedAt: now });
      }
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        role: userProfile.role === 'admin' ? 'admin' : 'umkm',
        managedStoreId: storeId,
        updatedAt: now,
      });
      showToast('Toko UMKM berhasil dihubungkan ke akun Anda!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `umkmStores/${storeId}`);
    }
  };

  const createStore = async (data: Partial<UmkmStore>): Promise<UmkmStore | null> => {
    if (!activeUid || !userProfile) return null;
    const now = new Date().toISOString();
    const id = `umkm-${Date.now()}`;
    const store: UmkmStore = {
      id,
      name: data.name || 'Toko UMKM Baru',
      description: data.description || null,
      category: data.category || 'Kuliner & Makanan',
      city: data.city || null,
      address: data.address || null,
      whatsapp: data.whatsapp || null,
      ownerName: userProfile.displayName,
      ownerUid: activeUid,
      photoUrl: data.photoUrl || null,
      legalitySummary: data.legalitySummary || null,
      isVerifiedUmkm: false,
      ratingAvg: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    if (!firebaseUser) {
      setStores((prev) => [...prev, store]);
      setUserProfile((prev) => (prev ? { ...prev, managedStoreId: id } : prev));
      showToast(`Toko ${store.name} berhasil dibuat!`, 'success');
      return store;
    }
    try {
      await setDoc(doc(db, 'umkmStores', id), store);
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        managedStoreId: id,
        updatedAt: now,
      });
      await writeAuditLog('CREATE_STORE', 'UMKM_STORE', id, `Mendaftarkan toko ${store.name}`);
      showToast(`Toko ${store.name} berhasil dibuat!`, 'success');
      return store;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `umkmStores/${id}`);
      return null;
    }
  };

  const updateStore = async (storeId: string, updates: Partial<UmkmStore>) => {
    if (!activeUid) return;
    const now = new Date().toISOString();
    if (!firebaseUser) {
      setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...updates, updatedAt: now } : s)));
      showToast('Profil toko berhasil diperbarui & tersinkronisasi ke B-Market!', 'success');
      return;
    }
    try {
      await updateDoc(doc(db, 'umkmStores', storeId), { ...updates, updatedAt: now });
      if (updates.name) {
        const storeProds = products.filter((p) => p.storeId === storeId);
        for (const sp of storeProds) {
          await updateDoc(doc(db, 'products', sp.id), { storeName: updates.name, updatedAt: now });
        }
      }
      showToast('Profil toko berhasil diperbarui & tersinkronisasi ke B-Market!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `umkmStores/${storeId}`);
    }
  };

  const saveProduct = async (
    productData: Partial<Product> & { name: string; storeId: string; storeName: string; category: string }
  ): Promise<string | null> => {
    if (!activeUid) return null;
    const now = new Date().toISOString();
    const isNew = !productData.id;
    const id = productData.id || `prod-${Date.now()}`;
    const existingProd = products.find((p) => p.id === id);

    const docPayload: Product = {
      id,
      storeId: productData.storeId,
      storeName: productData.storeName,
      storeOwnerUid: activeUid,
      name: productData.name,
      category: productData.category,
      description: productData.description || '',
      composition: productData.composition ?? existingProd?.composition ?? null,
      specifications: productData.specifications ?? existingProd?.specifications ?? null,
      price: productData.price !== undefined ? productData.price : (existingProd?.price ?? null),
      stock: productData.stock !== undefined ? productData.stock : (existingProd?.stock ?? null),
      initialStock: existingProd?.initialStock ?? (productData.stock ?? null),
      soldCount: existingProd?.soldCount ?? 0,
      ratingAvg: existingProd?.ratingAvg ?? 0,
      reviewCount: existingProd?.reviewCount ?? 0,
      productionDate: productData.productionDate ?? existingProd?.productionDate ?? null,
      expiryDate: productData.expiryDate ?? existingProd?.expiryDate ?? null,
      legalityNumber: productData.legalityNumber ?? existingProd?.legalityNumber ?? null,
      photoUrl: productData.photoUrl !== undefined ? productData.photoUrl : (existingProd?.photoUrl ?? null),
      videoUrl: productData.videoUrl !== undefined ? productData.videoUrl : (existingProd?.videoUrl ?? null),
      videoTitle: productData.videoTitle !== undefined ? productData.videoTitle : (existingProd?.videoTitle ?? null),
      isPublished: productData.isPublished ?? true,
      bchainStatus: existingProd?.bchainStatus ?? 'NOT VERIFIED',
      bchainId: existingProd?.bchainId ?? null,
      createdAt: existingProd?.createdAt ?? now,
      updatedAt: now,
    };

    if (!firebaseUser) {
      setProducts((prev) =>
        isNew ? [docPayload, ...prev] : prev.map((p) => (p.id === id ? docPayload : p))
      );
      if (isNew && docPayload.stock !== null) {
        setInventoryMovements((prev) => [
          {
            id: `mov-${Date.now()}`,
            storeId: docPayload.storeId,
            productId: id,
            productName: docPayload.name,
            type: 'INITIAL',
            qty: docPayload.stock || 0,
            previousStock: 0,
            newStock: docPayload.stock || 0,
            note: 'Stok awal produk baru di B-Save',
            actorUid: activeUid,
            createdAt: now,
          },
          ...prev,
        ]);
      }
      showToast(
        docPayload.isPublished
          ? 'Produk disimpan & tersinkronisasi ke B-Market!'
          : 'Produk disimpan sebagai draf di B-Save.',
        'success'
      );
      return id;
    }

    try {
      await setDoc(doc(db, 'products', id), docPayload);
      if (isNew && docPayload.stock !== null) {
        const movId = `mov-${Date.now()}`;
        await setDoc(doc(db, 'inventoryMovements', movId), {
          id: movId,
          storeId: docPayload.storeId,
          productId: id,
          productName: docPayload.name,
          type: 'INITIAL',
          qty: docPayload.stock,
          previousStock: 0,
          newStock: docPayload.stock,
          note: 'Stok awal produk baru di B-Save',
          actorUid: firebaseUser.uid,
          createdAt: now,
        });
      }
      showToast(
        docPayload.isPublished
          ? 'Produk disimpan & tersinkronisasi ke B-Market!'
          : 'Produk disimpan sebagai draf di B-Save.',
        'success'
      );
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${id}`);
      return null;
    }
  };

  const removeProduct = async (productId: string) => {
    if (!firebaseUser) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast('Produk berhasil dihapus.', 'info');
      return;
    }
    try {
      await deleteDoc(doc(db, 'products', productId));
      showToast('Produk berhasil dihapus.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  };

  const adjustInventory = async (product: Product, type: 'IN' | 'OUT', qty: number, note: string) => {
    if (!activeUid || qty <= 0) return;
    const now = new Date().toISOString();
    const prev = product.stock ?? 0;
    const next = type === 'IN' ? prev + qty : Math.max(0, prev - qty);
    const movId = `mov-${Date.now()}`;
    const movement: InventoryMovement = {
      id: movId,
      storeId: product.storeId,
      productId: product.id,
      productName: product.name,
      type,
      qty,
      previousStock: prev,
      newStock: next,
      note: note || (type === 'IN' ? 'Penambahan stok masuk' : 'Pengurangan stok keluar'),
      actorUid: activeUid,
      createdAt: now,
    };

    if (!firebaseUser) {
      setProducts((list) =>
        list.map((p) => (p.id === product.id ? { ...p, stock: next, updatedAt: now } : p))
      );
      setInventoryMovements((list) => [movement, ...list]);
      if (next <= 5) {
        await pushNotification(
          activeUid,
          'Peringatan Stok Menipis',
          `Stok produk ${product.name} tersisa ${next} unit. Segera lakukan pengisian stok di B-Save.`,
          'warning'
        );
      }
      showToast(`Stok ${product.name} diperbarui menjadi ${next} unit.`, 'success');
      return;
    }

    try {
      await updateDoc(doc(db, 'products', product.id), {
        stock: next,
        initialStock: product.initialStock ?? next,
        updatedAt: now,
      });
      await setDoc(doc(db, 'inventoryMovements', movId), movement);
      if (next <= 5) {
        await pushNotification(
          firebaseUser.uid,
          'Peringatan Stok Menipis',
          `Stok produk ${product.name} tersisa ${next} unit. Segera lakukan pengisian stok di B-Save.`,
          'warning'
        );
      }
      showToast(`Stok ${product.name} diperbarui menjadi ${next} unit.`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `inventoryMovements/${movId}`);
    }
  };

  const submitToBChain = async (
    product: Product,
    details: {
      productCode: string;
      batchNumber: string;
      productionDate: string;
      shelfLife: string;
      expiryDate: string;
      legalityInfo: string;
    }
  ) => {
    if (!activeUid) return;
    const now = new Date().toISOString();
    const verId = product.bchainId || `bch-${product.id}`;

    let blockchainHash = '';
    let txId = '';
    let blockNumber = 1842500;
    let network = settings.bchainNetwork || 'BSI Permissioned Ledger (Polygon Edge)';

    try {
      const resp = await fetch('/api/blockchain/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productCode: details.productCode,
          batchNumber: details.batchNumber,
          storeId: product.storeId,
          status: 'PENDING VERIFICATION',
          timestamp: now,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        blockchainHash = data.blockchainHash;
        txId = data.txId;
        blockNumber = data.blockNumber;
        network = data.network;
      }
    } catch {
      // Fallback to Web Crypto SHA-256
    }

    if (!blockchainHash) {
      blockchainHash = await generateSha256Hex(`${product.id}|${details.productCode}|${details.batchNumber}|${now}`);
      txId = `BCH-${blockchainHash.slice(2, 14).toUpperCase()}`;
    }

    const record: ProductVerification = {
      id: verId,
      productId: product.id,
      productName: product.name,
      storeId: product.storeId,
      storeName: product.storeName,
      productCode: details.productCode,
      batchNumber: details.batchNumber,
      productionDate: details.productionDate,
      shelfLife: details.shelfLife,
      expiryDate: details.expiryDate,
      legalityInfo: details.legalityInfo,
      status: 'PENDING VERIFICATION',
      txId,
      blockchainHash,
      blockNumber,
      network,
      submittedByUid: activeUid,
      verifiedByUid: null,
      createdAt: now,
      updatedAt: now,
    };

    const histItem: VerificationHistoryItem = {
      id: `vh-${Date.now()}`,
      verificationId: verId,
      productId: product.id,
      productName: product.name,
      action: 'Pengajuan Verifikasi B-CHAIN oleh UMKM',
      status: 'PENDING VERIFICATION',
      txId,
      blockchainHash,
      note: `Batch ${details.batchNumber} diajukan untuk verifikasi admin.`,
      actorUid: activeUid,
      actorName: userProfile?.displayName || 'Pemilik UMKM',
      createdAt: now,
    };

    if (!firebaseUser) {
      setVerifications((prev) =>
        prev.some((v) => v.id === verId)
          ? prev.map((v) => (v.id === verId ? record : v))
          : [record, ...prev]
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                bchainStatus: 'PENDING VERIFICATION',
                bchainId: verId,
                productionDate: details.productionDate,
                expiryDate: details.expiryDate,
                legalityNumber: details.legalityInfo,
                updatedAt: now,
              }
            : p
        )
      );
      setVerificationHistory((prev) => [histItem, ...prev]);
      await writeAuditLog('SUBMIT_BCHAIN', 'VERIFICATION', verId, `Mengajukan verifikasi B-CHAIN untuk ${product.name}`);
      showToast('Data produk diteruskan ke B-CHAIN (Menunggu Verifikasi Admin).', 'success');
      return;
    }

    try {
      await setDoc(doc(db, 'productVerifications', verId), record);
      await updateDoc(doc(db, 'products', product.id), {
        bchainStatus: 'PENDING VERIFICATION',
        bchainId: verId,
        productionDate: details.productionDate,
        expiryDate: details.expiryDate,
        legalityNumber: details.legalityInfo,
        updatedAt: now,
      });
      await setDoc(doc(db, 'verificationHistory', histItem.id), histItem);
      await writeAuditLog('SUBMIT_BCHAIN', 'VERIFICATION', verId, `Mengajukan verifikasi B-CHAIN untuk ${product.name}`);
      showToast('Data produk diteruskan ke B-CHAIN (Menunggu Verifikasi Admin).', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `productVerifications/${verId}`);
    }
  };

  const saveMarketingContent = async (
    content: Partial<MarketingContent> & {
      storeId: string;
      title: string;
      channel: MarketingContent['channel'];
      caption: string;
      headline: string;
      cta: string;
      scheduledDate: string;
      status: ContentStatus;
    }
  ) => {
    if (!activeUid) return;
    const now = new Date().toISOString();
    const id = content.id || `mkt-${Date.now()}`;
    const payload: MarketingContent = {
      id,
      storeId: content.storeId,
      ownerUid: activeUid,
      productId: content.productId || null,
      productName: content.productName || null,
      channel: content.channel,
      title: content.title,
      headline: content.headline,
      caption: content.caption,
      cta: content.cta,
      scheduledDate: content.scheduledDate,
      status: content.status,
      createdAt: content.createdAt || now,
      updatedAt: now,
    };
    if (!firebaseUser) {
      setMarketingContents((prev) =>
        prev.some((m) => m.id === id) ? prev.map((m) => (m.id === id ? payload : m)) : [payload, ...prev]
      );
      showToast('Konten pemasaran tersimpan di Kalender B-Smart!', 'success');
      return;
    }
    try {
      await setDoc(doc(db, 'marketingContents', id), payload);
      showToast('Konten pemasaran tersimpan di Kalender B-Smart!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `marketingContents/${id}`);
    }
  };

  const updateMarketingStatus = async (id: string, status: ContentStatus) => {
    if (!firebaseUser) {
      setMarketingContents((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status, updatedAt: new Date().toISOString() } : m))
      );
      showToast(`Status konten diperbarui menjadi ${status}.`, 'success');
      return;
    }
    try {
      await updateDoc(doc(db, 'marketingContents', id), {
        status,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Status konten diperbarui menjadi ${status}.`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `marketingContents/${id}`);
    }
  };

  const deleteMarketingContent = async (id: string) => {
    if (!firebaseUser) {
      setMarketingContents((prev) => prev.filter((m) => m.id !== id));
      showToast('Konten pemasaran dihapus.', 'info');
      return;
    }
    try {
      await deleteDoc(doc(db, 'marketingContents', id));
      showToast('Konten pemasaran dihapus.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `marketingContents/${id}`);
    }
  };

  const addFinancialTx = async (tx: Omit<FinancialTransaction, 'id' | 'ownerUid' | 'createdAt'>) => {
    if (!activeUid) return;
    const id = `fin-${Date.now()}`;
    const payload: FinancialTransaction = {
      ...tx,
      id,
      ownerUid: activeUid,
      createdAt: new Date().toISOString(),
    };
    if (!firebaseUser) {
      setFinancialTransactions((prev) => [payload, ...prev]);
      showToast('Transaksi keuangan berhasil dicatat!', 'success');
      return;
    }
    try {
      await setDoc(doc(db, 'financialTransactions', id), payload);
      showToast('Transaksi keuangan berhasil dicatat!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `financialTransactions/${id}`);
    }
  };

  const deleteFinancialTx = async (id: string) => {
    if (!firebaseUser) {
      setFinancialTransactions((prev) => prev.filter((t) => t.id !== id));
      showToast('Catatan transaksi dihapus.', 'info');
      return;
    }
    try {
      await deleteDoc(doc(db, 'financialTransactions', id));
      showToast('Catatan transaksi dihapus.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `financialTransactions/${id}`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!firebaseUser) {
      const now = new Date().toISOString();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: now } : o)));
      setAllOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: now } : o)));
      await writeAuditLog('UPDATE_ORDER_STATUS', 'ORDER', orderId, `Status diubah menjadi ${status}`);
      showToast(`Status pesanan diperbarui ke ${status}.`, 'success');
      return;
    }
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: new Date().toISOString(),
      });
      const ord = [...orders, ...allOrders].find((o) => o.id === orderId);
      if (ord) {
        await pushNotification(
          ord.customerUid,
          `Update Pesanan ${ord.orderNumber}`,
          `Status pesanan Anda kini: ${status}.`,
          'order'
        );
      }
      await writeAuditLog('UPDATE_ORDER_STATUS', 'ORDER', orderId, `Status diubah menjadi ${status}`);
      showToast(`Status pesanan diperbarui ke ${status}.`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const completeQuizGame = async (game: EducationalGame, correctCount: number): Promise<number> => {
    const ptsPerCorrect = settings.pointsPerQuizCorrect || game.pointsPerCorrect || 25;
    const earned = correctCount * ptsPerCorrect;
    if (!activeUid || earned <= 0) return earned;
    const now = new Date().toISOString();
    const id = `pt-quiz-${Date.now()}`;
    const ptEntry: UserPoint = {
      id,
      userId: activeUid,
      amount: earned,
      type: 'EARN',
      reason: `Menyelesaikan ${game.title} (${correctCount}/${game.questions.length} benar)`,
      createdAt: now,
    };

    const nextEggs = (userProfile?.eggTickets ?? 0) + 1;

    if (!firebaseUser) {
      setUserPoints((prev) => [ptEntry, ...prev]);
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              points: (prev.points || 0) + earned,
              eggTickets: nextEggs,
              updatedAt: now,
            }
          : prev
      );
      await pushNotification(
        activeUid,
        'Poin & Tiket Pecah Telur Bertambah!',
        `Selamat! Anda memperoleh +${earned} poin dan +1 Tiket Pecah Telur dari ${game.title}.`,
        'reward'
      );
      return earned;
    }

    try {
      await setDoc(doc(db, 'userPoints', id), ptEntry);
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        points: (userProfile?.points || 0) + earned,
        eggTickets: nextEggs,
        updatedAt: now,
      });
      await pushNotification(
        firebaseUser.uid,
        'Poin & Tiket Pecah Telur Bertambah!',
        `Selamat! Anda memperoleh +${earned} poin dan +1 Tiket Pecah Telur dari ${game.title}.`,
        'reward'
      );
      return earned;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `userPoints/${id}`);
      return earned;
    }
  };

  const claimDailyStreak = async (): Promise<{
    pointsEarned: number;
    streakCount: number;
    alreadyClaimed: boolean;
  }> => {
    if (!activeUid || !userProfile) {
      return { pointsEarned: 0, streakCount: 0, alreadyClaimed: false };
    }
    const today = new Date().toISOString().slice(0, 10);
    if (userProfile.lastCheckInDate === today) {
      showToast('Absen harian hari ini sudah diklaim! Lanjutkan besok untuk memperpanjang streak.', 'info');
      return {
        pointsEarned: 0,
        streakCount: userProfile.streakCount ?? 1,
        alreadyClaimed: true,
      };
    }

    const now = new Date().toISOString();
    const nextStreak = (userProfile.streakCount ?? 0) + 1;
    const bonusPoints = nextStreak >= 7 ? 30 : 15;
    const nextPoints = (userProfile.points || 0) + bonusPoints;
    const nextEggs = (userProfile.eggTickets ?? 0) + 1;
    const ptId = `pt-streak-${Date.now()}`;

    const ptEntry: UserPoint = {
      id: ptId,
      userId: activeUid,
      amount: bonusPoints,
      type: 'EARN',
      reason: `Check-in Streak Harian Hari Ke-${nextStreak} (+1 Tiket Pecah Telur)`,
      createdAt: now,
    };

    if (!firebaseUser) {
      setUserPoints((prev) => [ptEntry, ...prev]);
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              points: nextPoints,
              streakCount: nextStreak,
              lastCheckInDate: today,
              eggTickets: nextEggs,
              updatedAt: now,
            }
          : prev
      );
      await pushNotification(
        activeUid,
        `Streak Hari Ke-${nextStreak} Aktif!`,
        `Anda meraih +${bonusPoints} poin dan +1 Tiket Pecah Telur Berkah BINA.`,
        'reward'
      );
      showToast(`Absen berhasil! Streak ${nextStreak} hari (+${bonusPoints} poin & +1 Telur).`, 'success');
      return { pointsEarned: bonusPoints, streakCount: nextStreak, alreadyClaimed: false };
    }

    try {
      await setDoc(doc(db, 'userPoints', ptId), ptEntry);
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        points: nextPoints,
        streakCount: nextStreak,
        lastCheckInDate: today,
        eggTickets: nextEggs,
        updatedAt: now,
      });
      await pushNotification(
        firebaseUser.uid,
        `Streak Hari Ke-${nextStreak} Aktif!`,
        `Anda meraih +${bonusPoints} poin dan +1 Tiket Pecah Telur Berkah BINA.`,
        'reward'
      );
      showToast(`Absen berhasil! Streak ${nextStreak} hari (+${bonusPoints} poin & +1 Telur).`, 'success');
      return { pointsEarned: bonusPoints, streakCount: nextStreak, alreadyClaimed: false };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `userPoints/${ptId}`);
      return { pointsEarned: bonusPoints, streakCount: nextStreak, alreadyClaimed: false };
    }
  };

  const crackEggReward = async (): Promise<{
    type: 'points' | 'voucher';
    title: string;
    subtitle: string;
    amount?: number;
    voucherCode?: string;
  } | null> => {
    if (!activeUid || !userProfile) {
      showToast('Silakan masuk terlebih dahulu untuk bermain Pecah Telur.', 'info');
      return null;
    }
    const currentTickets = userProfile.eggTickets ?? 0;
    if (currentTickets <= 0) {
      showToast('Tiket Pecah Telur habis! Klaim Streak Harian atau mainkan kuis B-Edu untuk mendapat tiket.', 'info');
      return null;
    }

    const now = new Date().toISOString();
    const nextTickets = Math.max(0, currentTickets - 1);

    const prizePool: Array<
      | { type: 'points'; title: string; subtitle: string; amount: number }
      | { type: 'voucher'; title: string; subtitle: string; voucherTitle: string }
    > = [
      {
        type: 'points',
        title: '+35 Poin Berkah BINA!',
        subtitle: 'Poin langsung masuk ke saldo B-Edu Anda.',
        amount: 35,
      },
      {
        type: 'points',
        title: '+60 Poin Emas UMKM!',
        subtitle: 'Lumayan untuk ditukar voucher belanja B-Market.',
        amount: 60,
      },
      {
        type: 'voucher',
        title: 'Voucher Kejutan Telur Rp 15.000!',
        subtitle: 'Otomatis masuk ke Voucher Saya dan siap dipakai saat checkout B-Market.',
        voucherTitle: 'Voucher Kejutan Telur BINA Rp 15.000',
      },
      {
        type: 'points',
        title: 'JACKPOT +100 Poin B-Edu!',
        subtitle: 'Selamat! Anda memecahkan Telur Emas BINA.',
        amount: 100,
      },
    ];

    const picked = prizePool[Math.floor(Math.random() * prizePool.length)];

    if (picked.type === 'points') {
      const ptId = `pt-egg-${Date.now()}`;
      const ptEntry: UserPoint = {
        id: ptId,
        userId: activeUid,
        amount: picked.amount,
        type: 'EARN',
        reason: `Hadiah Gamifikasi Pecah Telur BINA (+${picked.amount} poin)`,
        createdAt: now,
      };
      const nextPoints = (userProfile.points || 0) + picked.amount;

      if (!firebaseUser) {
        setUserPoints((prev) => [ptEntry, ...prev]);
        setUserProfile((prev) =>
          prev ? { ...prev, points: nextPoints, eggTickets: nextTickets, updatedAt: now } : prev
        );
        return picked;
      }

      try {
        await setDoc(doc(db, 'userPoints', ptId), ptEntry);
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          points: nextPoints,
          eggTickets: nextTickets,
          updatedAt: now,
        });
        return picked;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `userPoints/${ptId}`);
        return null;
      }
    } else {
      const redId = `red-egg-${Date.now()}`;
      const code = `TELUR-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const redemption: VoucherRedemption = {
        id: redId,
        userId: activeUid,
        voucherId: 'egg-surprise',
        voucherTitle: picked.voucherTitle,
        voucherCode: code,
        pointsSpent: 0,
        status: 'Aktif',
        redeemedAt: now,
      };

      if (!firebaseUser) {
        setVoucherRedemptions((prev) => [redemption, ...prev]);
        setUserProfile((prev) =>
          prev ? { ...prev, eggTickets: nextTickets, updatedAt: now } : prev
        );
        return { ...picked, voucherCode: code };
      }

      try {
        await setDoc(doc(db, 'voucherRedemptions', redId), redemption);
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          eggTickets: nextTickets,
          updatedAt: now,
        });
        return { ...picked, voucherCode: code };
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `voucherRedemptions/${redId}`);
        return null;
      }
    }
  };

  const redeemVoucher = async (voucher: Voucher): Promise<VoucherRedemption | null> => {
    if (!activeUid || !userProfile) {
      showToast('Silakan masuk terlebih dahulu untuk menukarkan poin.', 'info');
      return null;
    }
    if ((userProfile.points || 0) < voucher.pointsCost) {
      showToast('Poin Anda belum mencukupi untuk menukarkan voucher ini.', 'error');
      return null;
    }
    if (voucher.quota <= 0) {
      showToast('Kuota voucher ini sudah habis.', 'error');
      return null;
    }
    const now = new Date().toISOString();
    const id = `red-${Date.now()}`;
    const code = `BSI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const redemption: VoucherRedemption = {
      id,
      userId: activeUid,
      voucherId: voucher.id,
      voucherTitle: voucher.title,
      voucherCode: code,
      pointsSpent: voucher.pointsCost,
      status: 'Aktif',
      redeemedAt: now,
    };

    if (!firebaseUser) {
      setVoucherRedemptions((prev) => [redemption, ...prev]);
      setUserPoints((prev) => [
        {
          id: `pt-red-${Date.now()}`,
          userId: activeUid,
          amount: -voucher.pointsCost,
          type: 'REDEEM',
          reason: `Penukaran ${voucher.title}`,
          createdAt: now,
        },
        ...prev,
      ]);
      setUserProfile((prev) =>
        prev ? { ...prev, points: Math.max(0, (prev.points || 0) - voucher.pointsCost), updatedAt: now } : prev
      );
      setVouchers((prev) =>
        prev.map((v) => (v.id === voucher.id ? { ...v, quota: Math.max(0, v.quota - 1) } : v))
      );
      showToast(`Voucher berhasil ditukar! Kode: ${code}`, 'success');
      return redemption;
    }

    try {
      await setDoc(doc(db, 'voucherRedemptions', id), redemption);
      await setDoc(doc(db, 'userPoints', `pt-red-${Date.now()}`), {
        id: `pt-red-${Date.now()}`,
        userId: firebaseUser.uid,
        amount: -voucher.pointsCost,
        type: 'REDEEM',
        reason: `Penukaran ${voucher.title}`,
        createdAt: now,
      });
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        points: Math.max(0, (userProfile.points || 0) - voucher.pointsCost),
        updatedAt: now,
      });
      await updateDoc(doc(db, 'vouchers', voucher.id), {
        quota: Math.max(0, voucher.quota - 1),
      });
      showToast(`Voucher berhasil ditukar! Kode: ${code}`, 'success');
      return redemption;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `voucherRedemptions/${id}`);
      return null;
    }
  };

  const registerTraining = async (program: TrainingProgram) => {
    if (!activeUid || !userProfile) {
      showToast('Silakan masuk untuk mendaftar pelatihan.', 'info');
      return;
    }
    if (trainingRegistrations.some((r) => r.programId === program.id)) {
      showToast('Anda sudah terdaftar pada pelatihan ini.', 'info');
      return;
    }
    const id = `treg-${Date.now()}`;
    const myStore = stores.find((s) => s.id === userProfile.managedStoreId || s.ownerUid === activeUid);
    const reg: TrainingRegistration = {
      id,
      programId: program.id,
      programTitle: program.title,
      userId: activeUid,
      storeId: myStore?.id || 'umum',
      storeName: myStore?.name || userProfile.displayName,
      applicantName: userProfile.displayName,
      status: 'Terdaftar',
      createdAt: new Date().toISOString(),
    };

    if (!firebaseUser) {
      setTrainingRegistrations((prev) => [reg, ...prev]);
      setTrainings((prev) =>
        prev.map((t) => (t.id === program.id ? { ...t, registeredCount: (t.registeredCount || 0) + 1 } : t))
      );
      showToast(`Berhasil mendaftar pelatihan: ${program.title}`, 'success');
      return;
    }

    try {
      await setDoc(doc(db, 'trainingRegistrations', id), reg);
      await updateDoc(doc(db, 'trainingPrograms', program.id), {
        registeredCount: (program.registeredCount || 0) + 1,
      });
      showToast(`Berhasil mendaftar pelatihan: ${program.title}`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `trainingRegistrations/${id}`);
    }
  };

  const registerRoutineCoaching = async (schedule: RoutineCoachingSchedule) => {
    if (!activeUid || !userProfile) {
      showToast('Silakan masuk terlebih dahulu untuk mengikuti jadwal pembinaan.', 'info');
      return;
    }
    if (registeredRoutineIds.includes(schedule.id)) {
      showToast('Anda sudah terdaftar pada jadwal pembinaan rutin ini.', 'info');
      return;
    }
    setRegisteredRoutineIds((prev) => [...prev, schedule.id]);
    setRoutineCoaching((prev) =>
      prev.map((s) =>
        s.id === schedule.id ? { ...s, registeredCount: Math.min(s.quota, s.registeredCount + 1) } : s
      )
    );
    await pushNotification(
      activeUid,
      `Terdaftar Pembinaan ${schedule.mode}!`,
      `${schedule.title} (${schedule.dayOfWeek} · ${schedule.timeWib}) bersama ${schedule.mentorName}.`,
      'info'
    );
    showToast(`Berhasil mendaftar sesi rutin ${schedule.mode}: ${schedule.title}`, 'success');
  };

  const registerWebinar = async (webinar: BEduWebinar) => {
    if (!activeUid || !userProfile) {
      showToast('Silakan masuk terlebih dahulu untuk mendaftar webinar.', 'info');
      return;
    }
    if (registeredWebinarIds.includes(webinar.id)) {
      showToast('Anda sudah terdaftar pada webinar ini.', 'info');
      return;
    }
    setRegisteredWebinarIds((prev) => [...prev, webinar.id]);
    setWebinars((prev) =>
      prev.map((w) =>
        w.id === webinar.id ? { ...w, registeredCount: Math.min(w.quota, w.registeredCount + 1) } : w
      )
    );
    const now = new Date().toISOString();
    if (userProfile.role === 'customer' && webinar.pointsReward > 0) {
      const ptId = `pt-web-${Date.now()}`;
      const ptEntry: UserPoint = {
        id: ptId,
        userId: activeUid,
        amount: webinar.pointsReward,
        type: 'EARN',
        reason: `Mendaftar Webinar B-Edu: ${webinar.title}`,
        createdAt: now,
      };
      const nextPoints = (userProfile.points || 0) + webinar.pointsReward;
      if (!firebaseUser) {
        setUserPoints((prev) => [ptEntry, ...prev]);
        setUserProfile((prev) => (prev ? { ...prev, points: nextPoints, updatedAt: now } : prev));
      } else {
        try {
          await setDoc(doc(db, 'userPoints', ptId), ptEntry);
          await updateDoc(doc(db, 'users', firebaseUser.uid), { points: nextPoints, updatedAt: now });
        } catch {
          // Non-blocking point credit
        }
      }
    }
    await pushNotification(
      activeUid,
      `Tiket Webinar Terkonfirmasi!`,
      `${webinar.title} (${webinar.dateLabel} · ${webinar.timeWib}).`,
      'info'
    );
    showToast(
      userProfile.role === 'customer'
        ? `Berhasil daftar webinar & raih +${webinar.pointsReward} poin B-Edu!`
        : `Berhasil mendaftar webinar: ${webinar.title}`,
      'success'
    );
  };

  const markNewsRead = async (article: BEduNewsArticle) => {
    if (readNewsIds.includes(article.id)) return;
    setReadNewsIds((prev) => [...prev, article.id]);
    if (!activeUid || !userProfile || userProfile.role !== 'customer') return;
    const reward = 10;
    const now = new Date().toISOString();
    const ptId = `pt-news-${Date.now()}`;
    const ptEntry: UserPoint = {
      id: ptId,
      userId: activeUid,
      amount: reward,
      type: 'EARN',
      reason: `Membaca Berita UMKM: ${article.title}`,
      createdAt: now,
    };
    const nextPoints = (userProfile.points || 0) + reward;
    if (!firebaseUser) {
      setUserPoints((prev) => [ptEntry, ...prev]);
      setUserProfile((prev) => (prev ? { ...prev, points: nextPoints, updatedAt: now } : prev));
    } else {
      try {
        await setDoc(doc(db, 'userPoints', ptId), ptEntry);
        await updateDoc(doc(db, 'users', firebaseUser.uid), { points: nextPoints, updatedAt: now });
      } catch {
        // Non-blocking read point
      }
    }
    showToast(`+10 Poin Literasi B-Edu karena membaca artikel!`, 'success');
  };

  const toggleSaveNews = (articleId: string) => {
    setSavedNewsIds((prev) => {
      const exists = prev.includes(articleId);
      showToast(exists ? 'Artikel dihapus dari daftar simpan.' : 'Artikel disimpan ke Favorit Bacaan.', 'info');
      return exists ? prev.filter((id) => id !== articleId) : [...prev, articleId];
    });
  };

  const bookMentoring = async (mentor: Mentor, topic: string, requestedDate: string) => {
    if (!activeUid || !userProfile) return;
    const id = `mses-${Date.now()}`;
    const myStore = stores.find((s) => s.id === userProfile.managedStoreId || s.ownerUid === activeUid);
    const session: MentoringSession = {
      id,
      mentorId: mentor.id,
      mentorName: mentor.name,
      userId: activeUid,
      storeId: myStore?.id || 'umum',
      storeName: myStore?.name || userProfile.displayName,
      topic,
      requestedDate,
      status: 'Menunggu Jadwal',
      createdAt: new Date().toISOString(),
    };

    if (!firebaseUser) {
      setMentoringSessions((prev) => [session, ...prev]);
      showToast(`Pengajuan konsultasi dengan ${mentor.name} berhasil dikirim!`, 'success');
      return;
    }

    try {
      await setDoc(doc(db, 'mentoringSessions', id), session);
      showToast(`Pengajuan konsultasi dengan ${mentor.name} berhasil dikirim!`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `mentoringSessions/${id}`);
    }
  };

  const saveAiConversation = async (conv: AiConversation) => {
    setAiConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
    if (!firebaseUser) return;
    try {
      await setDoc(doc(db, 'aiConversations', conv.id), conv);
    } catch {
      // Non-blocking chat sync
    }
  };

  const sendStoreChatMessage = async (payload: {
    storeId: string;
    storeName: string;
    customerUid: string;
    customerName: string;
    productId?: string | null;
    productName?: string | null;
    senderRole: 'customer' | 'umkm';
    text: string;
  }) => {
    const cleanText = payload.text.trim();
    if (!cleanText || !activeUid) return;
    const now = new Date().toISOString();
    const id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const message: StoreChatMessage = {
      id,
      storeId: payload.storeId,
      storeName: payload.storeName,
      customerUid: payload.customerUid,
      customerName: payload.customerName,
      productId: payload.productId || null,
      productName: payload.productName || null,
      senderRole: payload.senderRole,
      senderName:
        payload.senderRole === 'umkm'
          ? `${stores.find((s) => s.id === payload.storeId)?.ownerName || 'Penjual'} (${payload.storeName})`
          : payload.customerName,
      text: cleanText,
      createdAt: now,
    };

    if (!firebaseUser) {
      setStoreChats((prev) => [...prev, message]);
      if (payload.senderRole === 'customer') {
        const storeObj = stores.find((s) => s.id === payload.storeId);
        const replyDelayMs = 800;
        setTimeout(() => {
          const replyNow = new Date().toISOString();
          const replyId = `chat-reply-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
          const prodMention = payload.productName ? ` terkait ${payload.productName}` : '';
          const replyMsg: StoreChatMessage = {
            id: replyId,
            storeId: payload.storeId,
            storeName: payload.storeName,
            customerUid: payload.customerUid,
            customerName: payload.customerName,
            productId: payload.productId || null,
            productName: payload.productName || null,
            senderRole: 'umkm',
            senderName: `${storeObj?.ownerName || 'Admin Toko'} (${payload.storeName})`,
            text: `Terima kasih telah menghubungi ${payload.storeName} melalui Chat B-Market! Pesan Anda${prodMention} sudah kami terima. Produk ready stok dan bisa langsung di-checkout amanah melalui B-Market ya Kak.`,
            createdAt: replyNow,
          };
          setStoreChats((prev) => [...prev, replyMsg]);
        }, replyDelayMs);
      }
      return;
    }

    try {
      await setDoc(doc(db, 'storeChats', id), message);
      const storeObj = stores.find((s) => s.id === payload.storeId);
      if (payload.senderRole === 'customer' && storeObj?.ownerUid) {
        await pushNotification(
          storeObj.ownerUid,
          `Pesan Baru dari ${payload.customerName}`,
          cleanText.slice(0, 120),
          'chat'
        );
      } else if (payload.senderRole === 'umkm') {
        await pushNotification(
          payload.customerUid,
          `Balasan Chat dari ${payload.storeName}`,
          cleanText.slice(0, 120),
          'chat'
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `storeChats/${id}`);
    }
  };

  const markNotificationRead = async (notifId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)));
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'notifications', notifId), { isRead: true });
    } catch {
      // Ignore
    }
  };

  // Admin Actions
  const verifyBChainRecord = async (
    verification: ProductVerification,
    status: BChainStatus,
    note: string
  ) => {
    if (!activeUid) return;
    const now = new Date().toISOString();
    const newHash = await generateSha256Hex(
      `${verification.productId}|${verification.productCode}|${status}|${now}`
    );
    const txId = `BCH-${newHash.slice(2, 14).toUpperCase()}`;
    const blockNumber = (verification.blockNumber || 1842000) + 1;
    const histItem: VerificationHistoryItem = {
      id: `vh-${Date.now()}`,
      verificationId: verification.id,
      productId: verification.productId,
      productName: verification.productName,
      action: `Pembaruan Status oleh Administrator (${status})`,
      status,
      txId,
      blockchainHash: newHash,
      note: note || `Status diperbarui menjadi ${status}`,
      actorUid: activeUid,
      actorName: userProfile?.displayName || 'Administrator',
      createdAt: now,
    };

    if (!firebaseUser) {
      setVerifications((prev) =>
        prev.map((v) =>
          v.id === verification.id
            ? { ...v, status, txId, blockchainHash: newHash, blockNumber, verifiedByUid: activeUid, updatedAt: now }
            : v
        )
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === verification.productId ? { ...p, bchainStatus: status, updatedAt: now } : p))
      );
      setVerificationHistory((prev) => [histItem, ...prev]);
      await writeAuditLog('VERIFY_BCHAIN', 'VERIFICATION', verification.id, `${verification.productName} -> ${status}`);
      showToast(`Status B-CHAIN ${verification.productName} diubah ke ${status}.`, 'success');
      return;
    }

    try {
      await updateDoc(doc(db, 'productVerifications', verification.id), {
        status,
        txId,
        blockchainHash: newHash,
        blockNumber,
        verifiedByUid: firebaseUser.uid,
        updatedAt: now,
      });
      await updateDoc(doc(db, 'products', verification.productId), {
        bchainStatus: status,
        bchainId: verification.id,
        updatedAt: now,
      });
      await setDoc(doc(db, 'verificationHistory', histItem.id), histItem);
      await writeAuditLog('VERIFY_BCHAIN', 'VERIFICATION', verification.id, `${verification.productName} -> ${status}`);
      showToast(`Status B-CHAIN ${verification.productName} diubah ke ${status}.`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `productVerifications/${verification.id}`);
    }
  };

  const saveCategory = async (cat: Partial<Category> & { name: string }) => {
    const id = cat.id || `cat-${Date.now()}`;
    const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const payload: Category = { id, name: cat.name, slug, description: cat.description || '' };
    if (!firebaseUser) {
      setCategories((prev) => [...prev.filter((c) => c.id !== id), payload]);
      await writeAuditLog('SAVE_CATEGORY', 'CATEGORY', id, cat.name);
      showToast('Kategori berhasil disimpan.', 'success');
      return;
    }
    try {
      await setDoc(doc(db, 'categories', id), payload);
      await writeAuditLog('SAVE_CATEGORY', 'CATEGORY', id, cat.name);
      showToast('Kategori berhasil disimpan.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!firebaseUser) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast('Kategori dihapus.', 'info');
      return;
    }
    try {
      await deleteDoc(doc(db, 'categories', id));
      showToast('Kategori dihapus.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  const saveGame = async (game: EducationalGame) => {
    if (!firebaseUser) {
      setGames((prev) => prev.map((g) => (g.id === game.id ? game : g)));
      await writeAuditLog('SAVE_GAME', 'GAME', game.id, game.title);
      showToast('Game edukasi B-EDU disimpan.', 'success');
      return;
    }
    try {
      await setDoc(doc(db, 'educationalGames', game.id), game);
      await writeAuditLog('SAVE_GAME', 'GAME', game.id, game.title);
      showToast('Game edukasi B-EDU disimpan.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `educationalGames/${game.id}`);
    }
  };

  const saveVoucher = async (voucher: Voucher) => {
    if (!firebaseUser) {
      setVouchers((prev) =>
        prev.some((v) => v.id === voucher.id)
          ? prev.map((v) => (v.id === voucher.id ? voucher : v))
          : [voucher, ...prev]
      );
      await writeAuditLog('SAVE_VOUCHER', 'VOUCHER', voucher.id, voucher.title);
      showToast('Voucher Reward Center disimpan.', 'success');
      return;
    }
    try {
      await setDoc(doc(db, 'vouchers', voucher.id), voucher);
      await writeAuditLog('SAVE_VOUCHER', 'VOUCHER', voucher.id, voucher.title);
      showToast('Voucher Reward Center disimpan.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `vouchers/${voucher.id}`);
    }
  };

  const saveTraining = async (training: TrainingProgram) => {
    if (!firebaseUser) {
      setTrainings((prev) =>
        prev.some((t) => t.id === training.id)
          ? prev.map((t) => (t.id === training.id ? training : t))
          : [training, ...prev]
      );
      await writeAuditLog('SAVE_TRAINING', 'TRAINING', training.id, training.title);
      showToast('Program pelatihan disimpan.', 'success');
      return;
    }
    try {
      await setDoc(doc(db, 'trainingPrograms', training.id), training);
      await writeAuditLog('SAVE_TRAINING', 'TRAINING', training.id, training.title);
      showToast('Program pelatihan disimpan.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `trainingPrograms/${training.id}`);
    }
  };

  const saveMentor = async (mentor: Mentor) => {
    if (!firebaseUser) {
      setMentors((prev) =>
        prev.some((m) => m.id === mentor.id)
          ? prev.map((m) => (m.id === mentor.id ? mentor : m))
          : [mentor, ...prev]
      );
      await writeAuditLog('SAVE_MENTOR', 'MENTOR', mentor.id, mentor.name);
      showToast('Data mentor disimpan.', 'success');
      return;
    }
    try {
      await setDoc(doc(db, 'mentors', mentor.id), mentor);
      await writeAuditLog('SAVE_MENTOR', 'MENTOR', mentor.id, mentor.name);
      showToast('Data mentor disimpan.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `mentors/${mentor.id}`);
    }
  };

  const saveMaterial = async (material: LearningMaterial) => {
    if (!firebaseUser) {
      setMaterials((prev) =>
        prev.some((m) => m.id === material.id)
          ? prev.map((m) => (m.id === material.id ? material : m))
          : [material, ...prev]
      );
      await writeAuditLog('SAVE_MATERIAL', 'MATERIAL', material.id, material.title);
      showToast('Konten edukasi disimpan.', 'success');
      return;
    }
    try {
      await setDoc(doc(db, 'learningMaterials', material.id), material);
      await writeAuditLog('SAVE_MATERIAL', 'MATERIAL', material.id, material.title);
      showToast('Konten edukasi disimpan.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `learningMaterials/${material.id}`);
    }
  };

  const saveSystemSettings = async (nextSettings: SystemSetting) => {
    const payload = { ...nextSettings, updatedAt: new Date().toISOString() };
    if (!firebaseUser) {
      setSettings(payload);
      await writeAuditLog('UPDATE_SETTINGS', 'SYSTEM', 'global', 'Pengaturan sistem diperbarui');
      showToast('Pengaturan ekosistem disimpan.', 'success');
      return;
    }
    try {
      await setDoc(doc(db, 'systemSettings', 'global'), payload);
      await writeAuditLog('UPDATE_SETTINGS', 'SYSTEM', 'global', 'Pengaturan sistem diperbarui');
      showToast('Pengaturan ekosistem disimpan.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'systemSettings/global');
    }
  };

  const adminUpdateUserRole = async (uid: string, role: UserRole) => {
    if (!firebaseUser) {
      setAllUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
      await writeAuditLog('UPDATE_USER_ROLE', 'USER', uid, `Peran diubah menjadi ${role}`);
      showToast('Peran pengguna diperbarui.', 'success');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', uid), { role, updatedAt: new Date().toISOString() });
      await writeAuditLog('UPDATE_USER_ROLE', 'USER', uid, `Peran diubah menjadi ${role}`);
      showToast('Peran pengguna diperbarui.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const adminToggleStoreVerification = async (storeId: string, verified: boolean) => {
    if (!firebaseUser) {
      setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, isVerifiedUmkm: verified } : s)));
      await writeAuditLog('VERIFY_UMKM', 'UMKM_STORE', storeId, `Status verifikasi UMKM: ${verified}`);
      showToast('Status verifikasi UMKM diperbarui.', 'success');
      return;
    }
    try {
      await updateDoc(doc(db, 'umkmStores', storeId), {
        isVerifiedUmkm: verified,
        updatedAt: new Date().toISOString(),
      });
      await writeAuditLog('VERIFY_UMKM', 'UMKM_STORE', storeId, `Status verifikasi UMKM: ${verified}`);
      showToast('Status verifikasi UMKM diperbarui.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `umkmStores/${storeId}`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        firebaseUser,
        userProfile,
        isDemoMode,
        isAuthenticated,
        activeUid,
        authLoading,
        activePortal,
        setActivePortal,
        isAdminAccount,
        toast,
        showToast,
        stores,
        categories,
        products,
        reviews,
        verifications,
        verificationHistory,
        games,
        vouchers,
        trainings,
        mentors,
        routineCoaching,
        registeredRoutineIds,
        materials,
        webinars,
        registeredWebinarIds,
        newsArticles,
        readNewsIds,
        savedNewsIds,
        settings,
        favorites,
        cart,
        orders,
        aiConversations,
        marketingContents,
        financialTransactions,
        inventoryMovements,
        userPoints,
        voucherRedemptions,
        trainingRegistrations,
        mentoringSessions,
        notifications,
        storeChats,
        allUsers,
        allOrders,
        auditLogs,
        enterDemoMode,
        switchDemoStore,
        resetDemoData,
        signInWithGoogle,
        logout,
        updateProfile,
        toggleFavorite,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        placeOrder,
        submitReview,
        claimStore,
        createStore,
        updateStore,
        saveProduct,
        removeProduct,
        adjustInventory,
        submitToBChain,
        saveMarketingContent,
        updateMarketingStatus,
        deleteMarketingContent,
        addFinancialTx,
        deleteFinancialTx,
        updateOrderStatus,
        completeQuizGame,
        claimDailyStreak,
        crackEggReward,
        redeemVoucher,
        registerTraining,
        registerRoutineCoaching,
        registerWebinar,
        markNewsRead,
        toggleSaveNews,
        bookMentoring,
        saveAiConversation,
        sendStoreChatMessage,
        markNotificationRead,
        verifyBChainRecord,
        saveCategory,
        deleteCategory,
        saveGame,
        saveVoucher,
        saveTraining,
        saveMentor,
        saveMaterial,
        saveSystemSettings,
        adminUpdateUserRole,
        adminToggleStoreVerification,
        seedInitialDataToFirestore,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
