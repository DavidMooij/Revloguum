import { useTranslation } from 'react-i18next';
import { ServiceTypeLabelService, type ServiceTypeLike } from '@/domain/services/ServiceTypeLabelService';

export function useServiceTypeLabel() {
  const { t } = useTranslation();
  return (serviceType: ServiceTypeLike) =>
    ServiceTypeLabelService.getLabel(serviceType, t);
}