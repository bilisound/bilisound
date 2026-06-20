export class Config {
  static instance: Config = new Config();

  defaultHeaders: Record<string, string> = {};
}
