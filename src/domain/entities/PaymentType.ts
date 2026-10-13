export interface PaymentType {
  id: string;
  name: string;
  translationKey?: string;
  icon: string;
  isSystem: boolean;
  sortOrder: number;
  createdAt: number;
}

export type CreatePaymentTypeInput = Omit<PaymentType, 'id' | 'createdAt' | 'isSystem'>;

export const SYSTEM_PAYMENT_TYPES: Omit<PaymentType, 'createdAt'>[] = [
  {
    id: 'insurance',
    name: 'Insurance',
    translationKey: 'costs.categories.insurance',
    icon: 'shield-alt',
    isSystem: true,
    sortOrder: 0
  },
  {
    id: 'tax',
    name: 'Taxes',
    translationKey: 'costs.categories.tax',
    icon: 'file-invoice',
    isSystem: true,
    sortOrder: 1
  },
  {
    id: 'parking',
    name: 'Parking',
    translationKey: 'costs.categories.parking',
    icon: 'parking',
    isSystem: true,
    sortOrder: 2
  },
  {
    id: 'accessory',
    name: 'Accessories',
    translationKey: 'costs.categories.accessory',
    icon: 'tools',
    isSystem: true,
    sortOrder: 3
  },
  {
    id: 'gear',
    name: 'Gear',
    translationKey: 'costs.categories.gear',
    icon: 'hard-hat',
    isSystem: true,
    sortOrder: 4
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    translationKey: 'costs.categories.maintenance',
    icon: 'wrench',
    isSystem: true,
    sortOrder: 5
  },
  {
    id: 'other',
    name: 'Other',
    translationKey: 'costs.categories.other',
    icon: 'ellipsis-h',
    isSystem: true,
    sortOrder: 6
  }
];
