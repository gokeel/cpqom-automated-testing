/**
 * Playwright custom reporter: creates a Jira Bug ticket on test failure.
 *
 * Toggle via .env:
 *   JIRA_ENABLED=true   → tickets are created
 *   JIRA_ENABLED=false  → reporter is silent (default while developing)
 */

class JiraReporter {
  onTestEnd(test, result) {
    // Only act on final attempt (skip intermediate retries)
    if (result.retry < test.retries) return;

    // Only act on failures / timeouts
    if (result.status === 'passed' || result.status === 'skipped' || result.status === 'interrupted') return;

    // Toggle guard — non-blocking async call
    if (process.env.JIRA_ENABLED !== 'true') return;

    this._createJiraTicket(test, result).catch((err) => {
      console.error('[JiraReporter] Failed to create ticket:', err.message);
    });
  }

  async _createJiraTicket(test, result) {
    const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY, TESTING_ENVIRONMENT } = process.env;

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
      console.warn('[JiraReporter] Missing Jira config in .env — skipping ticket creation.');
      return;
    }

    const summary = `[Automation] ${test.title} - FAILED`;

    // Find the last failed step name (if any)
    const failedStep = [...(result.steps ?? [])]
      .reverse()
      .find((s) => s.error != null);
    const stepName = failedStep?.title ?? 'N/A';

    const errorMessage = result.error?.message ?? 'No error message captured.';
    const testFile = test.location?.file ?? 'Unknown file';
    const durationSec = (result.duration / 1000).toFixed(2);

    const description = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Failure Details' }],
        },
        _adfRow('Test file', testFile),
        _adfRow('Failed step', stepName),
        _adfRow('Duration', `${durationSec}s`),
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Error Message' }],
        },
        {
          type: 'codeBlock',
          content: [{ type: 'text', text: errorMessage }],
        },
      ],
    };

    const body = {
      fields: {
        project: { key: JIRA_PROJECT_KEY },
        summary,
        issuetype: { name: 'Bug' },
        description,
        labels: ['automation', 'playwright'],
        ...(TESTING_ENVIRONMENT && { customfield_11352: { value: TESTING_ENVIRONMENT } }),
      },
    };

    const credentials = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    const url = `${JIRA_BASE_URL}/rest/api/3/issue`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Jira API ${response.status}: ${text}`);
    }

    const data = await response.json();
    const ticketUrl = `${JIRA_BASE_URL}/browse/${data.key}`;
    console.log(`[JiraReporter] Bug ticket created: ${ticketUrl}`);
  }
}

/** Helper: renders a key-value paragraph row in Atlassian Document Format */
function _adfRow(label, value) {
  return {
    type: 'paragraph',
    content: [
      { type: 'text', text: `${label}: `, marks: [{ type: 'strong' }] },
      { type: 'text', text: value },
    ],
  };
}

export default JiraReporter;
