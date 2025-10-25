import {
  Client,
  Environment,
  Host,
  HostShift,
  Partner,
  PartnerPayout,
  Product,
  PromotionBulletin,
  Sale,
  Staff,
  StaffCommission,
  Visit ,
  StaffShift,
  Prisma
} from "@prisma/client";

// ---
// 1. SESSION & AUTH TYPES
// ---
export type StaffSession = {
  id: number;
  name: string;
  role: string;
  isLoggedIn: true;
  shiftId?: number; // Added shiftId based on sales route usage
  pin?: string; // Added pin based on sales route usage (admin check)
};

// ---
// 2. API RESPONSE TYPES
// ---
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string; // This is the fix for the build error
  message?: string; // Added based on auth route usage
};

// ---
// 3. STAFF TAB
// ---
export type StaffWithShifts = Staff & {
  shifts: StaffShift[];
};

// ---
// 4. CLIENTS TAB
// ---
export type ClientWithVisits = Client & {
  visits: Visit[];
  _count: {
    visits: number;
  };
};

export type ClientDetails = Client & {
  visits: (Visit & {
    sales: (Sale & { product: Product, host: Host | null })[]; // Added host to sales
  })[];
  _count: {
    visits: number;
  };
};
// Alias for ClientDetailPage usage
export type ClientWithDetails = ClientDetails;
// Alias for ClientVisitHistory usage
export type VisitWithSales = ClientDetails['visits'][number];


// ---
// 5. HOSTESSES TAB
// ---
export type HostessWithShifts = Host & {
  shifts: HostShift[];
};

// ---
// 6. PROMOTIONS TAB
// ---
export type PromotionWithProduct = PromotionBulletin & {
  product: Product | null;
};

// ---
// 7. INVENTORY (BAR) TAB
// ---
export type AggregatedStock = {
  inventoryItemId: number;
  name: string;
  smallestUnit: string;
  totalStock: number; // Renamed from currentStock based on inventory route
  reorderThreshold: number | null;
};


// ---
// 8. LIVE DATA (POS & LIVE MAP)
// ---
export type LiveClient = {
  visitId: number;
  clientId: number;
  name: string;
  consumableCreditRemaining: number; // Changed back to number based on CheckoutModal usage
};

export type LiveHostess = {
  shiftId: number;
  hostId: number;
  stageName: string;
};

export type LiveData = {
  clients: LiveClient[];
  hostesses: LiveHostess[];
  products: Product[];
};

// Cart Item for POS page
export type CartItem = {
  product: Product;
  quantity: number;
};

// *** ADDED THIS TYPE ***
export type SalePayload = {
  visitId: number;
  hostId: number;
  cart: {
    productId: number;
    quantity: number;
  }[];
};
// *** END OF ADDED TYPE ***

// ---
// 9. FINANCIALS TAB
// ---
// Needed for StaffPayoutTable
export type StaffCommissionWithDetails = StaffCommission & {
  staff: { name: string };
  relatedSale: Sale | null;
  relatedClient: Client | null;
};

// Needed for PartnerPayoutTable
export type PartnerPayoutWithDetails = PartnerPayout & {
  partner: Partner;
  sale: Sale & { product: Product };
};

// FIX: Renamed this type alias to avoid conflict with model name
export type HostessPayoutSummary = {
  hostId: number;
  stageName: string;
  totalUnpaidCommissions: string | number; // Kept as string | number based on api route fix
};


export type FinancialsData = {
  staffCommissions: StaffCommissionWithDetails[]; // Use the detailed type
  partnerPayouts: PartnerPayoutWithDetails[]; // Use the detailed type
  hostessPayouts: HostessPayoutSummary[]; // Use the renamed type alias
  // Removed staffPayouts as it was empty and staffCommissions covers it
};

// ---
// 10. REPORTS / BI TAB
// ---

// Added based on reports route usage
export type ReportStat = { title: string; value: string };
export type SalesDataPoint = { date: string; sales: number }; // Used 'sales' based on SalesChart component
export type HostessLeaderboardItem = { hostId: number; stageName: string; totalSales: number };
export type ProductLeaderboardItem = { productId: number; name: string; totalSold: number }; // Added totalSold based on Leaderboards component


// FIX: Corrected ReportData structure based on reports route implementation
export type ReportData = {
  kpis: {
    totalRevenue: number;
    totalSales: number;
    avgSaleValue: number;
    newClients: number;
  };
  salesOverTime: { date: string; Revenue: number }[]; // Changed sales to Revenue based on route
  hostessLeaderboard: { name: string; Sales: number }[]; // Changed totalSales to Sales based on route
  productLeaderboard: { name: string; Sales: number }[]; // Changed totalSold to Sales based on route
};


// ---
// 11. QR / CLIENT TOKEN
// ---
export type QrTokenPayload = {
  token: string;
  qrCodeUrl: string;
  visitId?: number; // Added based on qr route usage
  clientId?: number; // Added based on qr route usage
};

// Added based on qr lib usage
export type ClientTokenPayload = {
  visitId: number;
  clientId: number;
};