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

// lambda/edge/viewer-request.ts
var viewer_request_exports = {};
__export(viewer_request_exports, {
  ABTestVariant: () => ABTestVariant,
  DeviceType: () => DeviceType,
  assignABTestVariant: () => assignABTestVariant,
  detectDevice: () => detectDevice,
  deviceBasedRouting: () => deviceBasedRouting,
  handler: () => handler,
  normalizeHeaders: () => normalizeHeaders,
  simpleHash: () => simpleHash,
  validateAuth: () => validateAuth
});
module.exports = __toCommonJS(viewer_request_exports);
var DeviceType = /* @__PURE__ */ ((DeviceType2) => {
  DeviceType2["MOBILE"] = "mobile";
  DeviceType2["TABLET"] = "tablet";
  DeviceType2["DESKTOP"] = "desktop";
  DeviceType2["BOT"] = "bot";
  return DeviceType2;
})(DeviceType || {});
var ABTestVariant = /* @__PURE__ */ ((ABTestVariant2) => {
  ABTestVariant2["A"] = "A";
  ABTestVariant2["B"] = "B";
  return ABTestVariant2;
})(ABTestVariant || {});
function normalizeHeaders(request) {
  const headers = request.headers;
  if (headers["accept-encoding"]) {
    const acceptEncoding = headers["accept-encoding"][0].value.toLowerCase();
    if (acceptEncoding.includes("br")) {
      headers["accept-encoding"] = [{ key: "Accept-Encoding", value: "br" }];
    } else if (acceptEncoding.includes("gzip")) {
      headers["accept-encoding"] = [{ key: "Accept-Encoding", value: "gzip" }];
    } else {
      delete headers["accept-encoding"];
    }
  }
  const userAgent = headers["user-agent"]?.[0]?.value || "";
  const deviceType = detectDevice(userAgent);
  headers["cloudfront-is-mobile-viewer"] = [
    { key: "CloudFront-Is-Mobile-Viewer", value: deviceType === "mobile" /* MOBILE */ ? "true" : "false" }
  ];
  headers["cloudfront-is-tablet-viewer"] = [
    { key: "CloudFront-Is-Tablet-Viewer", value: deviceType === "tablet" /* TABLET */ ? "true" : "false" }
  ];
  headers["cloudfront-is-desktop-viewer"] = [
    { key: "CloudFront-Is-Desktop-Viewer", value: deviceType === "desktop" /* DESKTOP */ ? "true" : "false" }
  ];
  return request;
}
function detectDevice(userAgent) {
  const ua = userAgent.toLowerCase();
  if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider") || ua.includes("googlebot") || ua.includes("bingbot")) {
    return "bot" /* BOT */;
  }
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone") || ua.includes("ipod") || ua.includes("blackberry") || ua.includes("windows phone")) {
    return "mobile" /* MOBILE */;
  }
  if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet" /* TABLET */;
  }
  return "desktop" /* DESKTOP */;
}
function deviceBasedRouting(request) {
  const deviceType = detectDevice(request.headers["user-agent"]?.[0]?.value || "");
  if (deviceType === "mobile" /* MOBILE */) {
    request.headers["x-device-type"] = [{ key: "X-Device-Type", value: "mobile" }];
  } else if (deviceType === "tablet" /* TABLET */) {
    request.headers["x-device-type"] = [{ key: "X-Device-Type", value: "tablet" }];
  } else {
    request.headers["x-device-type"] = [{ key: "X-Device-Type", value: "desktop" }];
  }
  return request;
}
function validateAuth(request) {
  const authCookie = request.headers["cookie"]?.[0]?.value || "";
  const authHeader = request.headers["authorization"]?.[0]?.value || "";
  let token = null;
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (authCookie.includes("auth_token=")) {
    const match = authCookie.match(/auth_token=([^;]+)/);
    token = match ? match[1] : null;
  }
  const publicPaths = ["/login", "/register", "/public", "/api/health"];
  const isPublicPath = publicPaths.some((path) => request.uri.startsWith(path));
  if (isPublicPath) {
    return request;
  }
  if (!token) {
    return {
      status: "401",
      statusDescription: "Unauthorized",
      body: JSON.stringify({ error: "Authentication required" })
    };
  }
  if (token.length < 10) {
    return {
      status: "401",
      statusDescription: "Unauthorized",
      body: JSON.stringify({ error: "Invalid token" })
    };
  }
  request.headers["x-auth-token"] = [{ key: "X-Auth-Token", value: token }];
  return request;
}
function assignABTestVariant(request) {
  const cookies = request.headers["cookie"]?.[0]?.value || "";
  const variantMatch = cookies.match(/ab_variant=([AB])/);
  let variant;
  if (variantMatch) {
    variant = variantMatch[1];
  } else {
    const clientIp = request.headers["cloudfront-viewer-address"]?.[0]?.value || "";
    const hash = simpleHash(clientIp);
    variant = hash % 2 === 0 ? "A" /* A */ : "B" /* B */;
  }
  request.headers["x-ab-variant"] = [{ key: "X-AB-Variant", value: variant }];
  return request;
}
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
var handler = async (event) => {
  let request = event.Records[0].cf.request;
  try {
    request = normalizeHeaders(request);
    request = deviceBasedRouting(request);
    const authResult = validateAuth(request);
    if ("status" in authResult) {
      return authResult;
    }
    request = authResult;
    request = assignABTestVariant(request);
    return request;
  } catch (error) {
    console.error("Viewer request error:", error);
    return {
      status: "500",
      statusDescription: "Internal Server Error",
      body: JSON.stringify({ error: "Request processing failed" })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ABTestVariant,
  DeviceType,
  assignABTestVariant,
  detectDevice,
  deviceBasedRouting,
  handler,
  normalizeHeaders,
  simpleHash,
  validateAuth
});
