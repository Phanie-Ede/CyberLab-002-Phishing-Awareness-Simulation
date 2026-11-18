
const EVENTS = new Set(["page_visit", "submit_attempt"]);
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const TOKEN_RE = /^[a-f0-9]{64}$/;

function respond(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, b =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

async function hashToken(token) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );

  return Array.from(new Uint8Array(digest), b =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

async function readJSON(request) {
  const raw = await request.text();
  if (raw.length > 100000) {
    throw new Error("Request too large");
  }
  return JSON.parse(raw);
}

async function lookup(db, token) {
  if (typeof token !== "string" ||
      !TOKEN_RE.test(token)) return null;

  const hash = await hashToken(token);

  return db.prepare(`
    SELECT
      cp.campaign_id,
      cp.participant_id,
      p.full_name
    FROM campaign_participants cp
    JOIN participants p
      ON p.id = cp.participant_id
    WHERE cp.tracking_token_hash = ?
  `).bind(hash).first();
}

async function record(db, participant, event) {
  await db.prepare(`
    INSERT INTO events
      (campaign_id, participant_id, event_type)
    VALUES (?, ?, ?)
  `).bind(
    participant.campaign_id,
    participant.participant_id,
    event
  ).run();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const origin = request.headers.get("Origin");
    const allowedOrigin = env.ALLOWED_ORIGIN ||
      "https://example.github.io";

    const cors = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };

    const send = (data, status = 200) =>
      respond(data, status, cors);

    if (request.method === "OPTIONS") {
      return origin === allowedOrigin
        ? new Response(null, { status: 204, headers: cors })
        : send({ error: "Origin not allowed" }, 403);
    }

    if (!env.DB) {
      return send({ error: "Database unavailable" }, 503);
    }

    try {
      if (path === "/" && request.method === "GET") {
        return send({
          status: "Tracker ready",
          version: "4.0"
        });
      }

      // Public personalised training link
      if (path === "/go" && request.method === "GET") {
        const rawToken = url.searchParams.get("token");
        const participant = await lookup(env.DB, rawToken);

        if (!participant) {
          return send({ error: "Invalid training link" }, 404);
        }

        await record(env.DB, participant, "email_click");

        const destination = new URL(
          env.TRAINING_PAGE_URL ||
          "https://example.github.io/security-awareness/"
        );

        destination.searchParams.set("token", rawToken);

        return new Response(null, {
          status: 302,
          headers: {
            "Location": destination.toString(),
            "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer"
          }
        });
      }

      // Events from GitHub Pages
      if (path === "/event" && request.method === "POST") {
        if (origin !== allowedOrigin) {
          return send({ error: "Origin not allowed" }, 403);
        }

        const data = await readJSON(request);

        if (!data || !EVENTS.has(data.event)) {
          return send({ error: "Invalid event" }, 400);
        }

        const participant = await lookup(env.DB, data.token);

        if (!participant) {
          return send({ error: "Invalid participant" }, 404);
        }

        await record(env.DB, participant, data.event);

        return send({
          recorded: true,
          event: data.event
        });
      }

      // Protected administrative endpoints
      if (path.startsWith("/admin/")) {
        if (
          !env.ADMIN_API_KEY ||
          env.ADMIN_API_KEY.length < 32 ||
          request.headers.get("Authorization") !==
            `Bearer ${env.ADMIN_API_KEY}`
        ) {
          return send({ error: "Unauthorised" }, 401);
        }

        // Create or rename a campaign
        if (path === "/admin/campaign" &&
            request.method === "POST") {
          const data = await readJSON(request);

          if (
            !ID_RE.test(data?.id || "") ||
            typeof data.name !== "string" ||
            !data.name.trim() ||
            data.name.length > 150
          ) {
            return send({ error: "Invalid campaign" }, 400);
          }

          await env.DB.prepare(`
            INSERT INTO campaigns (id, name)
            VALUES (?, ?)
            ON CONFLICT(id)
            DO UPDATE SET name = excluded.name
          `).bind(data.id, data.name.trim()).run();

          return send({ saved: true, campaignId: data.id });
        }

        // Bulk employee enrolment
        if (path === "/admin/enrol" &&
            request.method === "POST") {
          const data = await readJSON(request);

          if (
            !ID_RE.test(data?.campaignId || "") ||
            !Array.isArray(data.employees) ||
            data.employees.length < 1 ||
            data.employees.length > 100
          ) {
            return send({ error: "Invalid enrolment" }, 400);
          }

          const campaign = await env.DB.prepare(`
            SELECT id FROM campaigns WHERE id = ?
          `).bind(data.campaignId).first();

          if (!campaign) {
            return send({ error: "Campaign not found" }, 404);
          }

          const seen = new Set();

          for (const employee of data.employees) {
            if (
              !ID_RE.test(employee?.id || "") ||
              typeof employee.name !== "string" ||
              employee.name.trim().length < 2 ||
              employee.name.length > 150 ||
              seen.has(employee.id)
            ) {
              return send({
                error: "Invalid or duplicate employee"
              }, 400);
            }

            seen.add(employee.id);
          }

          const results = [];

          for (const employee of data.employees) {
            const existing = await env.DB.prepare(`
              SELECT tracking_token_hash
              FROM campaign_participants
              WHERE campaign_id = ?
                AND participant_id = ?
            `).bind(
              data.campaignId,
              employee.id
            ).first();

            await env.DB.prepare(`
              INSERT INTO participants
                (id, full_name, department, cohort)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                full_name = excluded.full_name,
                department = excluded.department,
                cohort = excluded.cohort
            `).bind(
              employee.id,
              employee.name.trim(),
              employee.department || null,
              employee.cohort || null
            ).run();

            if (existing) {
              results.push({
                employeeId: employee.id,
                name: employee.name.trim(),
                status: "already_enrolled",
                trainingLink: null
              });
              continue;
            }

            const rawToken = newToken();
            const hashed = await hashToken(rawToken);

            await env.DB.prepare(`
              INSERT INTO campaign_participants
                (campaign_id, participant_id, tracking_token_hash)
              VALUES (?, ?, ?)
            `).bind(
              data.campaignId,
              employee.id,
              hashed
            ).run();

            const link = new URL("/go", request.url);
            link.searchParams.set("token", rawToken);

            results.push({
              employeeId: employee.id,
              name: employee.name.trim(),
              status: "created",
              trainingLink: link.toString()
            });
          }

          return send({
            campaignId: data.campaignId,
            participants: results
          });
        }

        // Named campaign report
        if (path === "/admin/report" &&
            request.method === "GET") {
          const campaignId = url.searchParams.get("campaign");

          if (!ID_RE.test(campaignId || "")) {
            return send({ error: "Invalid campaign ID" }, 400);
          }

          const report = await env.DB.prepare(`
            SELECT
              p.id AS employeeId,
              p.full_name AS name,
              p.department,
              p.cohort,
              COUNT(CASE WHEN e.event_type = 'email_click'
                THEN 1 END) AS emailClicks,
              COUNT(CASE WHEN e.event_type = 'page_visit'
                THEN 1 END) AS pageVisits,
              COUNT(CASE WHEN e.event_type = 'submit_attempt'
                THEN 1 END) AS submitAttempts,
              MIN(CASE WHEN e.event_type = 'email_click'
                THEN e.recorded_at END) AS firstEmailClick,
              MIN(CASE WHEN e.event_type = 'page_visit'
                THEN e.recorded_at END) AS firstPageVisit,
              MIN(CASE WHEN e.event_type = 'submit_attempt'
                THEN e.recorded_at END) AS firstSubmitAttempt
            FROM campaign_participants cp
            JOIN participants p
              ON p.id = cp.participant_id
            LEFT JOIN events e
              ON e.campaign_id = cp.campaign_id
              AND e.participant_id = cp.participant_id
            WHERE cp.campaign_id = ?
            GROUP BY p.id, p.full_name,
              p.department, p.cohort
            ORDER BY p.full_name
          `).bind(campaignId).all();

          return send({
            campaignId,
            participants: report.results
          });
        }

        return send({ error: "Unknown admin route" }, 404);
      }

      return send({ error: "Not found" }, 404);

    } catch (error) {
      console.error("Worker error:", error.message);

      if (error instanceof SyntaxError) {
        return send({ error: "Invalid JSON" }, 400);
      }

      if (error.message === "Request too large") {
        return send({ error: "Request too large" }, 413);
      }

      return send({ error: "Request failed" }, 500);
    }
  }
};

