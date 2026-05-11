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
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    result[key] = val;
  }
  return result;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export default function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).set(CORS).end();

  const { COOKIE_SECRET } = process.env;
  if (!COOKIE_SECRET) {
    return res.status(500).set(CORS).json({ error: "server_misconfigured" });
  }

  const cookies = parseCookies(req);
  const raw = cookies[COOKIE_NAME];

  if (!raw) {
    return res.status(401).set(CORS).json({ error: "no_session" });
  }

  try {
    const session = JSON.parse(decrypt(raw, COOKIE_SECRET));
    if (Date.now() > session.expiresAt) {
      return res.status(401).set(CORS).json({ error: "session_expired" });
    }
    return res.status(200).set(CORS).json({ user: session.user });
  } catch (err) {
    console.error("me.js decrypt error:", err.message);
    return res.status(401).set(CORS).json({ error: "invalid_session" });
  }
}
