import { createDecipheriv, scryptSync } from "crypto";

const COOKIE_NAME = "bpn_wrapped_session";
const ALGORITHM = "aes-256-gcm";

const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

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
    result[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return result;
}

function getSession(req) {
  const { COOKIE_SECRET } = process.env;
  if (!COOKIE_SECRET) return null;
  const cookies = parseCookies(req);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;
  try {
    const session = JSON.parse(decrypt(raw, COOKIE_SECRET));
    if (Date.now() > session.expiresAt) return null;
    return session;
  } catch (err) {
    console.error("getSession error:", err.message);
    return null;
  }
}

function json(res, status, body) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

async function fetchAllIssues(accessToken, cloudId, year) {
  const { JIRA_PROJECTS } = process.env;
  const projects = JIRA_PROJECTS
    ? JIRA_PROJECTS.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  const projectFilter = projects.length > 0
    ? `project IN (${projects.join(",")}) AND `
    : "";

  const jql = `${projectFilter}reporter = currentUser() AND created >= "${year}-01-01" AND created <= "${year}-12-31" ORDER BY created DESC`;

  const all = [];
  let startAt = 0;

  while (true) {
    const params = new URLSearchParams({
      jql,
      startAt: String(startAt),
      maxResults: "100",
      fields: "summary,issuetype,created,resolutiondate,status,customfield_10010,project",
    });

    const res = await fetch(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Jira search error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const issues = data.issues || [];
    all.push(...issues);

    if (startAt + issues.length >= data.total || issues.length === 0) break;
    startAt += 100;
  }

  return all;
}

function calculateMetrics(issues, year) {
  const typeCount = {};
  const projectCount = {};
  const monthlyCount = new Array(12).fill(0);
  const weekdayCount = new Array(7).fill(0);
  let totalResolutionMs = 0;
  let resolvedCount = 0;
  let quickResolves = 0;

  for (const issue of issues) {
    const type =
      issue.fields.customfield_10010?.requestType?.name ||
      issue.fields.issuetype?.name || "Otro";
    typeCount[type] = (typeCount[type] || 0) + 1;

    const project = issue.fields.project?.name || "Sin proyecto";
    projectCount[project] = (projectCount[project] || 0) + 1;

    const created = new Date(issue.fields.created);
    monthlyCount[created.getMonth()]++;
    weekdayCount[created.getDay()]++;

    if (issue.fields.resolutiondate) {
      const resolved = new Date(issue.fields.resolutiondate);
      const ms = resolved - created;
      if (ms > 0) {
        totalResolutionMs += ms;
        resolvedCount++;
        if (ms < 4 * 60 * 60 * 1000) quickResolves++;
      }
    }
  }

  const topRequestTypes = Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  const topProjects = Object.entries(projectCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([project, count]) => ({ project, count }));

  const monthlyBreakdown = MONTHS_ES.map((month, i) => ({ month, count: monthlyCount[i] }));
  const peakMonthIndex = monthlyCount.indexOf(Math.max(...monthlyCount));
  const avgResolutionHours = resolvedCount > 0
    ? Math.round((totalResolutionMs / resolvedCount / 3_600_000) * 10) / 10 : 0;
  const firstContactRate = resolvedCount > 0
    ? Math.round((quickResolves / resolvedCount) * 100) : 0;
  const DAYS_ES = ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"];
  const peakWeekday = DAYS_ES[weekdayCount.indexOf(Math.max(...weekdayCount))];
  const activeMonths = monthlyCount.filter((c) => c > 0).length || 1;

  return {
    year,
    total_issues: issues.length,
    resolved_issues: resolvedCount,
    top_request_types: topRequestTypes,
    top_projects: topProjects,
    avg_resolution_hours: avgResolutionHours,
    peak_month: MONTHS_ES[peakMonthIndex],
    peak_weekday: peakWeekday,
    first_contact_rate: firstContactRate,
    monthly_breakdown: monthlyBreakdown,
    avg_per_month: Math.round(issues.length / activeMonths),
  };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const session = getSession(req);
  if (!session) {
    return json(res, 401, { error: "unauthenticated", message: "Sesion no encontrada o expirada." });
  }

  const year = parseInt(req.query.year || String(new Date().getFullYear() - 1), 10);
  if (isNaN(year) || year < 2020 || year > new Date().getFullYear() + 1) {
    return json(res, 400, { error: "invalid year" });
  }

  try {
    console.log(`Fetching issues for ${session.user.email}, year ${year}`);
    const issues = await fetchAllIssues(session.accessToken, session.cloudId, year);
    console.log(`Found ${issues.length} issues`);
    const metrics = calculateMetrics(issues, year);
    return json(res, 200, { user: session.user, ...metrics });
  } catch (err) {
    console.error("Jira error:", err.message);
    return json(res, 500, { error: "jira_error", message: err.message });
  }
}
