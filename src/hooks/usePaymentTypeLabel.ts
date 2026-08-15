import { useTranslation } from "react-i18next";
import {
  PaymentTypeLabelService,
  type PaymentTypeLike,
} from "@/domain/services/PaymentTypeLabelService";

export function usePaymentTypeLabel() {
  const { t } = useTranslation();

  return (paymentType: PaymentTypeLike) =>
    PaymentTypeLabelService.getLabel(paymentType, t);
}
