export interface ServiceTypeLike {
  name: string;
  translationKey?: string;
}

export class ServiceTypeLabelService {
  static getLabel(
    serviceType: ServiceTypeLike,
    t: (key: string) => string,
  ): string {
    if (serviceType.translationKey) {
      return t(serviceType.translationKey);
    }

    return serviceType.name;
  }
}
