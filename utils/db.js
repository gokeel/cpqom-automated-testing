import pg from "pg";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? "sfdc_test_manager",
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "enakmangan"
});

export async function getModule(moduleKey) {
  const { rows } = await pool.query(
    "SELECT * FROM test_modules WHERE module_key = $1",
    [moduleKey]
  );
  return rows[0];
}

export async function getUserIdForRun(runId) {
  const { rows } = await pool.query(
    "SELECT user_id FROM product_test_runs WHERE id = $1",
    [runId]
  );
  return rows[0]?.user_id ?? null;
}

export async function getTestParams(moduleKey, testCaseId, userId) {
  const { rows } = await pool.query(
    `SELECT tp.parameters
         FROM test_parameters tp
         JOIN test_modules tm ON tp.module_id = tm.id
         WHERE tm.module_key = $1 AND tp.test_case_id = $2 AND tp.user_id = $3`,
    [moduleKey, testCaseId, userId]
  );
  return rows[0]?.parameters ?? {};
}

export async function getRuntimeState(stateKey) {
  const { rows } = await pool.query(
    "SELECT state_value FROM runtime_state WHERE state_key = $1",
    [stateKey]
  );
  return rows[0]?.state_value ?? null;
}

export async function setRuntimeState(stateKey, stateValue) {
  await pool.query(
    `UPDATE runtime_state
         SET state_value = $1, last_updated_at = NOW()
         WHERE state_key = $2`,
    [stateValue, stateKey]
  );
}

export async function updateTestParams(moduleKey, testCaseId, userId, params) {
  await pool.query(
    `UPDATE test_parameters
         SET parameters = parameters || $1::jsonb, updated_at = NOW()
         WHERE module_id = (SELECT id FROM test_modules WHERE module_key = $2)
           AND test_case_id = $3
           AND user_id = $4`,
    [JSON.stringify(params), moduleKey, testCaseId, userId]
  );
}

export async function incrementModuleCounter(moduleKey) {
  const { rows } = await pool.query(
    `UPDATE test_modules
         SET counter = counter + 1
         WHERE module_key = $1
         RETURNING counter`,
    [moduleKey]
  );
  return rows[0]?.counter ?? null;
}

/**
 * Updates a product_test_runs row.
 * Only the fields present in payload are written; others are left unchanged.
 * Pass finished_at: new Date() (or true) to stamp the current time.
 */
export async function updateRun(
  runId,
  { status, log, created_ids, jira_ticket, finished_at } = {}
) {
  if (!runId) return;
  const setParts = [];
  const values = [];
  let i = 1;
  if (status !== undefined) {
    setParts.push(`status = $${i++}`);
    values.push(status);
  }
  if (log !== undefined) {
    setParts.push(`log = $${i++}`);
    values.push(log);
  }
  if (created_ids !== undefined) {
    setParts.push(`created_ids = $${i++}`);
    values.push(JSON.stringify(created_ids));
  }
  if (jira_ticket !== undefined) {
    setParts.push(`jira_ticket = $${i++}`);
    values.push(jira_ticket);
  }
  if (finished_at !== undefined) {
    setParts.push(`finished_at = $${i++}`);
    values.push(finished_at === true ? new Date() : finished_at);
  }
  if (setParts.length === 0) return;
  values.push(runId);
  await pool.query(
    `UPDATE product_test_runs SET ${setParts.join(", ")} WHERE id = $${i}`,
    values
  );
}

export async function closeDb() {
  await pool.end();
}

function laravelDecrypt(encryptedFromDb, appKey) {
  const key = Buffer.from(appKey.replace("base64:", ""), "base64");
  const payload = JSON.parse(
    Buffer.from(encryptedFromDb, "base64").toString("utf8")
  );
  const iv = Buffer.from(payload.iv, "base64");
  const value = Buffer.from(payload.value, "base64");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const raw = Buffer.concat([
    decipher.update(value),
    decipher.final()
  ]).toString("utf8");
  // Laravel PHP-serializes strings: s:<len>:"<value>";
  const match = raw.match(/^s:\d+:"(.*)";$/s);
  return match ? match[1] : raw;
}

export async function getSfEnvironment(personaKey) {
  const appKey = process.env.LARAVEL_APP_KEY;
  if (!appKey) throw new Error("LARAVEL_APP_KEY is not set in environment");

  const { rows } = await pool.query(
    "SELECT * FROM sf_environments WHERE persona_key = $1",
    [personaKey]
  );
  const row = rows[0];
  if (!row)
    throw new Error(`sf_environments: persona_key '${personaKey}' not found`);

  return {
    url: row.sf_url,
    afterLoginUrl: row.after_login_url,
    username: row.username,
    password: laravelDecrypt(row.password, appKey),
    clientId: row.client_id ? laravelDecrypt(row.client_id, appKey) : null,
    clientSecret: row.client_secret
      ? laravelDecrypt(row.client_secret, appKey)
      : null
  };
}
