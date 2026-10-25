export class AppError extends Error {
  constructor(public code: string, public status: number, message = code) {
    super(message);
    this.name = "AppError";
  }
}
export function unsupported(capability: string): never {
  throw new AppError("NOT_IMPLEMENTED", 501, `${capability}尚未实现`);
}
export function notConfigured(capability: string): never {
  throw new AppError("SERVICE_NOT_CONFIGURED", 503, `${capability}未配置`);
}
