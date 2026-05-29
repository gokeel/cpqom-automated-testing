/**
 * Playwright custom reporter: creates a Jira Bug ticket on test failure.
 *
 * Toggle via .env:
 *   JIRA_ENABLED=true   → tickets are created
 *   JIRA_ENABLED=false  → reporter is silent (default while developing)
 */

import path from "path";

class JiraReporter {
  onTestEnd(test, result) {
    // Only act on final attempt (skip intermediate retries)
    if (result.retry < test.retries) return;

    // Only act on failures / timeouts
    if (
      result.status === "passed" ||
      result.status === "skipped" ||
      result.status === "interrupted"
    )
      return;

    // Toggle guard — non-blocking async call
    if (process.env.JIRA_ENABLED !== "true") return;

    this._createJiraTicket(test, result).catch((err) => {
      console.error("[JiraReporter] Failed to create ticket:", err.message);
    });
  }

  async _createJiraTicket(test, result) {
    const {
      JIRA_BASE_URL,
      JIRA_EMAIL,
      JIRA_API_TOKEN,
      JIRA_PROJECT_KEY,
      JIRA_REPORTER_NAME,
      TESTING_ENVIRONMENT
    } = process.env;

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
      console.warn(
        "[JiraReporter] Missing Jira config in .env — skipping ticket creation."
      );
      return;
    }

    const summary = `[Automation] ${test.title} - FAILED`;

    // ── Metadata ──────────────────────────────────────────────────────────────
    const testFile = path.basename(test.location?.file ?? "Unknown file");
    const fullPath = test.location?.file ?? "";
    const durationSec = (result.duration / 1000).toFixed(2);
    const retryCount = result.retry;
    const loginUser = _resolveLoginUser(fullPath);
    const environment = TESTING_ENVIRONMENT ?? "N/A";
    const titlePath = (test.titlePath?.() ?? [test.title]).filter(Boolean);
    const suiteName =
      titlePath.length > 1 ? titlePath.slice(0, -1).join(" > ") : testFile;

    // ── Step analysis ─────────────────────────────────────────────────────────
    const allSteps = _flattenSteps(result.steps ?? []);
    const failedStep = [...allSteps].reverse().find((s) => s.error != null);
    // Ancestry is stored per-step in _flattenSteps — no title-collision risk
    const stepBreadcrumb = failedStep
      ? [...(failedStep._ancestors ?? []), failedStep.title].join(" > ")
      : "N/A";

    // ── Error parsing ─────────────────────────────────────────────────────────
    const rawError = result.error?.message ?? "No error message captured.";
    const expectedResult = _parseAssertionMessage(rawError);
    const cleanError = rawError.replace(/\[[0-9;]*m/g, ""); // strip ANSI

    // ── Build ADF description ─────────────────────────────────────────────────
    const description = {
      type: "doc",
      version: 1,
      content: [
        // ── Section 1: Test Overview ─────────────────────────────────────────
        _adfHeading("Test Overview"),
        _adfRow("Test case", test.title),
        _adfRow("Suite", suiteName),
        _adfRow("Test file", testFile),
        _adfRow("Environment", environment),
        _adfRow("Login user", loginUser),
        _adfRow("Duration", `${durationSec}s`),
        _adfRow("Retries", String(retryCount)),

        // ── Section 2: Failure Details ───────────────────────────────────────
        _adfHeading("Failure Details"),
        _adfRow("Failed step", failedStep?.title ?? "N/A"),
        _adfRow("Step path", stepBreadcrumb),
        _adfRow("Expected result", expectedResult),

        // ── Section 3: Steps Executed ────────────────────────────────────────
        _adfHeading("Steps Executed"),
        _adfStepList(allSteps),

        // ── Section 4: Error Message ─────────────────────────────────────────
        _adfHeading("Error Message"),
        {
          type: "codeBlock",
          content: [{ type: "text", text: cleanError }]
        }
      ]
    };

    const body = {
      fields: {
        project: { key: JIRA_PROJECT_KEY },
        summary,
        issuetype: { name: "Bug" },
        description,
        labels: ["automation", "playwright"],
        ...(JIRA_REPORTER_NAME && { customfield_12055: JIRA_REPORTER_NAME }),
        ...(JIRA_EMAIL && { customfield_13560: JIRA_EMAIL }),
        ...(TESTING_ENVIRONMENT && {
          customfield_11352: { value: TESTING_ENVIRONMENT }
        })
      }
    };

    const credentials = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString(
      "base64"
    );
    const url = `${JIRA_BASE_URL}/rest/api/3/issue`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(body)
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Maps the spec file name to the effective login user label. */
function _resolveLoginUser(filePath) {
  if (process.env.TEST_USER_ADMIN === "true")
    return "sysadmin (TEST_USER_ADMIN=true)";
  const base = path.basename(filePath);
  if (base.includes("account-mgmt") || base.includes("app-navigation"))
    return "marketing";
  if (base.includes("lead-mgmt") || base.includes("oppty-mgmt-sales"))
    return "salesOperation";
  if (base.includes("oppty-mgmt-es") || base.includes("quote-mgmt-es"))
    return "enterpriseSolution";
  return "unknown (check auth.json)";
}

/**
 * Flattens a nested step tree into a single ordered array.
 * Each entry carries _depth and _ancestors (parent title chain) so breadcrumbs
 * can be built without a second tree traversal — avoiding title-collision bugs.
 */
function _flattenSteps(steps, depth = 0, ancestors = []) {
  const result = [];
  for (const step of steps) {
    result.push({ ...step, _depth: depth, _ancestors: ancestors });
    if (step.steps?.length) {
      result.push(
        ..._flattenSteps(step.steps, depth + 1, [...ancestors, step.title])
      );
    }
  }
  return result;
}

/**
 * Extracts the human-readable assertion message from a Playwright error string.
 * Playwright puts the custom message as the first non-blank line before "Locator:" / "Expected:".
 */
function _parseAssertionMessage(errorMessage) {
  const lines = errorMessage
    .replace(/\[[0-9;]*m/g, "") // strip ANSI colour codes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const stopKeywords = [
    "locator:",
    "expected:",
    "received:",
    "call log:",
    "expect(",
    "at "
  ];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (stopKeywords.some((kw) => lower.startsWith(kw))) break;
    // Skip pure Playwright matcher lines like "expect(received).toBeVisible()"
    if (/^expect\(/.test(line)) continue;
    return line;
  }
  return "See error message below";
}

/** ADF heading node (level 3). */
function _adfHeading(text) {
  return {
    type: "heading",
    attrs: { level: 3 },
    content: [{ type: "text", text }]
  };
}

/** ADF bold-label + value paragraph row. */
function _adfRow(label, value) {
  return {
    type: "paragraph",
    content: [
      { type: "text", text: `${label}: `, marks: [{ type: "strong" }] },
      { type: "text", text: value ?? "N/A" }
    ]
  };
}

/**
 * ADF bullet list of executed steps.
 * ✓ for passed, ✗ for failed, • for skipped/unknown.
 */
function _adfStepList(steps) {
  // Only show top-level named steps (depth 0) to keep the list readable
  const topLevel = steps.filter((s) => s._depth === 0);

  if (!topLevel.length) {
    return {
      type: "paragraph",
      content: [{ type: "text", text: "No named steps recorded." }]
    };
  }

  return {
    type: "bulletList",
    content: topLevel.map((step) => {
      const icon = step.error ? "✗" : "✓";
      const status = step.error ? " (FAILED)" : "";
      const dur =
        step.duration != null ? ` [${(step.duration / 1000).toFixed(2)}s]` : "";
      return {
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: `${icon} ${step.title}${status}${dur}`,
                marks: step.error ? [{ type: "strong" }] : []
              }
            ]
          }
        ]
      };
    })
  };
}

export default JiraReporter;
