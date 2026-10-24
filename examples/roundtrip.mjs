// Round-trip test against a real DBByte server. Exercises every SDK
// method against actual HTTP endpoints - this is the one thing that
// can't be verified by reading source, so run it before publishing.
//
// Usage:
//   DBBYTE_API_KEY=dbk_xxx DBBYTE_BUCKET=my-test-bucket node examples/roundtrip.mjs
//
// Env vars:
//   DBBYTE_API_KEY   required. Needs read+write+delete on the bucket.
//   DBBYTE_BUCKET    required. An existing bucket slug to test against.
//   DBBYTE_BASE_URL  optional. If unset, uses the SDK's own default
//                    (https://api.dbbyte.com) - the real production
//                    Worker gateway. To test against a local Next.js dev
//                    server instead (bypassing the Worker), set this
//                    explicitly, e.g. http://localhost:3000/api/v1.

import { DBByte, DBByteError } from "../dist/index.mjs";

const apiKey = process.env.DBBYTE_API_KEY;
const bucket = process.env.DBBYTE_BUCKET;
// Deliberately not defaulted here - undefined lets the SDK apply its own
// default (production). A silent local fallback here previously masked
// this script hitting localhost even when the intent was to test prod.
const baseUrl = process.env.DBBYTE_BASE_URL;

console.log(`Testing against: ${baseUrl ?? "https://api.dbbyte.com (SDK default)"}`);

if (!apiKey || !bucket) {
  console.error("Set DBBYTE_API_KEY and DBBYTE_BUCKET before running.");
  process.exit(1);
}

const db = new DBByte({ apiKey, baseUrl });

const testKey = `sdk-roundtrip-${Date.now()}.txt`;
const testContent = "dbbyte sdk roundtrip test";

let failures = 0;

async function step(name, fn) {
  process.stdout.write(`${name}... `);
  try {
    await fn();
    console.log("ok");
  } catch (e) {
    failures++;
    console.log("FAILED");
    if (e instanceof DBByteError) {
      console.error(`  ${e.status} ${e.message}${e.hint ? ` (${e.hint})` : ""}`);
      if (e.retryAfter !== undefined) {
        console.error(`  retryAfter: ${e.retryAfter}s`);
      }
    } else {
      console.error(`  ${e}`);
    }
  }
}

await step("health", async () => {
  const res = await db.health();
  if (res.status !== "ok" && res.status !== "degraded") {
    throw new Error(`unexpected status: ${res.status}`);
  }
});

await step("objects.upload", async () => {
  const blob = new Blob([testContent], { type: "text/plain" });
  const result = await db.objects.upload(bucket, {
    key: testKey,
    body: blob,
    contentType: "text/plain",
  });
  if (!result.success) throw new Error("upload did not report success");
  if (result.name !== testKey) {
    throw new Error(`expected name "${testKey}", got "${result.name}"`);
  }
});

await step("objects.list", async () => {
  // NOTE: not using { prefix } here - the /list route filters on the
  // storage-generated `key` field, not `name`, and key is a
  // timestamp-prefixed, slash-flattened server ID
  // (e.g. "1755392847293-sdk-roundtrip-xxx.txt"), not the name you
  // uploaded with. Prefix filtering by name currently doesn't work as
  // you'd expect - worth a backend fix if folder-style listing matters.
  const result = await db.objects.list(bucket);
  const found = result.files.find((f) => f.name === testKey);
  if (!found) throw new Error("uploaded file not found in list");
});

await step("objects.download", async () => {
  const result = await db.objects.download(bucket, testKey);
  const text = new TextDecoder().decode(result.data);
  if (text !== testContent) {
    throw new Error(`content mismatch: got "${text}"`);
  }
});

await step("objects.versions", async () => {
  const result = await db.objects.versions(bucket, testKey);
  if (result.versions.length < 1) throw new Error("expected at least one version");
});

let signedUrl;
await step("objects.sign", async () => {
  const result = await db.objects.sign(bucket, testKey, { expiresIn: 300 });
  if (!result.url) throw new Error("no url returned");
  signedUrl = result.url;
});

await step("signed url is fetchable", async () => {
  const res = await fetch(signedUrl);
  if (!res.ok) throw new Error(`signed url returned ${res.status}`);
  const text = await res.text();
  if (text !== testContent) throw new Error(`content mismatch via signed url: got "${text}"`);
});

await step("objects.delete", async () => {
  const result = await db.objects.delete(bucket, testKey);
  if (!result.success) throw new Error("delete did not report success");
});

await step("objects.download after delete returns 404", async () => {
  try {
    await db.objects.download(bucket, testKey);
    throw new Error("expected download to fail after delete");
  } catch (e) {
    if (!(e instanceof DBByteError) || e.status !== 404) throw e;
  }
});

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
