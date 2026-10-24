import { DBByteClient } from "../client";
import { encodeKey } from "../utils";
import type {
  AppendTextResponse,
  DataDeleteResponse,
  DataPage,
  DataQueryOptions,
  DataRecord,
  DataRecordResponse,
} from "../types";

export class DataResource {
  constructor(private client: DBByteClient) {}

  get(slug: string, options: DataQueryOptions = {}): Promise<DataPage> {
    const query: Record<string, string | number | undefined> = {
      ...options.filters,
      fields: options.fields?.length ? options.fields.join(",") : undefined,
      cursor: options.cursor,
      limit: options.limit,
    };
    return this.client.requestJson("GET", `/v1/data/${encodeKey(slug)}`, {
      query,
    });
  }

  create(slug: string, record: DataRecord): Promise<DataRecordResponse> {
    return this.client.requestJson("POST", `/v1/data/${encodeKey(slug)}`, {
      body: record,
    });
  }

  appendText(slug: string, text: string): Promise<AppendTextResponse> {
    return this.client.requestJson("POST", `/v1/data/${encodeKey(slug)}`, {
      body: { appendText: text },
    });
  }

  update(
    slug: string,
    recordId: string,
    patch: DataRecord,
  ): Promise<DataRecordResponse> {
    return this.client.requestJson(
      "PATCH",
      `/v1/data/${encodeKey(slug)}/${encodeKey(recordId)}`,
      { body: patch },
    );
  }

  delete(slug: string, recordId: string): Promise<DataDeleteResponse> {
    return this.client.requestJson(
      "DELETE",
      `/v1/data/${encodeKey(slug)}/${encodeKey(recordId)}`,
    );
  }
}
