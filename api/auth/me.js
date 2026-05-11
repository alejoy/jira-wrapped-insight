/**
 * GET /api/auth/me
 * Lee la cookie de sesión cifrada y devuelve los datos del usuario.
 * El front lo llama al iniciar para saber si ya hay sesión activa.
 */

import crypto from "crypto";

const COOKIE_NAME = "bpn_wrapped_session";
const ALGORITHM = "aes-256-gcm";

function decrypt(encoded, secret) {
  const key = crypto.scryptSync(secret, "bpn_wrapped_salt", 32);
  const buf = Buffer.from(encoded, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final("utf8");
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return Object.fromEntries(
    raw.split(";").map((c) => c.trim().split("=").map(decodeURIComponent))
  );
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

    // Verificar que el token no haya expirado
    if (Date.now() > session.expiresAt) {
      return res.status(401).set(CORS).json({ error: "session_expired" });
    }

    return res.status(200).set(CORS).json({ user: session.user });
  } catch {
    return res.status(401).set(CORS).json({ error: "invalid_session" });
  }
}
