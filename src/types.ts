export interface HealthResponse {
  status: "ok" | "degraded";
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    api: { status: string };
    database: { status: string; latencyMs: number | null };
  };
  responseTimeMs: number;
}

export interface UploadedObject {
  success: boolean;
  key: string;
  name: string;
  size: number;
  mimeType: string;
  fileId: string;
}

export interface UploadOptions {
  key: string;
  body: Blob | ArrayBuffer | Uint8Array;
  contentType?: string;
  overwrite?: boolean;
}

export interface FileVersionPreview {
  key: string;
  size: number;
  mimeType: string;
  isLatest: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileListItem {
  key: string;
  name: string;
  size: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
  versions: FileVersionPreview[];
  hasMoreVersions: boolean;
}

export interface ListObjectsOptions {
  // NOTE: as of the current API, this filters on the storage-generated
  // `key` field (a timestamp-prefixed, slash-flattened server ID), not
  // the human-readable `name` you uploaded with. It will rarely match
  // what you expect - confirmed via round-trip testing against a real
  // server. Treat as unreliable until the backend filters on `name`
  // instead.
  prefix?: string;
  cursor?: string;
  limit?: number;
}

export interface ListObjectsResponse {
  files: FileListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SignOptions {
  version?: string;
  expiresIn?: number;
}

export interface SignedUrlResponse {
  url: string;
  expiresIn: number;
}

export interface VersionEntry {
  versionKey: string;
  size: number;
  mimeType: string;
  isLatest: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListVersionsOptions {
  limit?: number;
  cursor?: string;
}

export interface ListVersionsResponse {
  versions: VersionEntry[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface DeleteResponse {
  success: boolean;
  deletedVersions?: number;
}

export interface DownloadResult {
  data: ArrayBuffer;
  contentType: string;
  filename: string | null;
}
