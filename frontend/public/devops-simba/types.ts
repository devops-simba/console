export class Zone {
  constructor(
    public name: string,
    public displayName: string,
    public zoneIndicator: string,
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
