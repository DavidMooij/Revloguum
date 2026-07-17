export type CostCategory =
  | "purchase"
  | "tax"
  | "parking"
  | "insurance"
  | "accessory"
  | "gear"
  | "maintenance"
  | "other";

export type IntervalType = "monthly" | "yearly" | null;

export const COST_CATEGORIES: {
  key: CostCategory;
  icon: string;
}[] = [
  { key: "purchase", icon: "tag" },
  { key: "insurance", icon: "shield-alt" },
  { key: "tax", icon: "file-invoice" },
  { key: "parking", icon: "parking" },
  { key: "accessory", icon: "tools" },
  { key: "gear", icon: "hard-hat" },
  { key: "maintenance", icon: "wrench" },
  { key: "other", icon: "ellipsis-h" },
];

export interface VehicleCost {
  id: string;
  vehicleId: string;
  category: CostCategory;
  amount: number;
  dateTs: number;
  intervalType: IntervalType;
  notes: string | null;
  createdAt: number;
}

export type CreateVehicleCostInput = Omit<VehicleCost, "id" | "createdAt">;
