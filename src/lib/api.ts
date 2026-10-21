/** Browser-side API client. All calls go to this origin's /api, which proxies to Fastify. */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export function toQuery(params: Query) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function api<T>(path: string, init: RequestInit & { query?: Query } = {}): Promise<T> {
  const { query, headers, body, ...rest } = init;
  const isJson = body !== undefined && !(body instanceof FormData) && typeof body !== "string";
  const res = await fetch(`/api${path}${query ? toQuery(query) : ""}`, {
    credentials: "same-origin",
    ...rest,
    headers: { ...(isJson ? { "content-type": "application/json" } : {}), ...headers },
    body: isJson ? JSON.stringify(body) : (body as BodyInit | undefined),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`, data?.error);
  }
  return data as T;
}

/** JSON helpers that accept plain objects as body. */
export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: "POST", body: body as BodyInit });
export const patch = <T>(path: string, body?: unknown) => api<T>(path, { method: "PATCH", body: body as BodyInit });
export const del = <T>(path: string) => api<T>(path, { method: "DELETE" });

/** Upload with progress (fetch has no upload progress events). */
export function upload<T>(path: string, form: FormData, onProgress?: (fraction: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api${path}`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      let data: { message?: string; error?: string } | null = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as unknown as T);
      else if (xhr.status === 413) reject(new ApiError(413, "Photos are too large — remove one or two and try again"));
      else reject(new ApiError(xhr.status, data?.message ?? `Upload failed (${xhr.status})`, data?.error));
    };
    xhr.onerror = () => reject(new ApiError(0, "Network error — check your connection and try again"));
    xhr.send(form);
  });
}
