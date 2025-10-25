// File: lib/types.ts
import {
  Client,
  // Environment, // Removed
  // Host, // Removed
  // HostShift, // Removed
  Partner,
  // PartnerPayout, // Removed for MVP
  Product,
  // PromotionBulletin, // Removed for MVP
  Sale,
  Staff,
  StaffCommission,
  Visit ,
  StaffShift,
  SeatingArea, // Added
  Entertainer, // Added
  VinylRecord, // Added
  Prisma
} from "@prisma/client";

// ---
// 1. SESSION & AUTH TYPES
// ---
export type StaffSession = {
  id: number;
  name: string;
  role: string; // Keep as string, maps to StaffRole enum
  isLoggedIn: true;
  shiftId?: number; // Keep potentially for shift tracking
  pin?: string; // Keep for session validation if needed elsewhere
};

// ---
// 2. API RESPONSE TYPES
// ---
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// ---
// 3. STAFF TAB (Keep)
// ---
export type StaffWithShifts = Staff & {
  shifts: StaffShift[];
};

// ---
// 4. CLIENTS TAB (Keep, simplify relations if needed)
// ---
// Basic Client type from API list might not need deep relations
// type ClientListItem = Omit<Client, 'crmData'>; // Example if needed

// Detailed Client type including visits and sales (keep for detail page)
export type ClientDetails = Client & {
  visits: (Visit & {
    sales: (Sale & { product: Product })[]; // Removed host from sales
    seatingArea: SeatingArea | null; // Added SeatingArea relationship
  })[];
  _count: {
    visits: number;
  };
};
// Alias for ClientDetailPage usage
export type ClientWithDetails = ClientDetails;
// Alias for ClientVisitHistory usage (Update if structure changed)
export type VisitWithSalesAndArea = ClientDetails['visits'][number]; // Renamed for clarity


// ---
// 5. HOSTESSES TAB (Removed)
// ---
// Removed HostessWithShifts type


// ---
// 6. PROMOTIONS TAB (Removed for MVP)
// ---
// Removed PromotionWithProduct type


// ---
// 7. INVENTORY (BAR) TAB (Keep)
// ---
export type AggregatedStock = {
  inventoryItemId: number;
  name: string;
  smallestUnit: string; // Should map to UnitOfMeasure enum
  totalStock: number;
  reorderThreshold: number | null;
};


// ---
// 8. LIVE DATA (Simplified for MVP / Refactoring Needed)
// ---
// These types might be deprecated or need significant rework as Hostesses are removed
// and LiveClient definition changes (no credit).

// Kept for potential use in listing active clients, but credit removed
export type LiveClient = {
  visitId: number;
  clientId: number | null; // Client ID might be null initially
  name: string | null; // Name might be null
  // consumableCreditRemaining: number; // Removed credit system
  seatingAreaId?: number | null; // Add seating area if needed
  seatingAreaName?: string | null; // Add seating area name if needed
};

// REMOVED LiveHostess type

// LiveData needs updating to reflect changes
export type LiveData = {
  // clients: LiveClient[]; // Keep or refactor based on needs
  // hostesses: LiveHostess[]; // Removed
  products: Product[]; // Keep for ProductSelector
  seatingAreas?: SeatingAreaWithVisit[]; // Add seating areas if fetched here
};

// Type for API endpoint fetching seating areas with occupancy
export type SeatingAreaWithVisit = SeatingArea & {
  visits: (Visit & { client: { name: string | null } | null })[];
};


// Cart Item for POS page (Keep)
export type CartItem = {
  product: Product;
  quantity: number;
};

// Simplified SalePayload for Acaia MVP
export interface AcaiaSalePayload {
  seatingAreaId: number; // Use SeatingArea ID
  cart: {
    productId: number;
    quantity: number;
  }[];
  // staffId is added on the backend from session
}
// Removed old SalePayload type


// ---
// 9. FINANCIALS TAB (Simplified for MVP)
// ---
// StaffCommission detail (Keep)
export type StaffCommissionWithDetails = StaffCommission & {
  staff: { name: string }; // Keep relation minimal
  relatedSale: Sale | null;
  relatedClient: Client | null;
};

// PartnerPayout detail (Removed for MVP)
// Removed PartnerPayoutWithDetails type

// Hostess Payout Summary (Removed)
// Removed HostessPayoutSummary type


// FinancialsData simplified
export type FinancialsData = {
  staffCommissions: StaffCommissionWithDetails[];
  // partnerPayouts: PartnerPayoutWithDetails[]; // Removed for MVP
  // hostessPayouts: HostessPayoutSummary[]; // Removed
};

// ---
// 10. REPORTS / BI TAB (Keep - Hostess part will be empty/removed)
// ---

// Keep ReportStat
export type ReportStat = { title: string; value: string };
// Keep SalesDataPoint
export type SalesDataPoint = { date: string; Revenue: number }; // Used Revenue based on route

// Hostess Leaderboard Item (Will be unused, keep type for now to avoid breaking ReportData)
export type HostessLeaderboardItem = { name: string; Sales: number };

// Product Leaderboard Item (Update based on reports route if needed)
export type ProductLeaderboardItem = { name: string; Sales: number }; // Kept 'Sales' based on route


// ReportData (Keep structure, Hostess part will be empty)
export type ReportData = {
  kpis: {
    totalRevenue: number;
    totalSales: number;
    avgSaleValue: number;
    newClients: number;
  };
  salesOverTime: { date: string; Revenue: number }[];
  hostessLeaderboard: HostessLeaderboardItem[]; // Will be empty array
  productLeaderboard: ProductLeaderboardItem[];
};


// ---
// 11. QR / CLIENT TOKEN (Removed old types)
// ---
// Removed QrTokenPayload type
// Removed ClientTokenPayload type

// Add types related to Seating Area QR if needed later (e.g., if token verification happens client-side)
// No specific types needed just for the menu page URL structure.