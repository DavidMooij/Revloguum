export interface ServiceType {
  id: string;
  name: string;
  icon: string;
  isSystem: boolean;
  sortOrder: number;
  createdAt: number;
}

export type CreateServiceTypeInput = Omit<ServiceType, 'id' | 'createdAt' | 'isSystem'>;

export const SYSTEM_SERVICE_TYPES: Omit<ServiceType, 'createdAt'>[] = [
  { id: 'sys_oil',    name: 'Oil change',        icon: 'oil-can',      isSystem: true, sortOrder: 0 },
  { id: 'sys_chain',  name: 'Chain lube',        icon: 'link',         isSystem: true, sortOrder: 1 },
  { id: 'sys_wash',   name: 'Wash',              icon: 'tint',         isSystem: true, sortOrder: 2 },
  { id: 'sys_tyre',   name: 'Tyre change',       icon: 'circle-notch', isSystem: true, sortOrder: 3 },
  { id: 'sys_brake',  name: 'Brake service',     icon: 'grip-lines',   isSystem: true, sortOrder: 4 },
  { id: 'sys_filter', name: 'Air filter',        icon: 'wind',         isSystem: true, sortOrder: 5 },
  { id: 'sys_spark',  name: 'Spark plugs',       icon: 'bolt',         isSystem: true, sortOrder: 6 },
  { id: 'sys_coolant',name: 'Coolant flush',     icon: 'thermometer-half', isSystem: true, sortOrder: 7 },
  { id: 'sys_valve',  name: 'Valve check',       icon: 'sliders-h',    isSystem: true, sortOrder: 8 },
  { id: 'sys_other',  name: 'Other',             icon: 'wrench',       isSystem: true, sortOrder: 9 },
];
