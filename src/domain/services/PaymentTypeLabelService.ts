export interface PaymentTypeLike {
  name: string;
  translationKey?: string;
}

export class PaymentTypeLabelService {
  static getLabel(
    paymentType: PaymentTypeLike,
    t: (key: string) => string,
  ): string {
    if (paymentType.translationKey) {
      return t(paymentType.translationKey);
    }

    return paymentType.name;
  }
}
