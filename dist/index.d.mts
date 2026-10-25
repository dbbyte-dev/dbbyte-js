interface DBByteClientOptions {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
}
type QueryValue = string | number | undefined;
declare class DBByteClient {
    readonly apiKey: string;
    readonly baseUrl: string;
    readonly timeout: number;
    constructor(options: DBByteClientOptions);
    private buildUrl;
    private fetchWithTimeout;
    private parseErrorBody;
    requestJson<T>(method: string, path: string, options?: {
        query?: Record<string, QueryValue>;
        body?: unknown;
    }): Promise<T>;
    requestForm<T>(method: string, path: string, form: FormData, query?: Record<string, QueryValue>): Promise<T>;
    requestBinary(method: string, path: string, query?: Record<string, QueryValue>): Promise<{
        data: ArrayBuffer;
        contentType: string;
        filename: string | null;
    }>;
}

interface HealthResponse {
    status: "ok" | "degraded";
    timestamp: string;
    uptimeSeconds: number;
    checks: {
        api: {
            status: string;
        };
        database: {
            status: string;
            latencyMs: number | null;
        };
    };
    responseTimeMs: number;
}
interface UploadedObject {
    success: boolean;
    key: string;
    name: string;
    size: number;
    mimeType: string;
    fileId: string;
}
interface UploadOptions {
    key: string;
    body: Blob | ArrayBuffer | Uint8Array;
    contentType?: string;
    overwrite?: boolean;
}
interface FileVersionPreview {
    key: string;
    size: number;
    mimeType: string;
    isLatest: boolean;
    createdAt: string;
    updatedAt: string;
}
interface FileListItem {
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
interface ListObjectsOptions {
    prefix?: string;
    cursor?: string;
    limit?: number;
}
interface ListObjectsResponse {
    files: FileListItem[];
    nextCursor: string | null;
    hasMore: boolean;
}
interface SignOptions {
    version?: string;
    expiresIn?: number;
}
interface SignedUrlResponse {
    url: string;
    expiresIn: number;
}
interface VersionEntry {
    versionKey: string;
    size: number;
    mimeType: string;
    isLatest: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}
interface ListVersionsOptions {
    limit?: number;
    cursor?: string;
}
interface ListVersionsResponse {
    versions: VersionEntry[];
    nextCursor: string | null;
    hasMore: boolean;
}
interface DeleteResponse {
    success: boolean;
    deletedVersions?: number;
}
interface DownloadResult {
    data: ArrayBuffer;
    contentType: string;
    filename: string | null;
}
interface Bucket {
    id: string;
    name: string;
    slug: string;
    region: string;
    replicaCount: number;
    isPublic: boolean;
    cdn: boolean;
    versioningEnabled: boolean;
    fileCount: number;
    size: number;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}
interface BucketListResponse {
    buckets: Bucket[];
}
interface BucketResponse {
    success?: boolean;
    bucket: Bucket;
}
interface CreateBucketOptions {
    name: string;
    region: string;
    replicaCount?: number;
    isPublic?: boolean;
    cdn?: boolean;
}
interface UpdateBucketOptions {
    versioningEnabled?: boolean;
    isPublic?: boolean;
    cdn?: boolean;
}
interface BucketDeleteResponse {
    success: boolean;
}
type PurgeScope = "file" | "bucket";
interface PurgeOptions {
    slug: string;
    scope: PurgeScope;
    path?: string;
}
interface PurgeResponse {
    success: boolean;
    purged: number;
    failed: string[];
}
type DataRecord = Record<string, unknown>;
interface DataQueryOptions {
    fields?: string[];
    cursor?: string;
    limit?: number;
    filters?: Record<string, string>;
}
interface DataPage {
    data: DataRecord[];
    next_cursor: string | null;
}
interface DataRecordResponse {
    data: DataRecord;
}
interface AppendTextResponse {
    success: boolean;
    appendedCharacters: number;
}
interface DataDeleteResponse {
    success: boolean;
}
interface UploadUrlOptions {
    name: string;
    contentType?: string;
    size?: number;
    overwrite?: boolean;
    expiresIn?: number;
}
interface UploadUrlResponse {
    url: string;
    method: string;
    headers: Record<string, string>;
    expiresIn: number;
}

declare class BucketsResource {
    private client;
    constructor(client: DBByteClient);
    list(): Promise<BucketListResponse>;
    get(slug: string): Promise<BucketResponse>;
    create(options: CreateBucketOptions): Promise<BucketResponse>;
    update(slug: string, options: UpdateBucketOptions): Promise<BucketResponse>;
    delete(slug: string): Promise<BucketDeleteResponse>;
}

declare class CdnResource {
    private client;
    constructor(client: DBByteClient);
    purge(options: PurgeOptions): Promise<PurgeResponse>;
}

declare class DataResource {
    private client;
    constructor(client: DBByteClient);
    get(slug: string, options?: DataQueryOptions): Promise<DataPage>;
    create(slug: string, record: DataRecord): Promise<DataRecordResponse>;
    appendText(slug: string, text: string): Promise<AppendTextResponse>;
    update(slug: string, recordId: string, patch: DataRecord): Promise<DataRecordResponse>;
    delete(slug: string, recordId: string): Promise<DataDeleteResponse>;
}

declare class ObjectsResource {
    private client;
    constructor(client: DBByteClient);
    upload(bucket: string, options: UploadOptions): Promise<UploadedObject>;
    uploadUrl(bucket: string, options: UploadUrlOptions): Promise<UploadUrlResponse>;
    list(bucket: string, options?: ListObjectsOptions): Promise<ListObjectsResponse>;
    download(bucket: string, key: string, options?: {
        version?: string;
    }): Promise<DownloadResult>;
    downloadAllVersions(bucket: string, key: string): Promise<DownloadResult>;
    delete(bucket: string, key: string, options?: {
        version?: string;
    }): Promise<DeleteResponse>;
    deleteAllVersions(bucket: string, key: string): Promise<DeleteResponse>;
    sign(bucket: string, key: string, options?: SignOptions): Promise<SignedUrlResponse>;
    versions(bucket: string, key: string, options?: ListVersionsOptions): Promise<ListVersionsResponse>;
}

declare class DBByteError extends Error {
    status: number;
    hint?: string;
    retryAfter?: number;
    constructor(message: string, status: number, hint?: string, retryAfter?: number);
}

declare class DBByte {
    private client;
    readonly buckets: BucketsResource;
    readonly cdn: CdnResource;
    readonly data: DataResource;
    readonly objects: ObjectsResource;
    constructor(options: DBByteClientOptions);
    health(): Promise<HealthResponse>;
}

export { type AppendTextResponse, type Bucket, type BucketDeleteResponse, type BucketListResponse, type BucketResponse, type CreateBucketOptions, DBByte, type DBByteClientOptions, DBByteError, type DataDeleteResponse, type DataPage, type DataQueryOptions, type DataRecord, type DataRecordResponse, type DeleteResponse, type DownloadResult, type FileListItem, type FileVersionPreview, type HealthResponse, type ListObjectsOptions, type ListObjectsResponse, type ListVersionsOptions, type ListVersionsResponse, type PurgeOptions, type PurgeResponse, type PurgeScope, type SignOptions, type SignedUrlResponse, type UpdateBucketOptions, type UploadOptions, type UploadUrlOptions, type UploadUrlResponse, type UploadedObject, type VersionEntry };
