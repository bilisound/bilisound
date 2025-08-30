export function convertToHTTPS(url: string) {
  if (!url) {
    console.log("url is missing: " + url);
    return url;
  }
  if (url.startsWith("http://localhost:")) {
    return url;
  }
  return url.replace(/^http:\/\//, "https://");
}
