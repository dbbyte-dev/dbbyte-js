import { DBByteClient } from "../client";
import type { PurgeOptions, PurgeResponse } from "../types";

export class CdnResource {
  constructor(private client: DBByteClient) {}

  // Purges one public file (scope "file", with path) or every public file in
  // a bucket (scope "bucket"). The API key needs write permission.
  purge(options: PurgeOptions): Promise<PurgeResponse> {
    return this.client.requestJson("POST", "/purge", { body: options });
  }
}
