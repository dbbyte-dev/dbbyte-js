import { DBByteClient } from "../client";
import { encodeKey } from "../utils";
import type {
  UploadOptions,
  UploadedObject,
  ListObjectsOptions,
  ListObjectsResponse,
  SignOptions,
  SignedUrlResponse,
  ListVersionsOptions,
  ListVersionsResponse,
  DeleteResponse,
  DownloadResult,
  UploadUrlOptions,
  UploadUrlResponse,
} from "../types";

export class ObjectsResource {
  constructor(private client: DBByteClient) {}

  async upload(bucket: string, options: UploadOptions): Promise<UploadedObject> {
    const blob =
      options.body instanceof Blob
        ? options.body
        : new Blob([options.body as BlobPart], { type: options.contentType });
    const form = new FormData();
    form.append("file", blob, options.key);

    return this.client.requestForm<UploadedObject>(
      "POST",
      `/storage/${bucket}/upload`,
      form,
      { overwrite: options.overwrite ? "true" : undefined },
    );
  }

  // Creates a short-lived signed upload link so a browser can upload straight
  // to storage without seeing your API key.
  async uploadUrl(
    bucket: string,
    options: UploadUrlOptions,
  ): Promise<UploadUrlResponse> {
    return this.client.requestJson<UploadUrlResponse>(
      "POST",
      `/storage/${bucket}/upload-url`,
      { body: options },
    );
  }

  async list(bucket: string, options: ListObjectsOptions = {}): Promise<ListObjectsResponse> {
    return this.client.requestJson<ListObjectsResponse>(
      "GET",
      `/storage/${bucket}/list`,
      {
        query: {
          prefix: options.prefix,
          cursor: options.cursor,
          limit: options.limit,
        },
      },
    );
  }

  async download(
    bucket: string,
    key: string,
    options: { version?: string } = {},
  ): Promise<DownloadResult> {
    return this.client.requestBinary(
      "GET",
      `/storage/${bucket}/download/${encodeKey(key)}`,
      { version: options.version },
    );
  }

  // Returns a zip of every version of this key.
  async downloadAllVersions(bucket: string, key: string): Promise<DownloadResult> {
    return this.client.requestBinary(
      "GET",
      `/storage/${bucket}/download/${encodeKey(key)}`,
      { version: "all" },
    );
  }

  async delete(
    bucket: string,
    key: string,
    options: { version?: string } = {},
  ): Promise<DeleteResponse> {
    return this.client.requestJson<DeleteResponse>(
      "DELETE",
      `/storage/${bucket}/delete/${encodeKey(key)}`,
      { query: { version: options.version } },
    );
  }

  // Permanently deletes every version of this key.
  async deleteAllVersions(bucket: string, key: string): Promise<DeleteResponse> {
    return this.client.requestJson<DeleteResponse>(
      "DELETE",
      `/storage/${bucket}/delete/${encodeKey(key)}`,
      { query: { version: "all" } },
    );
  }

  async sign(
    bucket: string,
    key: string,
    options: SignOptions = {},
  ): Promise<SignedUrlResponse> {
    return this.client.requestJson<SignedUrlResponse>(
      "POST",
      `/storage/${bucket}/sign/${encodeKey(key)}`,
      { body: { version: options.version, expiresIn: options.expiresIn } },
    );
  }

  async versions(
    bucket: string,
    key: string,
    options: ListVersionsOptions = {},
  ): Promise<ListVersionsResponse> {
    return this.client.requestJson<ListVersionsResponse>(
      "GET",
      `/storage/${bucket}/versions/${encodeKey(key)}`,
      { query: { limit: options.limit, cursor: options.cursor } },
    );
  }
}
