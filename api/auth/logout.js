/**
 * GET /api/auth/logout
 * Borra la cookie de sesión y redirige al inicio.
 */

const COOKIE_NAME = "bpn_wrapped_session";

export default function handler(req, res) {
  const { APP_URL } = process.env;
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
  );
  res.redirect(302, APP_URL || "/");
}
