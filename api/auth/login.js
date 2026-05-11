/**
 * GET /api/auth/login
 * Genera la URL de autorización de Atlassian y redirige al usuario.
 *
 * Variables de entorno requeridas:
 *   ATLASSIAN_CLIENT_ID     → Client ID de tu app OAuth en developer.atlassian.com
 *   APP_URL                 → URL pública de la app, ej: https://bpn-wrapped.vercel.app
 */

export default function handler(req, res) {
  const { ATLASSIAN_CLIENT_ID, APP_URL } = process.env;

  if (!ATLASSIAN_CLIENT_ID || !APP_URL) {
    return res.status(500).json({ error: "OAuth no configurado en el servidor" });
  }

  // State aleatorio para prevenir CSRF — lo guardamos en cookie y lo verificamos en el callback
  const state = crypto.randomUUID();
  const redirectUri = `${APP_URL}/api/auth/callback`;

  const scopes = [
    "read:jira-user",
    "read:jira-work",
    "offline_access", // permite refresh token
  ].join(" ");

  const authUrl = new URL("https://auth.atlassian.com/authorize");
  authUrl.searchParams.set("audience", "api.atlassian.com");
  authUrl.searchParams.set("client_id", ATLASSIAN_CLIENT_ID);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("prompt", "consent");

  // Guardar state en cookie HttpOnly para verificarlo en el callback
  res.setHeader("Set-Cookie", [
    `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
  ]);

  res.redirect(302, authUrl.toString());
}
