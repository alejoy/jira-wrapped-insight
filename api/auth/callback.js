import { createCipheriv, scryptSync, randomBytes } from "crypto";

const COOKIE_NAME = "bpn_wrapped_session";
const ALGORITHM = "aes-256-gcm";

function encrypt(text, secret) {
  const key = scryptSync(secret, "bpn_wrapped_salt", 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export default async function handler(req, res) {
  const { ATLASSIAN_CLIENT_ID, ATLASSIAN_CLIENT_SECRET, APP_URL, COOKIE_SECRET } = process.env;

  if (!ATLASSIAN_CLIENT_ID || !ATLASSIAN_CLIENT_SECRET || !APP_URL || !COOKIE_SECRET) {
    console.error("Missing env vars");
    return res.redirect(302, `${APP_URL || "/"}?error=server_misconfigured`);
  }

  const { code, error } = req.query;

  if (error) {
    return res.redirect(302, `${APP_URL}?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(302, `${APP_URL}?error=missing_code`);
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
    console.log("Tokens obtained, expires_in:", tokens.expires_in);

    // 2. Obtener cloudId
    const resourcesRes = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
      },
    });

    if (!resourcesRes.ok) {
      console.error("Resources failed:", await resourcesRes.text());
      return res.redirect(302, `${APP_URL}?error=no_resources`);
    }

    const resources = await resourcesRes.json();
    console.log("Resources count:", resources.length);

    if (!resources.length) {
      return res.redirect(302, `${APP_URL}?error=no_jira_sites`);
    }

    const { id: cloudId } = resources[0];

    // 3. Datos del usuario
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
      console.error("Myself failed:", await myselfRes.text());
      return res.redirect(302, `${APP_URL}?error=user_fetch_failed`);
    }

    const myself = await myselfRes.json();
    console.log("User:", myself.emailAddress);

    // 4. Cifrar sesion en cookie HttpOnly
    const expiresAt = Date.now() + (tokens.expires_in || 3600) * 1000;
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
    console.log("Session encrypted, length:", encrypted.length);

    res.setHeader("Set-Cookie", [
      `${COOKIE_NAME}=${encrypted}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`,
    ]);

    return res.redirect(302, `${APP_URL}?auth=success`);
  } catch (err) {
    console.error("OAuth callback error:", err.message);
    return res.redirect(302, `${APP_URL}?error=internal_error`);
  }
}
 
