# dbbyte

Official DBByte SDK for JavaScript and TypeScript. A thin, typed wrapper over the DBByte v1 REST API. Works in Node.js 18+, the browser, and edge runtimes (Cloudflare Workers, Vercel Edge).

Zero dependencies. TypeScript-first, ships with full type definitions.

## Status

Covers object storage: upload, list, download, delete, versioning, and signed URLs. There is no bucket management, CDN cache control, or analytics API yet - those aren't part of the v1 REST API, so they aren't in the SDK either.

## Installation

```bash
npm install @dbbyte/sdk
```

## Usage

```typescript
import { DBByte } from '@dbbyte/sdk';

const db = new DBByte({
  apiKey: process.env.DBBYTE_API_KEY,
});
```

| Option | Type | Description |
| --- | --- | --- |
| `apiKey` | `string` | Your DBByte API key. Required. |
| `baseUrl` | `string` | Override the API base URL. Defaults to `https://api.dbbyte.com`. Note: production requests go through a Cloudflare Worker gateway that inserts `/api/v1` itself, so the SDK's own paths don't include it. If you override `baseUrl` to hit a Next.js server directly (e.g. local dev with no Worker in front), include `/api/v1` in the value you pass. |
| `timeout` | `number` | Request timeout in ms. Defaults to `30000`. |

### Health check

```typescript
const status = await db.health();
```

### Upload

```typescript
const object = await db.objects.upload('my-bucket', {
  key: 'images/logo.png',
  body: fileBuffer, // Blob, ArrayBuffer, or Uint8Array
  contentType: 'image/png',
});

// Re-uploading the same name fails with 409 unless you opt in:
await db.objects.upload('my-bucket', {
  key: 'images/logo.png',
  body: fileBuffer,
  overwrite: true,
});
```

### List

```typescript
const { files, nextCursor, hasMore } = await db.objects.list('my-bucket');

// Paginate:
const nextPage = await db.objects.list('my-bucket', { cursor: nextCursor });
```

### Download

```typescript
const { data, contentType, filename } = await db.objects.download('my-bucket', 'images/logo.png');

// A specific historical version:
await db.objects.download('my-bucket', 'images/logo.png', { version: 'some-version-key' });

// Every version, zipped:
const zip = await db.objects.downloadAllVersions('my-bucket', 'images/logo.png');
```

### Versions

```typescript
const { versions } = await db.objects.versions('my-bucket', 'images/logo.png');
```

### Signed URLs

```typescript
const { url, expiresIn } = await db.objects.sign('my-bucket', 'images/logo.png', {
  expiresIn: 3600, // seconds, max 604800 (7 days)
});
```

### Delete

```typescript
await db.objects.delete('my-bucket', 'images/logo.png');

// A specific version only:
await db.objects.delete('my-bucket', 'images/logo.png', { version: 'some-version-key' });

// Every version, permanently:
await db.objects.deleteAllVersions('my-bucket', 'images/logo.png');
```

## Error handling

All SDK methods throw a `DBByteError` on API errors.

```typescript
import { DBByte, DBByteError } from '@dbbyte/sdk';

try {
  await db.objects.download('my-bucket', 'does-not-exist.png');
} catch (err) {
  if (err instanceof DBByteError) {
    console.log(err.status);  // e.g. 404
    console.log(err.message); // e.g. "File not found"
    console.log(err.hint);    // present on some errors, e.g. upload conflicts
  }
}
```

### Rate limits vs quota limits

A `429` can mean two different things, and only one is worth retrying:

- **Burst rate limit** - `err.retryAfter` is set (seconds until you can retry). Transient, safe to retry after that delay.
- **Plan API request quota exceeded** - `err.retryAfter` is `undefined`. Retrying immediately won't help; you're out of quota until your billing period resets or you upgrade.

```typescript
catch (err) {
  if (err instanceof DBByteError && err.status === 429) {
    if (err.retryAfter !== undefined) {
      // wait err.retryAfter seconds, then retry
    } else {
      // plan quota exceeded, don't retry blindly
    }
  }
}
```

## Known limitations

- **Upload allowed types**: the server enforces a fixed MIME type whitelist (common image, video, audio, PDF, Word, and plain-text formats). Uploading anything else returns a `400` from the server - the SDK doesn't pre-validate this client-side, since duplicating a server-enforced limit risks drifting out of sync with it.
- **50MB max file size**, enforced server-side.

## License

MIT
