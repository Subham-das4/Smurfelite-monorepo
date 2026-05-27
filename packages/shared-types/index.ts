import {
  Role,
  OrderStatus,
  User,
  ProductStatus,
  PaymentStatus,
  DisputeStatus,
  WalletLedgerType,
} from "./src/generated/prisma/index";

export * from "./src/generated/prisma/index";

// ─────────────────────────────────────────
// Enquiry
// ─────────────────────────────────────────

export interface EnquiryPayload {
  message: string;
  name: string;
  email: string;
  phone?: string;
}

export interface EnquiryResponse {
  id: string;
  subject: string;
  message: string;
  name: string;
  email: string;
  phone: string | null;
  isClosed: boolean;
  createdAt: string;
  userId: string | null;
}

// ─────────────────────────────────────────
// Auth
// ─────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface BaseResponse {
  success: boolean;
}

export interface LoginResponse {
  user: Omit<User, "password">;
  accessToken: string;
  refreshToken: string;
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ValidateOtpRequest {
  email: string;
  otp: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  message: string;
  user: Omit<User, "password">;
}

export interface GoogleOAuthResponse {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  nbf: number;
  name: string;
  picture: string;
}

// ─────────────────────────────────────────
// User Profile
// ─────────────────────────────────────────

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
  isVerified: boolean;
  googleProfilePicture: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  name?: string;
  googleProfilePicture?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ─────────────────────────────────────────
// Products
// ─────────────────────────────────────────

export interface ProductFilters {
  page?: number;
  pageSize?: number;
  gameType?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ProductMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: string;
}

/** Safe public product — no encrypted credential fields */
export interface ProductListItem {
  id: string;
  gameType: string;
  title: string;
  description: string | null;
  price: number;
  status: ProductStatus;
  sellerDelisted: boolean;
  isAvailable: boolean;
  specifications: Record<string, unknown>;
  imageUrl: string | null;
  sellerId: string;
  gameCategoryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  products: ProductListItem[];
  meta: ProductMeta;
}

export interface CreateProductRequest {
  gameType: string;
  gameCategoryId?: string;
  title: string;
  description?: string;
  price: number;
  specifications: Record<string, unknown>;
  sellerId: string;
  imageUrl?: string;
  accountUsername: string;
  accountPassword: string;
  accountEmail: string;
  accountEmailPassword: string;
}

export interface UpdateProductRequest {
  gameType?: string;
  gameCategoryId?: string | null;
  title?: string;
  description?: string;
  price?: number;
  specifications?: Record<string, unknown>;
  imageUrl?: string;
  status?: ProductStatus;
  sellerDelisted?: boolean;
  isAvailable?: boolean;
  accountUsername?: string;
  accountPassword?: string;
  accountEmail?: string;
  accountEmailPassword?: string;
}

// ─────────────────────────────────────────
// Cart
// ─────────────────────────────────────────

export interface CartProductSummary {
  id: string;
  title: string;
  gameType: string;
  price: number;
  specifications: Record<string, unknown>;
  imageUrl: string | null;
}

export interface CartItemResponse {
  cartId: string;
  productId: string;
  quantity: number;
  product: CartProductSummary;
}

export interface CartResponse {
  items: CartItemResponse[];
  count: number;
  totalPrice: number;
}

// ─────────────────────────────────────────
// Orders
// ─────────────────────────────────────────

export { ORDER_SERVICE_FEE_USD } from "./pricing";

export interface CreateOrderRequest {
  productIds: string[];
}

export interface OrderProductSummary {
  id: string;
  title: string;
  gameType: string;
  price: number;
  imageUrl: string | null;
}

export interface OrderItemResponse {
  orderId: string;
  productId: string;
  priceAtPurchase: number;
  quantity: number;
  product?: OrderProductSummary;
}

export interface OrderResponse {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paymentIntent: string | null;
  paymentProvider: string | null;
  buyerId: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemResponse[];
}

export interface OrderCredential {
  productId: string;
  title: string;
  gameType: string;
  accountUsername: string;
  accountPassword: string;
  accountEmail: string;
  accountEmailPassword: string;
}

export interface OrderCredentialsResponse {
  orderId: string;
  credentials: OrderCredential[];
}

// ─────────────────────────────────────────
// Payments — PayPal
// ─────────────────────────────────────────

export interface CreatePayPalOrderRequest {
  internalOrderId: string;
}

export interface CreatePayPalOrderResponse {
  paypalOrderId: string;
  status: string;
}

export interface CapturePayPalOrderRequest {
  paypalOrderId: string;
  internalOrderId: string;
}

export interface CapturePayPalOrderResponse {
  message: string;
  order: OrderResponse;
}

// ─────────────────────────────────────────
// Payments — NOWPayments (crypto invoice)
// ─────────────────────────────────────────

export interface CreateNowPaymentsInvoiceRequest {
  internalOrderId: string;
}

export interface CreateNowPaymentsInvoiceResponse {
  invoiceUrl: string;
  invoiceId: string;
}

// ─────────────────────────────────────────
// Payments — bypass (dev/E2E)
// ─────────────────────────────────────────

export interface PaymentBypassStatusResponse {
  enabled: boolean;
}

export interface CompleteBypassPaymentRequest {
  internalOrderId: string;
}

export interface CompleteBypassPaymentResponse {
  message: string;
  order: OrderResponse;
}

// ─────────────────────────────────────────
// Email (Phase 3.1)
// ─────────────────────────────────────────

export type EmailSenderKey = 'purchase' | 'help' | 'finance';

export interface EmailSenderProfile {
  address: string;
  name: string;
  credentialsConfigured: boolean;
}

export interface EmailModuleStatusResponse {
  smtpConfigured: boolean;
  mockTransport: boolean;
  senders: Record<EmailSenderKey, EmailSenderProfile>;
}

// ─────────────────────────────────────────
// Game categories (Phase 5 API)
// ─────────────────────────────────────────

export interface GameCategoryResponse {
  id: string;
  name: string;
  slug: string;
  isRestricted: boolean;
  createdAt: string;
}

export interface CreateGameCategoryRequest {
  name: string;
  slug: string;
  isRestricted?: boolean;
}

// ─────────────────────────────────────────
// Disputes (Phase 5 API)
// ─────────────────────────────────────────

export interface DisputeResponse {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  status: DisputeStatus;
  reason: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisputeRequest {
  orderId: string;
  reason: string;
  details?: Record<string, unknown>;
}

// ─────────────────────────────────────────
// Wallet (Phase 5 API)
// ─────────────────────────────────────────

export interface WalletResponse {
  userId: string;
  pendingBalance: number;
  availableBalance: number;
  frozenBalance: number;
  updatedAt: string;
}

export interface WalletLedgerEntry {
  id: string;
  walletUserId: string;
  type: WalletLedgerType;
  amount: number;
  orderId: string | null;
  disputeId: string | null;
  note: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface AdminProductListItem extends ProductListItem {
  deletedAt?: string | null;
  sellerEmail: string;
  sellerName: string;
}

export interface AdminProductListResponse {
  products: AdminProductListItem[];
  meta: PaginationMeta;
}

export interface SellerSaleLine {
  orderId: string;
  productId: string;
  productTitle: string;
  gameType: string;
  buyerEmail: string;
  buyerName: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  priceAtPurchase: number;
  quantity: number;
  lineTotal: number;
  soldAt: string;
  orderCreatedAt: string;
}

export interface SellerSalesResponse {
  sales: SellerSaleLine[];
  meta: PaginationMeta;
}

export interface WalletLedgerListResponse {
  entries: WalletLedgerEntry[];
  meta: PaginationMeta;
}

export interface AdminWalletListItem {
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  pendingBalance: number;
  availableBalance: number;
  frozenBalance: number;
  updatedAt: string | null;
}

export interface AdminWalletListResponse {
  wallets: AdminWalletListItem[];
  meta: PaginationMeta;
}

export interface AdminWalletDetailResponse extends WalletResponse {
  sellerEmail: string;
  sellerName: string;
}

export interface RecordPayoutRequest {
  amount: number;
  note?: string;
}

export interface OrderCredentialsLine {
  productId: string;
  title: string;
  gameType: string;
  accountUsername: string;
  accountPassword: string;
  accountEmail: string;
  accountEmailPassword: string;
}

export interface OrderCredentialsResponse {
  orderId: string;
  credentials: OrderCredentialsLine[];
}
