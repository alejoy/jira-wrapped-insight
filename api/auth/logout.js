const COOKIE_NAME = "bpn_wrapped_session";

export default function handler(req, res) {
  const { APP_URL } = process.env;
  res.writeHead(302, {
    Location: APP_URL || "/",
    "Set-Cookie": `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
  });
  res.end();
}
