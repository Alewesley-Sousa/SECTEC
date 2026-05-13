const LOCAL_API_BASE = "http://localhost:3000/api";

function normalizeApiBaseUrl(rawUrl?: string) {
  const configuredUrl = rawUrl?.trim();

  if (!configuredUrl && import.meta.env.PROD) {
    throw new Error("VITE_API_URL não configurada no frontend.");
  }

  const baseUrl = (configuredUrl || LOCAL_API_BASE).replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
export const API_BASE = API_BASE_URL;

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export type BackendRole = "aluno" | "orientador" | "coordenador" | "comissao";

export type AuthUser = {
  id: string | number;
  email: string;
  nome: string;
};

export type LoginResponse = {
  access_token: string;
  role: BackendRole;
  user: AuthUser;
};

export type UsuarioApi = {
  id: string | number;
  nome: string;
  email_institucional?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function notifyAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("auth-change"));
}

function getToken() {
  return localStorage.getItem("token");
}

async function readError(response: Response) {
  try {
    const data = await response.json();
    if (typeof data?.message === "string") return data.message;
    if (Array.isArray(data?.message)) return data.message.join(" ");
  } catch {
    // Some backend errors may not be JSON.
  }

  return "Não foi possível concluir a solicitação.";
}

export async function apiRequest<T>(
  path: string,
  { body, auth = true, headers, ...options }: ApiRequestOptions = {}
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(await readError(response), response.status);
  }

  if (response.status === 204) return undefined as T;
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new ApiError("Este endpoint não retornou JSON. Verifique se a rota existe no backend publicado.", response.status);
  }

  return response.json() as Promise<T>;
}

export function saveSession(data: LoginResponse) {
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("role", data.role);
  localStorage.setItem("nome", data.user.nome);
  localStorage.setItem("userId", String(data.user.id));
  notifyAuthChange();
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("nome");
  localStorage.removeItem("userId");
  notifyAuthChange();
}

export function getRoleRedirect(role: BackendRole) {
  const routes: Record<BackendRole, string> = {
    aluno: "/dashboard/aluno",
    orientador: "/dashboard/orientador",
    coordenador: "/dashboard/coordenacao",
    comissao: "/dashboard/coordenacao",
  };

  return routes[role];
}
