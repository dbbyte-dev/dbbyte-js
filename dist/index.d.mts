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

declare class ObjectsResource {
    private client;
    constructor(client: DBByteClient);
    upload(bucket: string, options: UploadOptions): Promise<UploadedObject>;
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
    readonly objects: ObjectsResource;
    constructor(options: DBByteClientOptions);
    health(): Promise<HealthResponse>;
}

export { DBByte, type DBByteClientOptions, DBByteError, type DeleteResponse, type DownloadResult, type FileListItem, type FileVersionPreview, type HealthResponse, type ListObjectsOptions, type ListObjectsResponse, type ListVersionsOptions, type ListVersionsResponse, type SignOptions, type SignedUrlResponse, type UploadOptions, type UploadedObject, type VersionEntry };
