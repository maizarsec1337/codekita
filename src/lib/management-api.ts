import { categoryInputSchema, profileInputSchema, type AdminStatistics, type AdminUser, type CategoryDto, type CategoryInput, type LabDto, type ProfileDto, type ProfileInput, type UserUpdate } from "@codekita/shared";
import { request } from "./api";
export const managementApi = {
  categories: () => request<CategoryDto[]>("/categories"),
  adminCategories: () => request<CategoryDto[]>("/admin/categories"),
  category: (input: CategoryInput, id?: string) => request<CategoryDto>(id ? `/admin/categories/${id}` : "/admin/categories", { method: id ? "PATCH" : "POST", body: JSON.stringify(categoryInputSchema.parse(input)) }),
  archiveCategory: (id: string) => request(`/admin/categories/${id}`, { method: "DELETE" }),
  profile: () => request<ProfileDto>("/profile"),
  history: (page: number) => request<{ items: { id: string; completedAt: string; lesson: { title: string }; enrollment: { course: { title: string } } }[]; total: number }>(`/learning/history?page=${page}`),
  saveProfile: (input: ProfileInput) => request<ProfileDto>("/profile", { method: "PATCH", body: JSON.stringify(profileInputSchema.parse(input)) }),
  users: (page: number, search = "", status = "all") => request<{ users: AdminUser[]; total: number; page: number }>(`/admin/users?${new URLSearchParams({ page: String(page), search, status })}`),
  certificates: (page: number, search: string, status: string) => request<{ items: AdminCertificate[]; total: number }>(`/admin/certificates?${new URLSearchParams({ page: String(page), search, status })}`),
  certificate: (id: string, revoked: boolean) => request(`/admin/certificates/${id}`, { method: "PATCH", body: JSON.stringify({ revoked }) }),
  activity: (page: number, search: string, status: string) => request<{ items: AdminActivity[]; total: number }>(`/admin/activity?${new URLSearchParams({ page: String(page), search, status })}`),
  settings: () => request<{ registrationEnabled: boolean }>("/admin/settings"),
  updateSettings: (registrationEnabled: boolean) => request<{ registrationEnabled: boolean }>("/admin/settings", { method: "PATCH", body: JSON.stringify({ registrationEnabled }) }),
  user: (id: string, input: UserUpdate) => request(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  statistics: () => request<AdminStatistics>("/admin/statistics"),
  archivePath: (id: string) => request(`/admin/paths/${id}`, { method: "DELETE" }),
  labs: () => request<{ execution: { available: boolean; reason: string }; labs: LabDto[] }>("/labs"),
  labDraft: (id: string) => request<{ code: string; language: string; updatedAt: string } | null>(`/labs/${encodeURIComponent(id)}/draft`),
  saveLabDraft: (id: string, code: string, language: string) => request(`/labs/${encodeURIComponent(id)}/draft`, { method: "PATCH", body: JSON.stringify({ code, language }) }),
};
export interface AdminCertificate { id: string; title: string; issuedAt: string; revokedAt: string | null; enrollment: { user: { email: string }; course: { title: string } } }
export interface AdminActivity { id: string; enrolledAt: string; user: { email: string }; course: { title: string }; totalLessons: number; completedLessons: number; certificate: { issuedAt: string; revokedAt: string | null } | null }