"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DBByte: () => DBByte,
  DBByteError: () => DBByteError
});
module.exports = __toCommonJS(index_exports);

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

// src/resources/buckets.ts
var BucketsResource = class {
  constructor(client) {
    this.client = client;
  }
  list() {
    return this.client.requestJson("GET", "/buckets");
  }
  get(slug) {
    return this.client.requestJson("GET", `/buckets/${encodeKey(slug)}`);
  }
  create(options) {
    return this.client.requestJson("POST", "/buckets", { body: options });
  }
  update(slug, options) {
    return this.client.requestJson("PATCH", `/buckets/${encodeKey(slug)}`, {
      body: options
    });
  }
  delete(slug) {
    return this.client.requestJson("DELETE", `/buckets/${encodeKey(slug)}`);
  }
};

// src/resources/cdn.ts
var CdnResource = class {
  constructor(client) {
    this.client = client;
  }
  // Purges one public file (scope "file", with path) or every public file in
  // a bucket (scope "bucket"). The API key needs write permission.
  purge(options) {
    return this.client.requestJson("POST", "/purge", { body: options });
  }
};

// src/resources/data.ts
var DataResource = class {
  constructor(client) {
    this.client = client;
  }
  get(slug, options = {}) {
    const query = {
      ...options.filters,
      fields: options.fields?.length ? options.fields.join(",") : void 0,
      cursor: options.cursor,
      limit: options.limit
    };
    return this.client.requestJson("GET", `/v1/data/${encodeKey(slug)}`, {
      query
    });
  }
  create(slug, record) {
    return this.client.requestJson("POST", `/v1/data/${encodeKey(slug)}`, {
      body: record
    });
  }
  appendText(slug, text) {
    return this.client.requestJson("POST", `/v1/data/${encodeKey(slug)}`, {
      body: { appendText: text }
    });
  }
  update(slug, recordId, patch) {
    return this.client.requestJson(
      "PATCH",
      `/v1/data/${encodeKey(slug)}/${encodeKey(recordId)}`,
      { body: patch }
    );
  }
  delete(slug, recordId) {
    return this.client.requestJson(
      "DELETE",
      `/v1/data/${encodeKey(slug)}/${encodeKey(recordId)}`
    );
  }
};

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
  // Creates a short-lived signed upload link so a browser can upload straight
  // to storage without seeing your API key.
  async uploadUrl(bucket, options) {
    return this.client.requestJson(
      "POST",
      `/storage/${bucket}/upload-url`,
      { body: options }
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
    this.buckets = new BucketsResource(this.client);
    this.cdn = new CdnResource(this.client);
    this.data = new DataResource(this.client);
    this.objects = new ObjectsResource(this.client);
  }
  async health() {
    return this.client.requestJson("GET", "/health");
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DBByte,
  DBByteError
});
//# sourceMappingURL=index.js.map