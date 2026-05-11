export default function handler(req, res) {
  const { ATLASSIAN_CLIENT_ID, APP_URL } = process.env;

  if (!ATLASSIAN_CLIENT_ID || !APP_URL) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "OAuth no configurado en el servidor" }));
    return;
  }

  const redirectUri = `${APP_URL}/api/auth/callback`;

  const scopes = ["read:jira-user", "read:jira-work", "offline_access"].join(" ");

  const authUrl = new URL("https://auth.atlassian.com/authorize");
  authUrl.searchParams.set("audience", "api.atlassian.com");
  authUrl.searchParams.set("client_id", ATLASSIAN_CLIENT_ID);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", crypto.randomUUID());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("prompt", "consent");

  res.writeHead(302, { Location: authUrl.toString() });
  res.end();
}
