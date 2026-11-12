export type UserRole = 'customer' | 'umkm' | 'admin';

export type BChainStatus = 'VERIFIED' | 'PENDING VERIFICATION' | 'NOT VERIFIED';

export type OrderStatus =
  | 'Menunggu Konfirmasi'
  | 'Diproses'
  | 'Dikirim'
  | 'Selesai'
  | 'Dibatalkan';

export type ContentStatus = 'Draft' | 'Scheduled' | 'Published';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  managedStoreId?: string | null;
  points: number;
  phone?: string;
  address?: string;
  city?: string;
  streakCount?: number;
  lastCheckInDate?: string;
  eggTickets?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreMilestone {
  year: string;
  title: string;
  detail: string;
}

export interface UmkmStore {
  id: string;
  name: string;
  description: string | null;
  category: string;
  city: string | null;
  address: string | null;
  whatsapp: string | null;
  ownerName: string | null;
  ownerUid: string | null;
  photoUrl: string | null;
  legalitySummary: string | null;
  foundedYear?: string | null;
  foundingStory?: string | null;
  milestones?: StoreMilestone[];
  isVerifiedUmkm: boolean;
  isInitialStore?: boolean;
  ratingAvg: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  storeOwnerUid: string | null;
  name: string;
  category: string;
  description: string;
  composition: string | null;
  specifications: string | null;
  price: number | null;
  stock: number | null;
  initialStock: number | null;
  soldCount: number;
  ratingAvg: number;
  reviewCount: number;
  productionDate: string | null;
  expiryDate: string | null;
  legalityNumber: string | null;
  photoUrl: string | null;
  videoUrl?: string | null;
  videoTitle?: string | null;
  isPublished: boolean;
  bchainStatus: BChainStatus;
  bchainId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'INITIAL' | 'ORDER';
  qty: number;
  previousStock: number;
  newStock: number;
  note: string;
  actorUid: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  storeId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  photoUrl?: string | null;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  storeId: string;
  storeName: string;
  productName: string;
  price: number;
  quantity: number;
  photoUrl: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerUid: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  storeId: string;
  storeName: string;
  storeOwnerUid: string | null;
  items: CartItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVerification {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  productCode: string;
  batchNumber: string | null;
  productionDate: string | null;
  shelfLife: string | null;
  expiryDate: string | null;
  legalityInfo: string | null;
  status: BChainStatus;
  txId: string;
  blockchainHash: string;
  blockNumber: number;
  network: string;
  submittedByUid: string | null;
  verifiedByUid: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationHistoryItem {
  id: string;
  verificationId: string;
  productId: string;
  productName: string;
  action: string;
  status: BChainStatus;
  txId: string;
  blockchainHash: string;
  note: string;
  actorUid: string;
  actorName: string;
  createdAt: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  messages: AiChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketingContent {
  id: string;
  storeId: string;
  ownerUid: string;
  productId?: string | null;
  productName?: string | null;
  channel: 'Instagram' | 'Facebook' | 'WhatsApp Business' | 'B-Market Promo';
  title: string;
  headline: string;
  caption: string;
  cta: string;
  scheduledDate: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialTransaction {
  id: string;
  storeId: string;
  ownerUid: string;
  type: 'PEMASUKAN' | 'PENGELUARAN';
  category: string;
  description: string;
  amount: number;
  date: string;
  source: string;
  orderId?: string | null;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface EducationalGame {
  id: string;
  title: string;
  category: string;
  description: string;
  pointsPerCorrect: number;
  isActive: boolean;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface UserPoint {
  id: string;
  userId: string;
  amount: number;
  type: 'EARN' | 'REDEEM';
  reason: string;
  createdAt: string;
}

export interface Voucher {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  discountLabel: string;
  quota: number;
  isActive: boolean;
  createdAt: string;
}

export interface VoucherRedemption {
  id: string;
  userId: string;
  voucherId: string;
  voucherTitle: string;
  voucherCode: string;
  pointsSpent: number;
  status: 'Aktif' | 'Terpakai';
  redeemedAt: string;
}

export interface TrainingProgram {
  id: string;
  title: string;
  mode: 'Online' | 'Offline';
  schedule: string;
  location: string;
  description: string;
  quota: number;
  registeredCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface TrainingRegistration {
  id: string;
  programId: string;
  programTitle: string;
  userId: string;
  storeId: string;
  storeName: string;
  applicantName: string;
  status: 'Terdaftar' | 'Selesai' | 'Dibatalkan';
  createdAt: string;
}

export interface Mentor {
  id: string;
  name: string;
  expertise: string;
  bio: string;
  schedule: string;
  mode?: 'Online' | 'Offline' | 'Hybrid';
  city?: string;
  rating?: number;
  sessionsCompleted?: number;
  isActive: boolean;
  createdAt: string;
}

export interface RoutineCoachingSchedule {
  id: string;
  title: string;
  dayOfWeek: string;
  timeWib: string;
  frequency: 'Mingguan' | 'Dua Mingguan' | 'Bulanan';
  mode: 'Online' | 'Offline';
  locationOrLink: string;
  mentorName: string;
  topic: string;
  quota: number;
  registeredCount: number;
}

export interface MentoringSession {
  id: string;
  mentorId: string;
  mentorName: string;
  userId: string;
  storeId: string;
  storeName: string;
  topic: string;
  requestedDate: string;
  status: 'Menunggu Jadwal' | 'Disetujui' | 'Selesai';
  createdAt: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  category: string;
  type: 'Modul Digital' | 'Video Pembelajaran' | 'Program Pendampingan';
  duration: string;
  summary: string;
  content: string;
  createdAt: string;
}

export interface BEduWebinar {
  id: string;
  title: string;
  speaker: string;
  speakerRole: string;
  dateLabel: string;
  timeWib: string;
  mode: 'Live Webinar' | 'Hybrid Event' | 'Rekaman On-Demand';
  status: 'Pendaftaran Dibuka' | 'Segera Tayang' | 'Tersedia Rekaman';
  topic: string;
  description: string;
  bannerImage: string;
  quota: number;
  registeredCount: number;
  pointsReward: number;
  highlights: string[];
}

export interface BEduNewsArticle {
  id: string;
  title: string;
  category: 'UMKM Viral' | 'Kisah Sukses' | 'Tren Pasar & Ekspor' | 'Tips Bisnis & Halal';
  source: string;
  publishedAt: string;
  readTime: string;
  isViral: boolean;
  viewsLabel: string;
  imageUrl: string;
  summary: string;
  content: string;
  relatedStoreId?: string;
  keyTakeaways: string[];
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface SystemSetting {
  id: string;
  promoBannerTitle: string;
  promoBannerSubtitle: string;
  pointsPerQuizCorrect: number;
  pointsPerOrder: number;
  bchainNetwork: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface StoreChatMessage {
  id: string;
  storeId: string;
  storeName: string;
  customerUid: string;
  customerName: string;
  productId?: string | null;
  productName?: string | null;
  senderRole: 'customer' | 'umkm';
  senderName: string;
  text: string;
  createdAt: string;
}

