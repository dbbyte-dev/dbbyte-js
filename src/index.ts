import { DBByteClient, type DBByteClientOptions } from "./client";
import { BucketsResource } from "./resources/buckets";
import { CdnResource } from "./resources/cdn";
import { DataResource } from "./resources/data";
import { ObjectsResource } from "./resources/objects";
import type { HealthResponse } from "./types";

export class DBByte {
  private client: DBByteClient;
  readonly buckets: BucketsResource;
  readonly cdn: CdnResource;
  readonly data: DataResource;
  readonly objects: ObjectsResource;

  constructor(options: DBByteClientOptions) {
    this.client = new DBByteClient(options);
    this.buckets = new BucketsResource(this.client);
    this.cdn = new CdnResource(this.client);
    this.data = new DataResource(this.client);
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
  Bucket,
  BucketListResponse,
  BucketResponse,
  BucketDeleteResponse,
  CreateBucketOptions,
  UpdateBucketOptions,
  PurgeScope,
  PurgeOptions,
  PurgeResponse,
  DataRecord,
  DataQueryOptions,
  DataPage,
  DataRecordResponse,
  AppendTextResponse,
  DataDeleteResponse,
  UploadUrlOptions,
  UploadUrlResponse,
} from "./types";
