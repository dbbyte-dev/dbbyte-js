import { DBByteError } from "./errors";

export interface DBByteClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

const DEFAULT_BASE_URL = "https://api.dbbyte.com";
const DEFAULT_TIMEOUT = 30000;

type QueryValue = string | number | undefined;

export class DBByteClient {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly timeout: number;

  constructor(options: DBByteClientOptions) {
    if (!options.apiKey) {
      throw new Error("DBByte: apiKey is required");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
  }

  private buildUrl(path: string, query?: Record<string, QueryValue>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { ...init.headers, Authorization: `Bearer ${this.apiKey}` },
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new DBByteError("Request timed out", 0);
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  private async parseErrorBody(
    res: Response,
  ): Promise<{ message: string; hint?: string; retryAfter?: number }> {
    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfter = retryAfterHeader
      ? Number(retryAfterHeader)
      : undefined;
    try {
      const body = await res.json();
      return {
        message: body?.error ?? res.statusText,
        hint: body?.hint,
        retryAfter,
      };
    } catch {
      return { message: res.statusText, retryAfter };
    }
  }

  async requestJson<T>(
    method: string,
    path: string,
    options: { query?: Record<string, QueryValue>; body?: unknown } = {},
  ): Promise<T> {
    const url = this.buildUrl(path, options.query);
    const init: RequestInit = { method };
    if (options.body !== undefined) {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(options.body);
    }
    const res = await this.fetchWithTimeout(url, init);
    if (!res.ok) {
      const { message, hint, retryAfter } = await this.parseErrorBody(res);
      throw new DBByteError(message, res.status, hint, retryAfter);
    }
    return res.json() as Promise<T>;
  }

  async requestForm<T>(
    method: string,
    path: string,
    form: FormData,
    query?: Record<string, QueryValue>,
  ): Promise<T> {
    const url = this.buildUrl(path, query);
    const res = await this.fetchWithTimeout(url, { method, body: form });
    if (!res.ok) {
      const { message, hint, retryAfter } = await this.parseErrorBody(res);
      throw new DBByteError(message, res.status, hint, retryAfter);
    }
    return res.json() as Promise<T>;
  }

  async requestBinary(
    method: string,
    path: string,
    query?: Record<string, QueryValue>,
  ): Promise<{ data: ArrayBuffer; contentType: string; filename: string | null }> {
    const url = this.buildUrl(path, query);
    const res = await this.fetchWithTimeout(url, { method });
    if (!res.ok) {
      const { message, hint, retryAfter } = await this.parseErrorBody(res);
      throw new DBByteError(message, res.status, hint, retryAfter);
    }
    const contentType = res.headers.get("Content-Type") ?? "application/octet-stream";
    const disposition = res.headers.get("Content-Disposition");
    const filenameMatch = disposition?.match(/filename="([^"]+)"/);
    return {
      data: await res.arrayBuffer(),
      contentType,
      filename: filenameMatch?.[1] ?? null,
    };
  }
}
