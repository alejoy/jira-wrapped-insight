/**
 * GET /api/auth/callback
 * Atlassian redirige acá con ?code=...&state=...
 * Intercambiamos el code por access_token y guardamos en cookie HttpOnly cifrada.
 *
 * Variables de entorno requeridas:
 *   ATLASSIAN_CLIENT_ID
 *   ATLASSIAN_CLIENT_SECRET
 *   APP_URL
 *   COOKIE_SECRET   → string aleatorio largo para cifrar la cookie (mínimo 32 chars)
 *                     Generalo con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from "crypto";

const COOKIE_NAME = "bpn_wrapped_session";
const ALGORITHM = "aes-256-gcm";

function encrypt(text, secret) {
  const key = crypto.scryptSync(secret, "bpn_wrapped_salt", 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv(12) + tag(16) + data
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return Object.fromEntries(
    raw.split(";").map((c) => c.trim().split("=").map(decodeURIComponent))
  );
}

export default async function handler(req, res) {
  const { ATLASSIAN_CLIENT_ID, ATLASSIAN_CLIENT_SECRET, APP_URL, COOKIE_SECRET } = process.env;

  if (!ATLASSIAN_CLIENT_ID || !ATLASSIAN_CLIENT_SECRET || !APP_URL || !COOKIE_SECRET) {
    return res.redirect(302, `${APP_URL || "/"}?error=server_misconfigured`);
  }

  const { code, state, error } = req.query;

  // Error devuelto por Atlassian (ej: usuario canceló)
  if (error) {
    return res.redirect(302, `${APP_URL}?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.redirect(302, `${APP_URL}?error=missing_params`);
  }

  // Verificar CSRF state
  const cookies = parseCookies(req);
  const savedState = cookies["oauth_state"];
  if (!savedState || savedState !== state) {
    return res.redirect(302, `${APP_URL}?error=invalid_state`);
  }

  const redirectUri = `${APP_URL}/api/auth/callback`;

  try {
    // 1. Intercambiar code por tokens
    const tokenRes = await fetch("https://auth.atlassian.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: ATLASSIAN_CLIENT_ID,
        client_secret: ATLASSIAN_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Token exchange failed:", err);
      return res.redirect(302, `${APP_URL}?error=token_exchange_failed`);
    }

    const tokens = await tokenRes.json();
    // tokens = { access_token, refresh_token, expires_in, token_type, scope }

    // 2. Obtener sitios accesibles (cloudId)
    const resourcesRes = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
      },
    });

    if (!resourcesRes.ok) {
      return res.redirect(302, `${APP_URL}?error=no_resources`);
    }

    const resources = await resourcesRes.json();
    if (!resources.length) {
      return res.redirect(302, `${APP_URL}?error=no_jira_sites`);
    }

    // Usar el primer sitio (en BPN solo hay uno)
    const { id: cloudId } = resources[0];

    // 3. Obtener datos del usuario
    const myselfRes = await fetch(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/myself`,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: "application/json",
        },
      }
    );

    if (!myselfRes.ok) {
      return res.redirect(302, `${APP_URL}?error=user_fetch_failed`);
    }

    const myself = await myselfRes.json();

    // 4. Armar payload de sesión y cifrarlo en cookie HttpOnly
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    const session = JSON.stringify({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      cloudId,
      expiresAt,
      user: {
        email: myself.emailAddress,
        displayName: myself.displayName,
        accountId: myself.accountId,
        avatarUrl: myself.avatarUrls?.["48x48"] || null,
      },
    });

    const encrypted = encrypt(session, COOKIE_SECRET);

    // Cookie de sesión cifrada (HttpOnly, no accesible desde JS)
    // Max-Age: 8 horas (sesión de trabajo)
    const sessionCookie = `${COOKIE_NAME}=${encrypted}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`;
    // Limpiar cookie de state
    const clearState = `oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

    res.setHeader("Set-Cookie", [sessionCookie, clearState]);

    // Redirigir al front con señal de éxito
    res.redirect(302, `${APP_URL}?auth=success`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect(302, `${APP_URL}?error=internal_error`);
  }
}
