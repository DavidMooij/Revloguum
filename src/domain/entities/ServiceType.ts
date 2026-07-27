export interface ServiceType {
  id: string;
  name: string;
  translationKey?: string;
  icon: string;
  isSystem: boolean;
  sortOrder: number;
  createdAt: number;
}

export type CreateServiceTypeInput = Omit<ServiceType, "id" | "createdAt" | "isSystem">;

export const SYSTEM_SERVICE_TYPES: Omit<ServiceType, "createdAt">[] = [
  {
    id: "sys_oil",
    name: "Oil change",
    translationKey: "serviceTypes.oil",
    icon: "oil-can",
    isSystem: true,
    sortOrder: 0,
  },
  {
    id: "sys_chain",
    name: "Chain lube",
    translationKey: "serviceTypes.chain",
    icon: "link",
    isSystem: true,
    sortOrder: 1,
  },
  {
    id: "sys_wash",
    name: "Wash",
    translationKey: "serviceTypes.wash",
    icon: "tint",
    isSystem: true,
    sortOrder: 2,
  },
  {
    id: "sys_tyre",
    name: "Tyre change",
    translationKey: "serviceTypes.tyre",
    icon: "circle-notch",
    isSystem: true,
    sortOrder: 3,
  },
  {
    id: "sys_brake",
    name: "Brake service",
    translationKey: "serviceTypes.brake",
    icon: "grip-lines",
    isSystem: true,
    sortOrder: 4,
  },
  {
    id: "sys_filter",
    name: "Air filter",
    translationKey: "serviceTypes.filter",
    icon: "wind",
    isSystem: true,
    sortOrder: 5,
  },
  {
    id: "sys_spark",
    name: "Spark plugs",
    translationKey: "serviceTypes.spark",
    icon: "bolt",
    isSystem: true,
    sortOrder: 6,
  },
  {
    id: "sys_coolant",
    name: "Coolant flush",
    translationKey: "serviceTypes.coolant",
    icon: "thermometer-half",
    isSystem: true,
    sortOrder: 7,
  },
  {
    id: "sys_valve",
    name: "Valve check",
    translationKey: "serviceTypes.valve",
    icon: "sliders-h",
    isSystem: true,
    sortOrder: 8,
  },
  {
    id: "sys_other",
    name: "Other",
    translationKey: "serviceTypes.other",
    icon: "wrench",
    isSystem: true,
    sortOrder: 9,
  },
];
