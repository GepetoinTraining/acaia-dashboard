// File: lib/types.ts
import {
    Client, Partner, Product as PrismaProduct, /* Sale, */ User, StaffCommission, Visit , /* StaffShift, */ // Removed Sale, StaffShift
    SeatingArea, Entertainer, VinylRecord, Prisma, ClientStatus, /* InventoryItem, */ // Removed InventoryItem
    /* StockMovementType, UnitOfMeasure, */ ProductType, Workstation, Ingredient, StockHolding as PrismaStockHolding, VenueObject, Order, // Added Order
    // Add new Prisma types
    PrepRecipe as PrismaPrepRecipe,
    PrepRecipeInput as PrismaPrepRecipeInput,
    PrepTask as PrismaPrepTask,
    Role // Ensure Role is imported if used directly (e.g., in StaffSession)
} from "@prisma/client";

// --- Client-side Product type with string prices ---
// Type representing Product after Decimal fields are converted to strings FOR API RESPONSE
export type Product = Omit<PrismaProduct, 'price'> & {
    price: string; // Price is a string from the API
    prepStation: Workstation; // Include prep station
};

// --- Cart Item for POS page (Receives Product with string prices from API) ---
export type CartItem = {
  product: Product; // Uses the Product type with string price
  quantity: number;
};


// --- SESSION & AUTH TYPES ---
// Updated to use User model fields
export type StaffSession = {
    id: string; // User ID is string (cuid)
    name: string;
    role: Role; // Use Role enum
    isLoggedIn: boolean;
};

// --- API RESPONSE ---
export type ApiResponse<T = unknown> = {
    success: boolean; data?: T; error?: string; message?: string;
};

// --- STAFF (Now USER) ---
// Type for User with simplified workstation info (if assigned)
export type UserWithWorkstation = User & {
    workstation: Workstation | null;
}

// --- CLIENTS ---
// Types using Order instead of Sale
export type ClientDetails = Client & {
    visits: (Visit & {
        seatingArea: SeatingArea | null; // SeatingArea might become VenueObject later
        orders: (Order & { // Using Order
             items: ({ product: PrismaProduct | null } & Record<string, unknown>)[];
             handledBy: ({ user: { name: string } | null } & Record<string, unknown>)[];
        })[];
    })[];
    wallet: ({ balance: Prisma.Decimal | null } & Record<string, unknown>) | null;
    _count: { visits: number };
};
export type ClientWithDetails = ClientDetails;

export type VisitWithOrdersAndArea = Visit & {
    seatingArea: SeatingArea | null; // SeatingArea might become VenueObject later
    orders: (Order & {
         items: ({ product: PrismaProduct | null } & Record<string, unknown>)[];
         handledBy: ({ user: { name: string } | null } & Record<string, unknown>)[];
    })[];
};

// --- INVENTORY ---
// Ingredient Definition (as returned by API)
export type SerializedIngredientDef = Omit<Ingredient, "costPerUnit"> & {
  costPerUnit: string;
  isPrepared: boolean;
};

// Stock Holding (as returned by API)
export type SerializedStockHolding = Omit<PrismaStockHolding, 'quantity' | 'costAtAcquisition'> & {
    quantity: string;
    costAtAcquisition: string | null;
    ingredient: { name: string; unit: string };
    location: { name: string };
};

// Aggregated Stock (as returned by API)
export type AggregatedIngredientStock = {
    ingredientId: string;
    name: string;
    unit: string;
    costPerUnit: string; // Average cost
    totalStock: string;
    isPrepared: boolean;
};

// --- PREP RECIPES & TASKS ---
// Prep Recipe Input (as returned by API)
export type SerializedPrepRecipeInput = Omit<PrismaPrepRecipeInput, 'quantity'> & {
    quantity: string;
    ingredient: { id: string; name: string; unit: string };
}

// Prep Recipe Definition (as returned by API)
export type SerializedPrepRecipe = Omit<PrismaPrepRecipe, 'outputQuantity' | 'inputs'> & {
    outputQuantity: string;
    outputIngredient: { id: string; name: string; unit: string };
    inputs: SerializedPrepRecipeInput[];
};

// Prep Task Record (as returned by API)
export type SerializedPrepTask = Omit<PrismaPrepTask, 'quantityRun'> & {
    quantityRun: string;
    prepRecipe: { name: string };
    executedBy: { name: string };
    location: { name: string };
};


// --- LIVE DATA ---
// Update Live Client types to use string IDs
export type LiveClient = {
    visitId: string;
    clientId: string | null;
    name: string | null;
    seatingAreaId?: string | null; // Now VenueObject ID
    seatingAreaName?: string | null; // Name of the VenueObject
};

// SeatingArea might be deprecated in favor of VenueObject for live map
export type SeatingAreaWithVisit = SeatingArea & {
    visits: ({ id: string; clientId: string | null; client: { name: string | null } | null; })[];
};
export type SeatingAreaWithVisitInfo = SeatingAreaWithVisit;

export type LiveData = {
    clients: LiveClient[];
    products: Product[];
    // seatingAreas?: SeatingAreaWithVisit[]; // Consider replacing with VenueObject data
};

// --- FINANCIALS ---
// Update StaffCommission to link to User and Order
export type StaffCommissionWithDetails = StaffCommission & {
    staff: User; // Link to User
    relatedOrder: (Order & { // Link to Order
        items?: ({ product?: PrismaProduct | null } & Record<string, unknown>)[];
    }) | null;
    relatedClient: Client | null; // Link to Client
};

export type FinancialsData = {
    staffCommissions: StaffCommissionWithDetails[];
};

// --- REPORTS ---
// Update leaderboards to use string IDs if necessary
export type ReportStat = { title: string; value: string };
export type SalesDataPoint = { date: string; Revenue: number }; // Or string?

export type ProductLeaderboardItem = {
    productId: string | null; // Product ID is string
    name: string;
    totalQuantitySold: number | string; // Prisma _sum might return BigInt -> string
};

export type ReportData = {
    kpis: { totalRevenue: string; totalSales: number; avgSaleValue: string; newClients: number; };
    salesOverTime: { date: string; Revenue: string }[];
    productLeaderboard: ProductLeaderboardItem[];
};