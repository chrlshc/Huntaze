"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lambda/edge/origin-response.ts
var origin_response_exports = {};
__export(origin_response_exports, {
  COMPRESSIBLE_TYPES: () => COMPRESSIBLE_TYPES,
  SECURITY_HEADERS: () => SECURITY_HEADERS,
  addPerformanceHints: () => addPerformanceHints,
  addSecurityHeaders: () => addSecurityHeaders,
  compressContent: () => compressContent,
  handler: () => handler,
  optimizeCacheHeaders: () => optimizeCacheHeaders,
  setABTestCookie: () => setABTestCookie
});
module.exports = __toCommonJS(origin_response_exports);
var import_zlib = require("zlib");
var SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
};
var COMPRESSIBLE_TYPES = [
  "text/html",
  "text/css",
  "text/javascript",
  "application/javascript",
  "application/json",
  "application/xml",
  "text/xml",
  "text/plain",
  "image/svg+xml"
];
function addSecurityHeaders(response) {
  const headers = response.headers;
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    const headerKey = key.toLowerCase();
    headers[headerKey] = [
      {
        key,
        value
      }
    ];
  });
  if (headers["access-control-allow-origin"]) {
  } else {
    if (response.headers["content-type"]?.[0]?.value?.includes("application/json")) {
      headers["access-control-allow-origin"] = [
        { key: "Access-Control-Allow-Origin", value: "*" }
      ];
      headers["access-control-allow-methods"] = [
        { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" }
      ];
      headers["access-control-allow-headers"] = [
        { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" }
      ];
    }
  }
  return response;
}
function compressContent(response, acceptEncoding) {
  const contentType = response.headers["content-type"]?.[0]?.value || "";
  const isCompressible = COMPRESSIBLE_TYPES.some((type) => contentType.includes(type));
  if (!isCompressible) {
    return response;
  }
  if (response.headers["content-encoding"]) {
    return response;
  }
  const body = response.body;
  if (!body) {
    return response;
  }
  try {
    let compressed;
    let encoding;
    if (acceptEncoding.includes("br")) {
      compressed = (0, import_zlib.brotliCompressSync)(Buffer.from(body, "utf-8"));
      encoding = "br";
    } else if (acceptEncoding.includes("gzip")) {
      compressed = (0, import_zlib.gzipSync)(Buffer.from(body, "utf-8"));
      encoding = "gzip";
    } else {
      return response;
    }
    const originalSize = Buffer.byteLength(body, "utf-8");
    const compressedSize = compressed.length;
    if (compressedSize < originalSize * 0.9) {
      response.body = compressed.toString("base64");
      response.bodyEncoding = "base64";
      response.headers["content-encoding"] = [
        { key: "Content-Encoding", value: encoding }
      ];
      response.headers["content-length"] = [
        { key: "Content-Length", value: compressedSize.toString() }
      ];
    }
    return response;
  } catch (error) {
    console.error("Compression error:", error);
    return response;
  }
}
function optimizeCacheHeaders(response) {
  const headers = response.headers;
  const contentType = headers["content-type"]?.[0]?.value || "";
  if (contentType.includes("image/")) {
    headers["cache-control"] = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
    ];
  } else if (contentType.includes("text/css") || contentType.includes("javascript")) {
    headers["cache-control"] = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
    ];
  } else if (contentType.includes("text/html")) {
    headers["cache-control"] = [
      { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }
    ];
  } else if (contentType.includes("application/json")) {
    headers["cache-control"] = [
      { key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=60" }
    ];
  }
  return response;
}
function addPerformanceHints(response) {
  const headers = response.headers;
  const serverTiming = [
    "edge;dur=0",
    // Edge processing time (placeholder)
    "origin;dur=0"
    // Origin processing time (placeholder)
  ];
  headers["server-timing"] = [
    { key: "Server-Timing", value: serverTiming.join(", ") }
  ];
  if (headers["content-type"]?.[0]?.value?.includes("text/html")) {
    const preloadLinks = [
      "</styles/main.css>; rel=preload; as=style",
      "</scripts/main.js>; rel=preload; as=script"
    ];
    headers["link"] = [
      { key: "Link", value: preloadLinks.join(", ") }
    ];
  }
  return response;
}
function setABTestCookie(response, variant) {
  const headers = response.headers;
  const cookieValue = `ab_variant=${variant}; Max-Age=31536000; Path=/; Secure; SameSite=Lax`;
  if (headers["set-cookie"]) {
    headers["set-cookie"].push({
      key: "Set-Cookie",
      value: cookieValue
    });
  } else {
    headers["set-cookie"] = [
      { key: "Set-Cookie", value: cookieValue }
    ];
  }
  return response;
}
var handler = async (event) => {
  let response = event.Records[0].cf.response;
  const request = event.Records[0].cf.request;
  try {
    const acceptEncoding = request.headers["accept-encoding"]?.[0]?.value || "";
    const abVariant = request.headers["x-ab-variant"]?.[0]?.value || "A";
    response = addSecurityHeaders(response);
    response = compressContent(response, acceptEncoding);
    response = optimizeCacheHeaders(response);
    response = addPerformanceHints(response);
    response = setABTestCookie(response, abVariant);
    return response;
  } catch (error) {
    console.error("Origin response error:", error);
    return response;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  COMPRESSIBLE_TYPES,
  SECURITY_HEADERS,
  addPerformanceHints,
  addSecurityHeaders,
  compressContent,
  handler,
  optimizeCacheHeaders,
  setABTestCookie
});
