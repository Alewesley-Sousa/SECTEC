import { apiRequest } from "../../../lib/api";

export type Area = {
  id: string | number;
  nome: string;
  descricao?: string;
};

export type CreateAreaDTO = {
  nome: string;
  descricao?: string;
};

export async function getAreas(): Promise<Area[]> {
  return apiRequest<Area[]>("/areas");
}

export async function createArea(data: CreateAreaDTO): Promise<Area> {
  return apiRequest<Area>("/areas", { method: "POST", body: data });
}

export async function updateArea(id: string | number, data: CreateAreaDTO): Promise<Area> {
  return apiRequest<Area>(`/areas/${id}`, { method: "PATCH", body: data });
}

export async function deleteArea(id: string | number): Promise<void> {
  return apiRequest<void>(`/areas/${id}`, { method: "DELETE" });
}