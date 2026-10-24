// Object keys can contain slashes (e.g. "images/logo.png"). The API's
// catch-all routes expect each path segment encoded individually, then
// rejoined with "/" - encoding the whole key would also encode the slashes.
export function encodeKey(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
