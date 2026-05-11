# BPN Wrapped — Mesa de Servicios

App tipo "Spotify Wrapped" con login nativo de Atlassian (OAuth 2.0 3-legged).

## Arquitectura

```
Usuario                    App (Vercel)                  Atlassian
  |                            |                              |
  |-- Click "Iniciar sesion" ->|                              |
  |                            |-- Redirect authorize ------->|
  |<------- Pantalla login Atlassian (SSO con AD) ------------|
  |-- Ingresa credenciales --->|                              |
  |                            |<-- code ----------------------|
  |                            |-- POST /oauth/token -------->|
  |                            |<-- access_token + user ------|
  |                            |-- Set-Cookie (cifrada) ----->|
  |<-- Redirect + wrapped data-|                              |
```

El `access_token` nunca toca el cliente — vive en una cookie HttpOnly cifrada en el servidor.

---

## Setup en Atlassian Developer Console

Ya registrada. Para verificar o ajustar:
1. Ir a https://developer.atlassian.com/console/myapps
2. Abrir la app **BPN Wrapped**
3. En **Authorization** verificar que el Callback URL sea:
   - `https://TU-APP.vercel.app/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (para desarrollo local)
4. En **Permissions** confirmar que tenga: `read:jira-user` y `read:jira-work`

---

## Variables de entorno en Vercel

Settings -> Environment Variables:

| Variable | Descripcion | Valor |
|---|---|---|
| `ATLASSIAN_CLIENT_ID` | Client ID de la app OAuth | `8QzSm9lcWaA8XaFtUHbgUjNK6GTRyXCm` |
| `ATLASSIAN_CLIENT_SECRET` | Client Secret (**rotar despues de configurar**) | el tuyo |
| `APP_URL` | URL publica sin slash final | `https://bpn-wrapped.vercel.app` |
| `COOKIE_SECRET` | String aleatorio para cifrar cookies | ver abajo como generarlo |
| `JIRA_PROJECTS` | Claves de proyectos Jira (opcional) | `SEG,SIT,SD,OS` |

**Generar COOKIE_SECRET** (correr una vez localmente):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> IMPORTANTE: Rotar el Client Secret en developer.atlassian.com despues de configurarlo en Vercel.

---

## Correr localmente

```bash
npm install
npm install -g vercel

# Crear .env.local
cat > .env.local << EOF
ATLASSIAN_CLIENT_ID=8QzSm9lcWaA8XaFtUHbgUjNK6GTRyXCm
ATLASSIAN_CLIENT_SECRET=tu-secret-aqui
APP_URL=http://localhost:3000
COOKIE_SECRET=genera-uno-con-el-comando-de-arriba
JIRA_PROJECTS=SEG,SIT,SD
EOF

vercel dev
```

Abrir http://localhost:3000

---

## Deploy

```bash
vercel --prod
```

O conectar el repo a Vercel para deploy automatico en cada push a main.

---

## Flujo del usuario

1. Entran a la URL
2. Seleccionan el ano
3. Click en "Iniciar sesion con Atlassian"
4. Se abre la pantalla de Atlassian (si el tenant tiene SSO con AD, aparece el login de Microsoft directamente)
5. Autorizan la app
6. Regresan automaticamente con su wrapped

La sesion dura 8 horas. Al expirar, el boton de logout redirige al login de Atlassian nuevamente.

---

## Seguridad

- El `access_token` de Atlassian nunca se expone al cliente — vive en una cookie `HttpOnly; Secure; SameSite=Lax` cifrada con AES-256-GCM
- La query a Jira usa `reporter = currentUser()` — Jira resuelve el usuario por el token, imposible ver datos de otros
- Verificacion de CSRF via `state` parameter en el flujo OAuth
- Sin base de datos — zero persistencia de tokens en el servidor
