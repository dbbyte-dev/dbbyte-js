import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { DBByte } from "../dist/index.mjs";

async function withServer(reply, fn) {
  const seen = {};
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      Object.assign(seen, { method: req.method, url: req.url, body });
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(reply));
    });
  });
  await new Promise((r) => server.listen(0, r));
  const db = new DBByte({ apiKey: "dbk_test", baseUrl: `http://127.0.0.1:${server.address().port}` });
  try {
    await fn(db, seen);
  } finally {
    server.close();
  }
}

test("buckets create/update/delete", async () => {
  await withServer({ bucket: { slug: "media" } }, async (db, seen) => {
    await db.buckets.create({ name: "Media", region: "us-east", isPublic: true });
    assert.equal(seen.method, "POST");
    assert.equal(seen.url, "/buckets");
    assert.deepEqual(JSON.parse(seen.body), { name: "Media", region: "us-east", isPublic: true });
    await db.buckets.update("media", { cdn: false });
    assert.equal(seen.method, "PATCH");
    assert.equal(seen.url, "/buckets/media");
    assert.equal(seen.body, '{"cdn":false}');
    await db.buckets.delete("media");
    assert.equal(seen.method, "DELETE");
    await db.buckets.list();
    assert.equal(seen.url, "/buckets");
  });
});

test("cdn.purge", async () => {
  await withServer({ success: true, purged: 1, failed: [] }, async (db, seen) => {
    const res = await db.cdn.purge({ slug: "media", scope: "file", path: "a.png" });
    assert.equal(res.purged, 1);
    assert.equal(seen.url, "/purge");
    assert.deepEqual(JSON.parse(seen.body), { slug: "media", scope: "file", path: "a.png" });
  });
});

test("data get/create/appendText/update/delete", async () => {
  await withServer({ data: [] }, async (db, seen) => {
    await db.data.get("people", { limit: 5, fields: ["a", "b"], filters: { city: "Oslo" } });
    assert.match(seen.url, /^\/v1\/data\/people\?/);
    for (const part of ["city=Oslo", "limit=5", "fields=a%2Cb"]) assert.ok(seen.url.includes(part), part);
    await db.data.appendText("notes", "hi");
    assert.equal(seen.body, '{"appendText":"hi"}');
    await db.data.update("people", "7", { a: 1 });
    assert.equal(seen.method, "PATCH");
    assert.equal(seen.url, "/v1/data/people/7");
    await db.data.create("people", { a: 1 });
    assert.equal(seen.method, "POST");
    await db.data.delete("people", "7");
    assert.equal(seen.method, "DELETE");
  });
});

test("objects.uploadUrl", async () => {
  await withServer({ url: "u", method: "PUT", headers: {}, expiresIn: 900 }, async (db, seen) => {
    const res = await db.objects.uploadUrl("media", { name: "a.png", contentType: "image/png", size: 10 });
    assert.equal(res.method, "PUT");
    assert.equal(seen.url, "/storage/media/upload-url");
    assert.deepEqual(JSON.parse(seen.body), { name: "a.png", contentType: "image/png", size: 10 });
  });
});
