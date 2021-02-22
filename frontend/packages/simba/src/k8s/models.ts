export class Zone {
  constructor(
    public name: string,
    public displayName: string,
    public zoneIndicator: string,
    public alternateIndicators: string[],
    public enabled: boolean = true,
  ) {}

  getId() {
    return this.name;
  }
  getDisplayName() {
    return this.displayName;
  }
  getEnabled() {
    return this.enabled;
  }
}

export type CountryInfo = {
  id: number;
  alpha2: string;
  alpha3: string;
  en: string;
  fa: string;
};

export type CountryQuery = {
  id?: number;
  alpha2?: string;
  alpha3?: string;
  en?: string;
  fa?: string;
};
