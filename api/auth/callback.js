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

function redirect(res, url) {
  res.writeHead(302, { Location: url });
  res.end();
}

export default async function handler(req, res) {
  const { ATLASSIAN_CLIENT_ID, ATLASSIAN_CLIENT_SECRET, APP_URL, COOKIE_SECRET } = process.env;

  if (!ATLASSIAN_CLIENT_ID || !ATLASSIAN_CLIENT_SECRET || !APP_URL || !COOKIE_SECRET) {
    console.error("Missing env vars:", { ATLASSIAN_CLIENT_ID: !!ATLASSIAN_CLIENT_ID, ATLASSIAN_CLIENT_SECRET: !!ATLASSIAN_CLIENT_SECRET, APP_URL: !!APP_URL, COOKIE_SECRET: !!COOKIE_SECRET });
    redirect(res, `${APP_URL || "/"}?error=server_misconfigured`);
    return;
  }

  const url = new URL(req.url, APP_URL);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    redirect(res, `${APP_URL}?error=${encodeURIComponent(error)}`);
    return;
  }

  if (!code) {
    redirect(res, `${APP_URL}?error=missing_code`);
    return;
  }

  const redirectUri = `${APP_URL}/api/auth/callback`;

  try {
    console.log("Exchanging code for tokens...");
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
      console.error("Token exchange failed:", tokenRes.status, err);
      redirect(res, `${APP_URL}?error=token_exchange_failed`);
      return;
    }

    const tokens = await tokenRes.json();
    console.log("Tokens OK, expires_in:", tokens.expires_in);

    console.log("Fetching accessible resources...");
    const resourcesRes = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
      },
    });

    if (!resourcesRes.ok) {
      console.error("Resources failed:", resourcesRes.status);
      redirect(res, `${APP_URL}?error=no_resources`);
      return;
    }

    const resources = await resourcesRes.json();
    console.log("Resources:", resources.length, resources.map(r => r.name));

    if (!resources.length) {
      redirect(res, `${APP_URL}?error=no_jira_sites`);
      return;
    }

    const { id: cloudId } = resources[0];

    console.log("Fetching user info, cloudId:", cloudId);
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
      console.error("Myself failed:", myselfRes.status);
      redirect(res, `${APP_URL}?error=user_fetch_failed`);
      return;
    }

    const myself = await myselfRes.json();
    console.log("User OK:", myself.emailAddress);

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
    console.log("Session encrypted OK, length:", encrypted.length);

    res.writeHead(302, {
      Location: `${APP_URL}?auth=success`,
      "Set-Cookie": `${COOKIE_NAME}=${encrypted}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`,
    });
    res.end();

  } catch (err) {
    console.error("OAuth callback exception:", err.message, err.stack);
    redirect(res, `${APP_URL}?error=internal_error`);
  }
}
