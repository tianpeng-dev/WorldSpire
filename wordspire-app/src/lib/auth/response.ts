import { AppError } from "../http/errors";
export async function authResponse(response: Response): Promise<Response> {
  if (response.ok) return response;
  const body = await response.json() as { code?: string; message?: string };
  if (response.status >= 500) throw new Error(`Better Auth 请求失败：${body.message ?? body.code ?? response.status}`);
  throw new AppError(body.code ?? "AUTH_FAILED", response.status, body.message);
}
