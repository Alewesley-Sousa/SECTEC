const LOCAL_API_BASE = "https://sectec-ja.up.railway.app/api";
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

export function isTokenExpirado(token: string | null): boolean {
  if (!token) return true;
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));
    const agora = Math.floor(Date.now() / 1000);
    return payload.exp ? payload.exp < agora : false;
  } catch {
    return true;
  }
}

export type BackendRole = "aluno" | "orientador" | "coordenador" | "comissao" | "avaliador";

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
  turma?: string | null;
  ano?: number | string | null;
   areas?: { area: string };  
  temasSelecionados?: Array<{ id: string | number; nome?: string }>;
};

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function notifyAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("auth-change"));
}

function getToken() {
  return localStorage.getItem("token");
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
    let errorData: any;
    let message = "Não foi possível concluir a solicitação.";

    // ✅ Se não autorizado, encerra a sessão e redireciona
    if (response.status === 401) {
      clearSession();
      window.location.href = '/login';
      throw new ApiError('Sessão expirada. Faça login novamente.', response.status);
    }

    try {
      errorData = await response.json();
      if (typeof errorData?.message === "string") {
        message = errorData.message;
      } else if (Array.isArray(errorData?.message)) {
        message = errorData.message.join(" ");
      }
    } catch {
      // A resposta pode não ser JSON – errorData permanece undefined
    }

    throw new ApiError(message, response.status, errorData);
  }

  if (response.status === 204) return undefined as T;
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new ApiError(
      "Este endpoint não retornou JSON. Verifique se a rota existe no backend publicado.",
      response.status
    );
  }

  return response.json() as Promise<T>;
}

export async function adicionarIntegrantes(
  projetoId: string | number,
  alunosIds: number[]
): Promise<unknown> {
  return apiRequest(`/projetos/${projetoId}/integrantes`, {
    method: "POST",
    body: { alunosIds },
  });
}

export async function removerIntegrante(
  projetoId: string | number,
  alunoId: string | number
): Promise<unknown> {
  return apiRequest(`/projetos/${projetoId}/integrantes/${alunoId}`, {
    method: "DELETE",
  });
}

export async function sincronizarIntegrantes(
  projetoId: string | number,
  integrantesOriginaisIds: number[],
  integrantesNovosIds: number[]
): Promise<{ adicionados: number[]; removidos: number[]; erros: string[] }> {
  const originaisSet = new Set(integrantesOriginaisIds);
  const novosSet = new Set(integrantesNovosIds);
  const adicionados = integrantesNovosIds.filter((id) => !originaisSet.has(id));
  const removidos = integrantesOriginaisIds.filter((id) => !novosSet.has(id));
  const erros: string[] = [];

  if (adicionados.length > 0) {
    try {
      await adicionarIntegrantes(projetoId, adicionados);
    } catch (err) {
      erros.push(`Erro ao adicionar integrantes: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  }

  for (const alunoId of removidos) {
    try {
      await removerIntegrante(projetoId, alunoId);
    } catch (err) {
      erros.push(`Erro ao remover integrante #${alunoId}: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  }

  return { adicionados, removidos, erros };
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
    comissao: "/dashboard/comissao",
    avaliador: "/dashboard/avaliador",
  };

  return routes[role];
}
