// src/errors.ts
var DBByteError = class extends Error {
  constructor(message, status, hint, retryAfter) {
    super(message);
    this.name = "DBByteError";
    this.status = status;
    this.hint = hint;
    this.retryAfter = retryAfter;
  }
};

// src/client.ts
var DEFAULT_BASE_URL = "https://api.dbbyte.com";
var DEFAULT_TIMEOUT = 3e4;
var DBByteClient = class {
  constructor(options) {
    if (!options.apiKey) {
      throw new Error("DBByte: apiKey is required");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
  }
  buildUrl(path, query) {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== void 0) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
  async fetchWithTimeout(url, init) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { ...init.headers, Authorization: `Bearer ${this.apiKey}` }
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
  async parseErrorBody(res) {
    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : void 0;
    try {
      const body = await res.json();
      return {
        message: body?.error ?? res.statusText,
        hint: body?.hint,
        retryAfter
      };
    } catch {
      return { message: res.statusText, retryAfter };
    }
  }
  async requestJson(method, path, options = {}) {
    const url = this.buildUrl(path, options.query);
    const init = { method };
    if (options.body !== void 0) {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(options.body);
    }
    const res = await this.fetchWithTimeout(url, init);
    if (!res.ok) {
      const { message, hint, retryAfter } = await this.parseErrorBody(res);
      throw new DBByteError(message, res.status, hint, retryAfter);
    }
    return res.json();
  }
  async requestForm(method, path, form, query) {
    const url = this.buildUrl(path, query);
    const res = await this.fetchWithTimeout(url, { method, body: form });
    if (!res.ok) {
      const { message, hint, retryAfter } = await this.parseErrorBody(res);
      throw new DBByteError(message, res.status, hint, retryAfter);
    }
    return res.json();
  }
  async requestBinary(method, path, query) {
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
      filename: filenameMatch?.[1] ?? null
    };
  }
};

// src/utils.ts
function encodeKey(key) {
  return key.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

// src/resources/objects.ts
var ObjectsResource = class {
  constructor(client) {
    this.client = client;
  }
  async upload(bucket, options) {
    const blob = options.body instanceof Blob ? options.body : new Blob([options.body], { type: options.contentType });
    const form = new FormData();
    form.append("file", blob, options.key);
    return this.client.requestForm(
      "POST",
      `/storage/${bucket}/upload`,
      form,
      { overwrite: options.overwrite ? "true" : void 0 }
    );
  }
  async list(bucket, options = {}) {
    return this.client.requestJson(
      "GET",
      `/storage/${bucket}/list`,
      {
        query: {
          prefix: options.prefix,
          cursor: options.cursor,
          limit: options.limit
        }
      }
    );
  }
  async download(bucket, key, options = {}) {
    return this.client.requestBinary(
      "GET",
      `/storage/${bucket}/download/${encodeKey(key)}`,
      { version: options.version }
    );
  }
  // Returns a zip of every version of this key.
  async downloadAllVersions(bucket, key) {
    return this.client.requestBinary(
      "GET",
      `/storage/${bucket}/download/${encodeKey(key)}`,
      { version: "all" }
    );
  }
  async delete(bucket, key, options = {}) {
    return this.client.requestJson(
      "DELETE",
      `/storage/${bucket}/delete/${encodeKey(key)}`,
      { query: { version: options.version } }
    );
  }
  // Permanently deletes every version of this key.
  async deleteAllVersions(bucket, key) {
    return this.client.requestJson(
      "DELETE",
      `/storage/${bucket}/delete/${encodeKey(key)}`,
      { query: { version: "all" } }
    );
  }
  async sign(bucket, key, options = {}) {
    return this.client.requestJson(
      "POST",
      `/storage/${bucket}/sign/${encodeKey(key)}`,
      { body: { version: options.version, expiresIn: options.expiresIn } }
    );
  }
  async versions(bucket, key, options = {}) {
    return this.client.requestJson(
      "GET",
      `/storage/${bucket}/versions/${encodeKey(key)}`,
      { query: { limit: options.limit, cursor: options.cursor } }
    );
  }
};

// src/index.ts
var DBByte = class {
  constructor(options) {
    this.client = new DBByteClient(options);
    this.objects = new ObjectsResource(this.client);
  }
  async health() {
    return this.client.requestJson("GET", "/health");
  }
};
export {
  DBByte,
  DBByteError
};
//# sourceMappingURL=index.mjs.map