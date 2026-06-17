const LINK_HEADERS = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"',
  '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
];

function addLinkHeaders(headers) {
  for (const link of LINK_HEADERS) {
    headers.append("Link", link);
  }
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" && wantsMarkdown(request)) {
      const mdUrl = new URL("/index.md", url.origin);
      const mdResponse = await env.ASSETS.fetch(new Request(mdUrl, request));
      if (mdResponse.ok) {
        const headers = new Headers(mdResponse.headers);
        headers.set("content-type", "text/markdown; charset=utf-8");
        addLinkHeaders(headers);
        return new Response(mdResponse.body, {
          status: mdResponse.status,
          headers,
        });
      }
    }

    const response = await env.ASSETS.fetch(request);
    const newHeaders = new Headers(response.headers);
    addLinkHeaders(newHeaders);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
