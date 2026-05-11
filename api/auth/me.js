import { createDecipheriv, scryptSync } from "crypto";

const COOKIE_NAME = "bpn_wrapped_session";
const ALGORITHM = "aes-256-gcm";

function decrypt(encoded, secret) {
  const key = scryptSync(secret, "bpn_wrapped_salt", 32);
  const buf = Buffer.from(encoded, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final("utf8");
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  const result = {};
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    result[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return result;
}

function json(res, status, body) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.statusCode = 204;
    res.end();
    return;
  }

  const { COOKIE_SECRET } = process.env;
  if (!COOKIE_SECRET) {
    return json(res, 500, { error: "server_misconfigured" });
  }

  const cookies = parseCookies(req);
  const raw = cookies[COOKIE_NAME];

  if (!raw) {
    return json(res, 401, { error: "no_session" });
  }

  try {
    const session = JSON.parse(decrypt(raw, COOKIE_SECRET));
    if (Date.now() > session.expiresAt) {
      return json(res, 401, { error: "session_expired" });
    }
    return json(res, 200, { user: session.user });
  } catch (err) {
    console.error("me.js decrypt error:", err.message);
    return json(res, 401, { error: "invalid_session" });
  }
}
