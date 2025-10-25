// File: lib/types.ts
import {
    Client,
    Partner,
    Product,
    Sale,
    Staff,
    StaffCommission,
    Visit ,
    StaffShift,
    SeatingArea, // Added
    Entertainer, // Added
    VinylRecord, // Added
    Prisma,
    ClientStatus, // Added
    InventoryItem, // Added
    StockMovementType, // Added
    UnitOfMeasure // Added
} from "@prisma/client";

// ---
// 1. SESSION & AUTH TYPES
// ---
export type StaffSession = {
    id: number;
    name: string;
    role: string; // Keep as string, maps to StaffRole enum
    isLoggedIn: boolean; // Changed to boolean for clarity, always true if present
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
// Detailed Client type including visits and sales (keep for detail page)
// Adjusted Sale relation to include staff instead of host
export type ClientDetails = Client & {
    visits: (Visit & {
        seatingArea: SeatingArea | null; // Added SeatingArea relationship
        sales: (Sale & {
             product: Product | null; // Product can be null if deleted
             staff: { name: string } | null; // Staff who processed sale
        })[];
    })[];
    _count: {
        visits: number;
    };
};
// Alias for ClientDetailPage usage
export type ClientWithDetails = ClientDetails;

// Alias for ClientVisitHistory usage
// Updated to reflect nested structure and staff relation
export type VisitWithSalesAndArea = Visit & {
    seatingArea: SeatingArea | null;
    sales: (Sale & {
         product: Product | null;
         staff: { name: string } | null; // Changed from host to staff
    })[];
};


// ---
// 5. HOSTESSES TAB (Removed)
// ---


// ---
// 6. PROMOTIONS TAB (Removed for MVP)
// ---


// ---
// 7. INVENTORY (BAR) TAB (Keep)
// ---
export type AggregatedStock = {
    inventoryItemId: number;
    name: string;
    smallestUnit: UnitOfMeasure; // Changed from string to enum type
    totalStock: number; // Changed from currentStock
    reorderThreshold: number | null;
};


// ---
// 8. LIVE DATA (Simplified for MVP)
// ---
// Simplified LiveClient type (no credit)
export type LiveClient = {
    visitId: number;
    clientId: number | null;
    name: string | null;
    seatingAreaId?: number | null;
    seatingAreaName?: string | null;
};

// Type for API endpoint fetching seating areas with occupancy
export type SeatingAreaWithVisit = SeatingArea & {
    // visits array contains active visits for this area
    visits: ({
        id: number;
        clientId: number | null;
        client: { name: string | null } | null;
    })[]; // Simplified visit info
};
// Alias needed by SeatingAreaSelector
export type SeatingAreaWithVisitInfo = SeatingAreaWithVisit;


// LiveData includes active clients and products for POS selector
export type LiveData = {
    // --- FIX: Added clients property back ---
    clients: LiveClient[];
    products: Product[]; // Keep for ProductSelector
    seatingAreas?: SeatingAreaWithVisit[]; // Keep optional for POS initial load maybe
};


// ---
// 9. CART & POS TYPES (Keep/Refactor)
// ---
// Cart Item for POS page
export type CartItem = {
    product: Product; // Product prices might be string initially if serialized
    quantity: number;
};

// Simplified SalePayload for Acaia MVP (Defined inline in API route)
// interface AcaiaSalePayload { ... }


// ---
// 10. FINANCIALS TAB (Simplified for MVP)
// ---
// StaffCommission detail
export type StaffCommissionWithDetails = StaffCommission & {
    staff: { name: string };
    relatedSale: (Sale & { product?: Product | null }) | null; // Include product in related sale
    relatedClient: { name: string | null } | null; // Select client name
};

// Partner Payouts removed for MVP

// Hostess Payouts removed for MVP


// FinancialsData simplified
export type FinancialsData = {
    staffCommissions: StaffCommissionWithDetails[];
    // partnerPayouts removed
    // hostessPayouts removed
};

// ---
// 11. REPORTS / BI TAB (Simplified)
// ---
// ReportStat remains the same
export type ReportStat = { title: string; value: string };
// SalesDataPoint remains the same
export type SalesDataPoint = { date: string; Revenue: number };

// Hostess Leaderboard removed

// Product Leaderboard Item (Simplified - using Sale data directly in API)
export type ProductLeaderboardItem = {
    productId: number;
    name: string;
    totalQuantitySold: number; // Based on quantity
    // totalRevenueGenerated: number; // Or based on revenue
};


// ReportData simplified
export type ReportData = {
    kpis: {
        totalRevenue: number;
        totalSales: number; // Count of Sale records
        avgSaleValue: number;
        newClients: number;
    };
    salesOverTime: { date: string; Revenue: number }[]; // Keep Revenue field name for consistency
    // hostessLeaderboard removed
    productLeaderboard: ProductLeaderboardItem[];
};


// ---
// 12. QR / TOKEN TYPES (Removed/Unused for MVP)
// ---