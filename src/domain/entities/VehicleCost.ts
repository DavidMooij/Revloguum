export type CostCategory = string;

export type CostKind = "history" | "interval";

export type IntervalType = "monthly" | "yearly" | "custom" | null;

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
  kind: CostKind;
  category: CostCategory;
  amount: number;
  dateTs: number;
  intervalType: IntervalType;
  intervalDays: number | null;
  paymentIntervalId: string | null;
  intervalDueTs: number | null;
  notes: string | null;
  createdAt: number;
}

export type CreateVehicleCostInput = Omit<
  VehicleCost,
  "id" | "createdAt" | "kind" | "intervalDays" | "paymentIntervalId" | "intervalDueTs"
> &
  Partial<
    Pick<
      VehicleCost,
      "kind" | "intervalDays" | "paymentIntervalId" | "intervalDueTs"
    >
  >;
