import api from "./axios";
import type {
  AuthResponse, User, Yard, Block, ContainerSize, ContainerType,
  CargoStatus, FreightForwarder, Tax, TariffLolo, TariffStorage,
  Registration, LoloRecord, StorageRecord, RegistrationRemark, Invoice, Package,
  Warehouse, WarehouseChamber, WarehouseTariff, WarehouseRegistration,
  WarehouseRegistrationRemark, WarehouseBeritaAcara, WarehouseInvoice
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

export const packagesApi = {
  getAll: () => api.get<{ data: Package[] }>("/master/package"),
  getById: (id: number) => api.get<{ data: Package }>(`/master/package/${id}`),
  create: (data: Partial<Package>) => api.post<{ data: Package }>("/master/package", data),
  update: (id: number, data: Partial<Package>) => api.put<{ data: Package }>(`/master/package/${id}`, data),
  deactivate: (id: number) => api.delete(`/master/package/${id}`),
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
  close: (id: number, data: { remark: string }) =>
    api.post(`/registrations/${id}/close`, data),
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
  create: (data: Partial<Invoice> & { registration_ids: number[], tax_ids?: number[] }) =>
    api.post<{ data: Invoice }>("/invoices", data),
  update: (id: number, data: Partial<Invoice>) =>
    api.put<{ data: Invoice }>(`/invoices/${id}`, data),
  pay: (id: number) => api.get(`/invoices/${id}/pay`),
  deactivate: (id: number) => api.delete(`/invoices/${id}`),
  getInvoiceableRegistrations: (ffId: number) =>
    api.get<{ data: { freight_forwarder: FreightForwarder, registrations: Registration[] } }>(`/freight-forwarders/${ffId}/registrations/invoiceable`),
  getPdfUrl: (id: number) =>
    `${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}/pdf`,
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface YardMapBlock {
  id: number;
  block_code: string;
  max_length: number;
  max_width: number;
  max_height: number;
  capacity: number;
  is_active: boolean;
  occupied_count: number;
  is_highlighted: boolean;
  registrations: {
    id: number;
    container_number: string;
    no_do_jo?: string;
    shipper_tenant?: string;
    freight_forwarder?: { id: number; name: string };
    size?: { id: number; code: string; description: string };
    type?: { id: number; code: string; description: string };
    pos_length: number;
    pos_width: number;
    pos_height: number;
    start_date: string;
  }[];
}

export interface YardMapYard {
  id: number;
  name: string;
  code: string;
  total_blocks: number;
  total_capacity: number;
  total_occupied: number;
  blocks: YardMapBlock[];
}

export const dashboardApi = {
  getYardMap: (container_number?: string) =>
    api.get<{ data: YardMapYard[] }>("/dashboard/yard-map", {
      params: container_number ? { container_number } : undefined,
    }),
  getWarehouseMap: () =>
    api.get<{ data: any[] }>("/dashboard/warehouse-map"),
};

// ─── Warehouse Master ────────────────────────────────────────────────────────
export const warehousesApi = {
  getAll: () => api.get<{ data: Warehouse[] }>("/master/warehouses"),
  getById: (id: number) => api.get<{ data: Warehouse }>(`/master/warehouses/${id}`),
  create: (data: Partial<Warehouse>) => api.post<{ data: Warehouse }>("/master/warehouses", data),
  update: (id: number, data: Partial<Warehouse>) => api.put<{ data: Warehouse }>(`/master/warehouses/${id}`, data),
  deactivate: (id: number) => api.delete(`/master/warehouses/${id}`),
};

export const warehouseChambersApi = {
  getAll: () => api.get<{ data: WarehouseChamber[] }>("/master/warehouse-chambers"),
  getById: (id: number) => api.get<{ data: WarehouseChamber }>(`/master/warehouse-chambers/${id}`),
  create: (data: Partial<WarehouseChamber>) => api.post<{ data: WarehouseChamber }>("/master/warehouse-chambers", data),
  update: (id: number, data: Partial<WarehouseChamber>) => api.put<{ data: WarehouseChamber }>(`/master/warehouse-chambers/${id}`, data),
  deactivate: (id: number) => api.delete(`/master/warehouse-chambers/${id}`),
};

// ─── Warehouse Tariff ────────────────────────────────────────────────────────
export const warehouseTariffsApi = {
  getAll: () => api.get<{ data: WarehouseTariff[] }>("/tariffs/warehouse"),
  getById: (id: number) => api.get<{ data: WarehouseTariff }>(`/tariffs/warehouse/${id}`),
  create: (data: Partial<WarehouseTariff>) => api.post<{ data: WarehouseTariff }>("/tariffs/warehouse", data),
  update: (id: number, data: Partial<WarehouseTariff>) => api.put<{ data: WarehouseTariff }>(`/tariffs/warehouse/${id}`, data),
  deactivate: (id: number) => api.delete(`/tariffs/warehouse/${id}`),
  getActive: (warehouseId: number, date: string) =>
    api.post<{ data: WarehouseTariff }>("/tariffs/warehouse/active", { warehouse_id: warehouseId, date }),
};

// ─── Warehouse Registration (Rent) ───────────────────────────────────────────
export const warehouseRegistrationsApi = {
  getAll: (params?: { date_from?: string; date_to?: string }) =>
    api.get<{ data: WarehouseRegistration[] }>("/warehouse-registrations", { params }),
  getActive: () => api.get<{ data: WarehouseRegistration[] }>("/warehouse-registrations/active"),
  getClosed: (params?: { date_from?: string; date_to?: string }) =>
    api.get<{ data: WarehouseRegistration[] }>("/warehouse-registrations/closed", { params }),
  getNotInvoiced: () => api.get<{ data: WarehouseRegistration[] }>("/warehouse-registrations/not-invoiced"),
  getById: (id: number) => api.get<{ data: WarehouseRegistration }>(`/warehouse-registrations/${id}`),
  create: (data: Partial<WarehouseRegistration>) =>
    api.post<{ data: WarehouseRegistration }>("/warehouse-registrations", data),
  update: (id: number, data: Partial<WarehouseRegistration>) =>
    api.put<{ data: WarehouseRegistration }>(`/warehouse-registrations/${id}`, data),
  close: (id: number, data: { rent_end: string; remark?: string }) =>
    api.post<{ data: WarehouseRegistration }>(`/warehouse-registrations/${id}/close`, data),
  getRemarks: (id: number) =>
    api.get<{ data: WarehouseRegistrationRemark[] }>(`/warehouse-registrations/${id}/remarks`),
  addRemark: (id: number, remark: string) =>
    api.post<{ data: WarehouseRegistrationRemark }>(`/warehouse-registrations/${id}/remarks`, { remark }),
  getAvailableChambers: (params: { warehouse_id: number; rent_start: string; rent_end: string }) =>
    api.get<{ data: WarehouseChamber[] }>("/warehouses/available-chambers", { params }),
  deactivate: (id: number) => api.delete(`/warehouse-registrations/${id}`),
};

// ─── Warehouse Berita Acara ──────────────────────────────────────────────────
export const warehouseBeritaAcarasApi = {
  getAll: (params?: { date_from?: string; date_to?: string; warehouse_id?: number }) =>
    api.get<{ data: WarehouseBeritaAcara[] }>("/warehouse-berita-acaras", { params }),
  getById: (id: number) => api.get<{ data: WarehouseBeritaAcara }>(`/warehouse-berita-acaras/${id}`),
  create: (data: any) => api.post<{ data: WarehouseBeritaAcara }>("/warehouse-berita-acaras", data),
  update: (id: number, data: any) => api.put<{ data: WarehouseBeritaAcara }>(`/warehouse-berita-acaras/${id}`, data),
  deactivate: (id: number) => api.delete(`/warehouse-berita-acaras/${id}`),
  addFee: (baId: number, data: { fee_name: string; fee_amount: number; note?: string }) =>
    api.post(`/warehouse-berita-acaras/${baId}/additional-fees`, data),
  removeFee: (baId: number, feeId: number) =>
    api.delete(`/warehouse-berita-acaras/${baId}/additional-fees/${feeId}`),
  getInvoiceableRegistrations: (ffId: number) =>
    api.get<{ data: WarehouseRegistration[] }>(`/freight-forwarders/${ffId}/warehouse-registrations/invoiceable-ba`),
  getPdfUrl: (id: number) =>
    `${process.env.NEXT_PUBLIC_API_URL}/warehouse-berita-acaras/${id}/pdf`,
};

// ─── Warehouse Invoices ──────────────────────────────────────────────────────
export const warehouseInvoicesApi = {
  getAll: (params?: { date_from?: string; date_to?: string; status?: string }) =>
    api.get<{ data: WarehouseInvoice[] }>("/warehouse-invoices", { params }),
  getById: (id: number) => api.get<{ data: WarehouseInvoice }>(`/warehouse-invoices/${id}`),
  create: (data: any) => api.post<{ data: WarehouseInvoice }>("/warehouse-invoices", data),
  pay: (id: number) => api.get(`/warehouse-invoices/${id}/pay`),
  deactivate: (id: number) => api.delete(`/warehouse-invoices/${id}`),
  getInvoiceableBas: (ffId: number) =>
    api.get<{ data: WarehouseBeritaAcara[] }>(`/freight-forwarders/${ffId}/warehouse-berita-acaras/invoiceable`),
  getPdfUrl: (id: number) =>
    `${process.env.NEXT_PUBLIC_API_URL}/warehouse-invoices/${id}/pdf`,
};

