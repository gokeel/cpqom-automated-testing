import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    database: 'sfdc_test_manager',
    user: 'postgres',
    password: 'enakmangan',
});

export async function getModule(moduleKey) {
    const { rows } = await pool.query(
        'SELECT * FROM test_modules WHERE module_key = $1',
        [moduleKey]
    );
    return rows[0];
}

export async function getTestParams(moduleKey, testCaseId) {
    const { rows } = await pool.query(
        `SELECT tp.parameters
         FROM test_parameters tp
         JOIN test_modules tm ON tp.module_id = tm.id
         WHERE tm.module_key = $1 AND tp.test_case_id = $2`,
        [moduleKey, testCaseId]
    );
    return rows[0]?.parameters ?? {};
}

export async function getRuntimeState(stateKey) {
    const { rows } = await pool.query(
        'SELECT state_value FROM runtime_state WHERE state_key = $1',
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

export async function updateTestParams(moduleKey, testCaseId, params) {
    await pool.query(
        `UPDATE test_parameters
         SET parameters = parameters || $1::jsonb, updated_at = NOW()
         WHERE module_id = (SELECT id FROM test_modules WHERE module_key = $2)
           AND test_case_id = $3`,
        [JSON.stringify(params), moduleKey, testCaseId]
    );
}

export async function closeDb() {
    await pool.end();
}
