// File: lib/types.ts
import {
    Client, Partner, Product as PrismaProduct, Sale, Staff, StaffCommission, Visit , StaffShift,
    SeatingArea, Entertainer, VinylRecord, Prisma, ClientStatus, InventoryItem,
    StockMovementType, UnitOfMeasure, ProductType, PrepStation // Added ProductType, PrepStation
} from "@prisma/client";

// --- Client-side Product type with number prices ---
// Type representing Product after Decimal fields are converted to numbers
export type Product = Omit<PrismaProduct, 'costPrice' | 'salePrice' | 'deductionAmountInSmallestUnit'> & {
    costPrice: number;
    salePrice: number;
    deductionAmountInSmallestUnit: number;
    // Relations might also need serialization if they contain Decimals
    inventoryItem: (Omit<InventoryItem, 'storageUnitSizeInSmallest' | 'reorderThresholdInSmallest' | 'createdAt'> & { // Added createdAt omission
        storageUnitSizeInSmallest: number | null;
        reorderThresholdInSmallest: number | null;
        smallestUnit: UnitOfMeasure; // Ensure correct enum
    }) | null;
    partner: Partner | null;
};

// --- Cart Item for POS page (Uses Product with number prices) ---
// --- FIX: Update CartItem to use the client-side Product type ---
export type CartItem = {
  product: Product; // Use the Product type defined above
  quantity: number;
};


// --- SESSION & AUTH TYPES ---
export type StaffSession = {
    id: number; name: string; role: string; isLoggedIn: boolean; shiftId?: number; pin?: string;
};

// --- API RESPONSE ---
export type ApiResponse<T = unknown> = {
    success: boolean; data?: T; error?: string; message?: string;
};

// --- STAFF ---
export type StaffWithShifts = Staff & { shifts: StaffShift[] };

// --- CLIENTS ---
// Updated Sale relation
export type ClientDetails = Client & {
    visits: (Visit & {
        seatingArea: SeatingArea | null;
        sales: (Sale & {
             product: PrismaProduct | null; // API might return PrismaProduct initially
             staff: { name: string } | null;
        })[];
    })[];
    _count: { visits: number };
};
export type ClientWithDetails = ClientDetails;

// Updated Sale relation
export type VisitWithSalesAndArea = Visit & {
    seatingArea: SeatingArea | null;
    sales: (Sale & {
         product: PrismaProduct | null; // API might return PrismaProduct initially
         staff: { name: string } | null;
    })[];
};

// --- INVENTORY ---
export type AggregatedStock = {
    inventoryItemId: number; name: string; smallestUnit: UnitOfMeasure;
    totalStock: number; reorderThreshold: number | null;
};

// --- LIVE DATA ---
export type LiveClient = {
    visitId: number; clientId: number | null; name: string | null;
    seatingAreaId?: number | null; seatingAreaName?: string | null;
};

export type SeatingAreaWithVisit = SeatingArea & {
    visits: ({ id: number; clientId: number | null; client: { name: string | null } | null; })[];
};
export type SeatingAreaWithVisitInfo = SeatingAreaWithVisit;

export type LiveData = {
    clients: LiveClient[];
    products: Product[]; // API returns Product with number prices now
    seatingAreas?: SeatingAreaWithVisit[];
};

// --- POS ---
// AcaiaSalePayload defined inline in API route

// --- FINANCIALS ---
// Updated relatedSale type
export type StaffCommissionWithDetails = StaffCommission & {
    staff: { name: string };
    relatedSale: (Sale & { product?: PrismaProduct | null }) | null; // API might return PrismaProduct
    relatedClient: { name: string | null } | null;
};

export type FinancialsData = {
    staffCommissions: StaffCommissionWithDetails[];
};

// --- REPORTS ---
export type ReportStat = { title: string; value: string };
export type SalesDataPoint = { date: string; Revenue: number };

export type ProductLeaderboardItem = {
    productId: number | null; // Allow null from groupBy
    name: string;
    totalQuantitySold: number;
};

export type ReportData = {
    kpis: { totalRevenue: number; totalSales: number; avgSaleValue: number; newClients: number; };
    salesOverTime: { date: string; Revenue: number }[];
    productLeaderboard: ProductLeaderboardItem[];
};