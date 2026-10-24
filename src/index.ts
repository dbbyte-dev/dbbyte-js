import { DBByteClient, type DBByteClientOptions } from "./client";
import { ObjectsResource } from "./resources/objects";
import type { HealthResponse } from "./types";

export class DBByte {
  private client: DBByteClient;
  readonly objects: ObjectsResource;

  constructor(options: DBByteClientOptions) {
    this.client = new DBByteClient(options);
    this.objects = new ObjectsResource(this.client);
  }

  async health(): Promise<HealthResponse> {
    return this.client.requestJson<HealthResponse>("GET", "/health");
  }
}

export { DBByteError } from "./errors";
export type { DBByteClientOptions } from "./client";
export type {
  HealthResponse,
  UploadedObject,
  UploadOptions,
  ListObjectsOptions,
  ListObjectsResponse,
  FileListItem,
  FileVersionPreview,
  SignOptions,
  SignedUrlResponse,
  ListVersionsOptions,
  ListVersionsResponse,
  VersionEntry,
  DeleteResponse,
  DownloadResult,
} from "./types";
