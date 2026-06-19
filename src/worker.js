const OAUTH_PROTECTED_RESOURCE = JSON.stringify({
  resource: "https://milkyway.center",
  authorization_servers: ["https://milkyway.center"],
  scopes_supported: ["public"],
  bearer_methods_supported: ["header"],
  resource_documentation: "https://milkyway.center/auth.md",
  resource_policy_uri: "https://milkyway.center/auth.md",
  resource_signing_alg_values_supported: [],
  description: "All resources on this site are publicly accessible. No authentication tokens are required.",
});

const OAUTH_AUTHORIZATION_SERVER = JSON.stringify({
  issuer: "https://milkyway.center",
  service_documentation: "https://milkyway.center/auth.md",
  op_policy_uri: "https://milkyway.center/auth.md",
  response_types_supported: [],
  grant_types_supported: [],
  scopes_supported: ["public"],
  agent_auth: {
    skill: "https://milkyway.center/auth.md",
    register_uri: "https://milkyway.center/agent/register",
    claim_uri: "https://milkyway.center/agent/register",
    identity_types_supported: ["anonymous"],
    anonymous: {
      credential_types_supported: ["bearer"],
      claim_uri: "https://milkyway.center/agent/register",
    },
  },
});

const WELL_KNOWN_JSON = {
  "/.well-known/oauth-protected-resource": OAUTH_PROTECTED_RESOURCE,
  "/.well-known/oauth-authorization-server": OAUTH_AUTHORIZATION_SERVER,
  "/.well-known/openid-configuration": OAUTH_AUTHORIZATION_SERVER,
};

const LINK_HEADERS = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"',
  '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
  '</auth.md>; rel="auth-doc"',
  '</llms.txt>; rel="llms-txt"',
  '</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"',
  '</.well-known/oauth-authorization-server>; rel="oauth-authorization-server"',
];

function addLinkHeaders(headers) {
  for (const link of LINK_HEADERS) {
    headers.append("Link", link);
  }
}

function addSecurityHeaders(headers) {
  headers.set("WWW-Authenticate", 'Bearer resource_metadata="https://milkyway.center/.well-known/oauth-protected-resource"');
}

function wantsMarkdown(request) {
  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/markdown")) return false;
  if (!accept.includes("text/html")) return true;
  const mdQ = parseQuality(accept, "text/markdown");
  const htmlQ = parseQuality(accept, "text/html");
  return mdQ >= htmlQ;
}

function parseQuality(accept, mediaType) {
  const re = new RegExp(mediaType.replace("/", "\\/") + "\\s*(?:;\\s*q\\s*=\\s*([\\d.]+))?");
  const m = accept.match(re);
  if (!m) return 0;
  return m[1] !== undefined ? parseFloat(m[1]) : 1.0;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/robots.txt") {
      return new Response(`User-agent: *
Allow: /
Allow: /.well-known/
Sitemap: https://milkyway.center/sitemap.xml
Content-Signal: ai-train=no, search=yes, ai-input=yes

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bytespider
Allow: /

User-agent: CCBot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: meta-externalagent
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Bingbot
Allow: /
`, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
      });
    }

    if (request.method === "OPTIONS" && (url.pathname.startsWith("/.well-known/") || url.pathname === "/agent/register" || url.pathname === "/auth.md")) {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === "/agent/register" && request.method === "POST") {
      return new Response(JSON.stringify({
        credential_type: "public",
        access: "anonymous",
        token: "public-access",
        scopes: ["public"],
        message: "This is a public informational website. No authentication is required."
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/agent/register" && request.method === "GET") {
      return new Response(JSON.stringify({
        registration_endpoint: "https://milkyway.center/agent/register",
        method: "POST",
        identity_types_supported: ["anonymous"],
        credential_types_supported: ["public"],
        authentication_required: false,
        description: "Public site. POST to register as an anonymous agent."
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      if (wantsMarkdown(request)) {
        const mdResponse = await env.ASSETS.fetch(new Request(new URL("/index.md", url.origin)));
        if (mdResponse.ok) {
          const headers = new Headers(mdResponse.headers);
          headers.set("content-type", "text/markdown; charset=utf-8");
          addLinkHeaders(headers);
          addSecurityHeaders(headers);
          return new Response(mdResponse.body, { status: 200, headers });
        }
      }
      const htmlResponse = await env.ASSETS.fetch(new Request(new URL("/index.html", url.origin)));
      const headers = new Headers(htmlResponse.headers);
      headers.set("content-type", "text/html; charset=utf-8");
      addLinkHeaders(headers);
      addSecurityHeaders(headers);
      return new Response(htmlResponse.body, { status: 200, headers });
    }

    if (url.pathname === "/.well-known/api-catalog") {
      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      headers.set("content-type", "application/linkset+json; charset=utf-8");
      headers.set("Access-Control-Allow-Origin", "*");
      addLinkHeaders(headers);
      addSecurityHeaders(headers);
      return new Response(response.body, { status: response.status, headers });
    }

    if (WELL_KNOWN_JSON[url.pathname]) {
      const headers = new Headers();
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "public, max-age=3600");
      headers.set("Access-Control-Allow-Origin", "*");
      addLinkHeaders(headers);
      addSecurityHeaders(headers);
      return new Response(WELL_KNOWN_JSON[url.pathname], { status: 200, headers });
    }

    if (url.pathname === "/auth.md") {
      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("Access-Control-Allow-Origin", "*");
      addSecurityHeaders(headers);
      return new Response(response.body, { status: response.status, headers });
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    addLinkHeaders(headers);
    addSecurityHeaders(headers);
    return new Response(response.body, { status: response.status, headers });
  },
};
