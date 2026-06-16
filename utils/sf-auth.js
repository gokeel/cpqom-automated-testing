/**
 * Authenticates against Salesforce using the client_credentials OAuth flow.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {{ url: string, clientId: string, clientSecret: string }} sfEnv
 * @returns {Promise<{ accessToken: string, instanceUrl: string }>}
 */
export async function sfOAuthLogin(request, sfEnv) {
  const loginResponse = await request.post(
    `${sfEnv.url}/services/oauth2/token`,
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      form: {
        grant_type: "client_credentials",
        client_id: sfEnv.clientId,
        client_secret: sfEnv.clientSecret
      }
    }
  );
  if (!loginResponse.ok()) {
    throw new Error(
      `OAuth login failed: HTTP ${loginResponse.status()} — check clientId/clientSecret in sf_environments`
    );
  }
  const body = await loginResponse.json();
  console.log("Instance URL:", body.instance_url);
  return { accessToken: body.access_token, instanceUrl: body.instance_url };
}
