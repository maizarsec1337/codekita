import { categoryInputSchema, profileInputSchema, type AdminStatistics, type AdminUser, type CategoryDto, type CategoryInput, type LabDto, type ProfileDto, type ProfileInput, type UserUpdate } from "@codekita/shared";
import { request } from "./api";
export const managementApi = {
  categories: () => request<CategoryDto[]>("/categories"),
  adminCategories: () => request<CategoryDto[]>("/admin/categories"),
  category: (input: CategoryInput, id?: string) => request<CategoryDto>(id ? `/admin/categories/${id}` : "/admin/categories", { method: id ? "PATCH" : "POST", body: JSON.stringify(categoryInputSchema.parse(input)) }),
  archiveCategory: (id: string) => request(`/admin/categories/${id}`, { method: "DELETE" }),
  profile: () => request<ProfileDto>("/profile"),
  saveProfile: (input: ProfileInput) => request<ProfileDto>("/profile", { method: "PATCH", body: JSON.stringify(profileInputSchema.parse(input)) }),
  users: (page: number) => request<{ users: AdminUser[]; total: number; page: number }>(`/admin/users?page=${page}`),
  user: (id: string, input: UserUpdate) => request(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  statistics: () => request<AdminStatistics>("/admin/statistics"),
  archivePath: (id: string) => request(`/admin/paths/${id}`, { method: "DELETE" }),
  labs: () => request<{ execution: { available: boolean; reason: string }; labs: LabDto[] }>("/labs"),
  labDraft: (id: string) => request<{ code: string; language: string; updatedAt: string } | null>(`/labs/${encodeURIComponent(id)}/draft`),
  saveLabDraft: (id: string, code: string, language: string) => request(`/labs/${encodeURIComponent(id)}/draft`, { method: "PATCH", body: JSON.stringify({ code, language }) }),
};