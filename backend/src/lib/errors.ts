// Uygulama hatası — HTTP status + kullanıcıya gösterilebilir mesaj taşır.
export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const badRequest = (m: string, d?: unknown) => new AppError(400, m, d);
export const unauthorized = (m = 'Yetkisiz') => new AppError(401, m);
export const forbidden = (m = 'Bu işlem için yetkiniz yok') => new AppError(403, m);
export const notFound = (m = 'Bulunamadı') => new AppError(404, m);
export const conflict = (m: string) => new AppError(409, m);
export const payloadTooLarge = (m = 'Dosya çok büyük') => new AppError(413, m);
