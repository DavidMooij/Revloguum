import type { PaymentType, CreatePaymentTypeInput } from '../entities/PaymentType';

export class PaymentTypeInUseError extends Error {
  constructor() {
    super('PAYMENT_TYPE_IN_USE');
    this.name = 'PaymentTypeInUseError';
  }
}

export interface IPaymentTypeRepo {
  getAll(): Promise<PaymentType[]>;
  getById(id: string): Promise<PaymentType | null>;
  insert(input: CreatePaymentTypeInput): Promise<PaymentType>;
  update(id: string, name: string, icon: string): Promise<void>;
  delete(id: string): Promise<void>;
}
