export function convertToHTTPS(url: string) {
  return url.startsWith("http://localhost:") ? url : url.replace(/^http:\/\//, "https://");
}
