import { DBByteClient } from "../client";
import { encodeKey } from "../utils";
import type {
  BucketListResponse,
  BucketResponse,
  BucketDeleteResponse,
  CreateBucketOptions,
  UpdateBucketOptions,
} from "../types";

export class BucketsResource {
  constructor(private client: DBByteClient) {}

  list(): Promise<BucketListResponse> {
    return this.client.requestJson("GET", "/buckets");
  }

  get(slug: string): Promise<BucketResponse> {
    return this.client.requestJson("GET", `/buckets/${encodeKey(slug)}`);
  }

  create(options: CreateBucketOptions): Promise<BucketResponse> {
    return this.client.requestJson("POST", "/buckets", { body: options });
  }

  update(slug: string, options: UpdateBucketOptions): Promise<BucketResponse> {
    return this.client.requestJson("PATCH", `/buckets/${encodeKey(slug)}`, {
      body: options,
    });
  }

  delete(slug: string): Promise<BucketDeleteResponse> {
    return this.client.requestJson("DELETE", `/buckets/${encodeKey(slug)}`);
  }
}
