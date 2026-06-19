import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import * as applicationsApi from "./api/applications";
import { handleGraphQL } from "./api/graphql";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function handleApiRoute(pathname: string, request: Request): Promise<Response | null> {
  if (pathname === "/graphql") {
    if (request.method !== "POST") return errorResponse("Method not allowed", 405);
    try {
      const body = await request.text();
      const result = await handleGraphQL(body);
      return jsonResponse(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid request";
      return errorResponse(message, 400);
    }
  }

  if (!pathname.startsWith("/applications")) return null;

  const url = new URL(request.url);
  const segments = pathname.replace("/applications", "").replace(/^\/|\/$/g, "").split("/").filter(Boolean);
  const id = segments[0] ?? null;

  if (segments.length > 1) return errorResponse("Not found", 404);

  try {
    switch (request.method) {
      case "GET":
        if (id) {
          const app = await applicationsApi.getById(id);
          return jsonResponse(app);
        }
        const result = await applicationsApi.list(url.searchParams);
        return jsonResponse(result);

      case "POST":
        if (id) return errorResponse("Method not allowed", 405);
        const body = await request.json();
        const created = await applicationsApi.create(body);
        return jsonResponse(created, 201);

      case "PATCH":
        if (!id) return errorResponse("ID is required", 400);
        const patchBody = await request.json();
        const updated = await applicationsApi.update(id, patchBody);
        return jsonResponse(updated);

      case "DELETE":
        if (!id) return errorResponse("ID is required", 400);
        await applicationsApi.remove(id);
        return jsonResponse({ success: true }, 200);

      default:
        return errorResponse("Method not allowed", 405);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[API Error]", message);
    return errorResponse(message, 500);
  }
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    const apiResponse = await handleApiRoute(url.pathname, request);
    if (apiResponse) return apiResponse;

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
