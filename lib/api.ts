import api from "./axios";
import type {
  AuthResponse, User, Yard, Block, ContainerSize, ContainerType,
  CargoStatus, FreightForwarder, Tax, TariffLolo, TariffStorage,
  Registration, LoloRecord, StorageRecord, RegistrationRemark, Invoice,
} from "@/types";

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/login", { email, password }),
  logout: () => api.post("/logout"),
  me: () => api.get<{ data: User }>("/me"),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: () => api.get<{ data: User[] }>("/users"),
  getById: (id: number) => api.get<{ data: User }>(`/users/${id}`),
  create: (data: Partial<User> & { password: string; password_confirmation: string }) =>
    api.post<{ data: User }>("/users", data),
  update: (id: number, data: Partial<User>) =>
    api.put<{ data: User }>(`/users/${id}`, data),
  deactivate: (id: number) => api.delete(`/users/${id}`),
  resetPassword: (id: number, password: string, password_confirmation: string) =>
    api.post(`/users/${id}/reset-password`, { password, password_confirmation }),
};

// ─── Master ───────────────────────────────────────────────────────────────────
export const yardsApi = {
  getAll: () => api.get<{ data: Yard[] }>("/master/yards"),
  getById: (id: number) => api.get<{ data: Yard }>(`/master/yards/${id}`),
  create: (data: Partial<Yard>) => api.post<{ data: Yard }>("/master/yards", data),
  update: (id: number, data: Partial<Yard>) => api.put<{ data: Yard }>(`/master/yards/${id}`, data),
  deactivate: (id: number) => api.delete(`/master/yards/${id}`),
};

export const blocksApi = {
  getAll: () => api.get<{ data: Block[] }>("/master/blocks"),
  getById: (id: number) => api.get<{ data: Block }>(`/master/blocks/${id}`),
  create: (data: Partial<Block>) => api.post<{ data: Block }>("/master/blocks", data),
  update: (id: number, data: Partial<Block>) => api.put<{ data: Block }>(`/master/blocks/${id}`, data),
  deactivate: (id: number) => api.delete(`/master/blocks/${id}`),
};

export const containerSizesApi = {
  getAll: () => api.get<{ data: ContainerSize[] }>("/master/container-sizes"),
  create: (data: Partial<ContainerSize>) => api.post<{ data: ContainerSize }>("/master/container-sizes", data),
  update: (id: number, data: Partial<ContainerSize>) => api.put<{ data: ContainerSize }>(`/master/container-sizes/${id}`, data),
  deactivate: (id: number) => api.delete(`/master/container-sizes/${id}`),
};

export const containerTypesApi = {
  getAll: () => api.get<{ data: ContainerType[] }>("/master/container-types"),
  create: (data: Partial<ContainerType>) => api.post<{ data: ContainerType }>("/master/container-types", data),
  update: (id: number, data: Partial<ContainerType>) => api.put<{ data: ContainerType }>(`/master/container-types/${id}`, data),
  deactivate: (id: number) => api.delete(`/master/container-types/${id}`),
};

export const cargoStatusesApi = {
  getAll: () => api.get<{ data: CargoStatus[] }>("/master/cargo-statuses"),
  create: (data: Partial<CargoStatus>) => api.post<{ data: CargoStatus }>("/master/cargo-statuses", data),
  update: (id: number, data: Partial<CargoStatus>) => api.put<{ data: CargoStatus }>(`/master/cargo-statuses/${id}`, data),
  deactivate: (id: number) => api.delete(`/master/cargo-statuses/${id}`),
};

export const freightForwardersApi = {
  getAll: () => api.get<{ data: FreightForwarder[] }>("/master/freight-forwarders"),
  getById: (id: number) => api.get<{ data: FreightForwarder }>(`/master/freight-forwarders/${id}`),
  create: (data: Partial<FreightForwarder>) => api.post<{ data: FreightForwarder }>("/master/freight-forwarders", data),
  update: (id: number, data: Partial<FreightForwarder>) => api.put<{ data: FreightForwarder }>(`/master/freight-forwarders/${id}`, data),
  deactivate: (id: number) => api.delete(`/master/freight-forwarders/${id}`),
};

export const taxesApi = {
  getAll: () => api.get<{ data: Tax[] }>("/master/taxes"),
  create: (data: Partial<Tax>) => api.post<{ data: Tax }>("/master/taxes", data),
  update: (id: number, data: Partial<Tax>) => api.put<{ data: Tax }>(`/master/taxes/${id}`, data),
  deactivate: (id: number) => api.delete(`/master/taxes/${id}`),
};

// ─── Tariffs ─────────────────────────────────────────────────────────────────
export const tariffLoloApi = {
  getAll: () => api.get<{ data: TariffLolo[] }>("/tariffs/lolo"),
  getById: (id: number) => api.get<{ data: TariffLolo }>(`/tariffs/lolo/${id}`),
  create: (data: Partial<TariffLolo>) => api.post<{ data: TariffLolo }>("/tariffs/lolo", data),
  update: (id: number, data: Partial<TariffLolo>) => api.put<{ data: TariffLolo }>(`/tariffs/lolo/${id}`, data),
  deactivate: (id: number) => api.delete(`/tariffs/lolo/${id}`),
};

export const tariffStorageApi = {
  getAll: () => api.get<{ data: TariffStorage[] }>("/tariffs/storage"),
  getById: (id: number) => api.get<{ data: TariffStorage }>(`/tariffs/storage/${id}`),
  create: (data: Partial<TariffStorage>) => api.post<{ data: TariffStorage }>("/tariffs/storage", data),
  update: (id: number, data: Partial<TariffStorage>) => api.put<{ data: TariffStorage }>(`/tariffs/storage/${id}`, data),
  deactivate: (id: number) => api.delete(`/tariffs/storage/${id}`),
};

// ─── Registrations ───────────────────────────────────────────────────────────
export const registrationsApi = {
  getAll: (params?: { date_from?: string; date_to?: string }) =>
    api.get<{ data: Registration[] }>("/registrations", { params }),
  getOpen: () => api.get<{ data: Registration[] }>("/registrations/open"),
  getClosed: (params?: { date_from?: string; date_to?: string }) =>
    api.get<{ data: Registration[] }>("/registrations/closed", { params }),
  getNotInvoiced: () => api.get<{ data: Registration[] }>("/registrations/not-invoiced"),
  getById: (id: number) => api.get<{ data: Registration }>(`/registrations/${id}`),
  create: (data: Partial<Registration> & { lolo_at?: string; yard_id?: number; block_id?: number; pos_length?: number; pos_width?: number; pos_height?: number; moved_at?: string; remark?: string }) =>
    api.post<{ data: Registration }>("/registrations", data),
  update: (id: number, data: Partial<Registration>) =>
    api.put<{ data: Registration }>(`/registrations/${id}`, data),
  deactivate: (id: number) => api.delete(`/registrations/${id}`),
  close: (id: number, remark?: string) =>
    api.post(`/registrations/${id}/close`, { remark }),
};

// ─── Lolo Records ────────────────────────────────────────────────────────────
export const loloRecordsApi = {
  getByRegistration: (registrationId: number) =>
    api.get<{ data: LoloRecord[] }>(`/registrations/${registrationId}/lolo-records`),
  create: (registrationId: number, data: Partial<LoloRecord>) =>
    api.post<{ data: LoloRecord }>(`/registrations/${registrationId}/lolo-records`, data),
  update: (id: number, data: Partial<LoloRecord>) =>
    api.put<{ data: LoloRecord }>(`/lolo-records/${id}`, data),
};

// ─── Storage Records ─────────────────────────────────────────────────────────
export const storageRecordsApi = {
  getByRegistration: (registrationId: number) =>
    api.get<{ data: StorageRecord[] }>(`/registrations/${registrationId}/storage-records`),
  create: (registrationId: number, data: Partial<StorageRecord>) =>
    api.post<{ data: StorageRecord }>(`/registrations/${registrationId}/storage-records`, data),
  update: (id: number, data: Partial<StorageRecord>) =>
    api.put<{ data: StorageRecord }>(`/storage-records/${id}`, data),
};

// ─── Remarks ─────────────────────────────────────────────────────────────────
export const remarksApi = {
  getByRegistration: (registrationId: number) =>
    api.get<{ data: RegistrationRemark[] }>(`/registrations/${registrationId}/remarks`),
  create: (registrationId: number, remark: string) =>
    api.post<{ data: RegistrationRemark }>(`/registrations/${registrationId}/remarks`, { remark }),
};

// ─── Invoices ────────────────────────────────────────────────────────────────
export const invoicesApi = {
  getAll: (params?: { date_from?: string; date_to?: string; status?: string }) =>
    api.get<{ data: Invoice[] }>("/invoices", { params }),
  getById: (id: number) => api.get<{ data: Invoice }>(`/invoices/${id}`),
  create: (data: Partial<Invoice> & { registration_ids: number[] }) =>
    api.post<{ data: Invoice }>("/invoices", data),
  update: (id: number, data: Partial<Invoice>) =>
    api.put<{ data: Invoice }>(`/invoices/${id}`, data),
  pay: (id: number) => api.get(`/invoices/${id}/pay`),
  deactivate: (id: number) => api.delete(`/invoices/${id}`),
  getInvoiceableRegistrations: (ffId: number) =>
    api.get<{ data: Registration[] }>(`/freight-forwarders/${ffId}/registrations/invoiceable`),
  getPdfUrl: (id: number) =>
    `${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}/pdf`,
};
