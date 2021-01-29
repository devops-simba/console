export class Zone {
  constructor(
    public name: string,
    public displayName: string,
    public indicator: string,
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
