// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "petugas";
  jabatan?: string;
  bagian?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Master ──────────────────────────────────────────────────────────────────
export interface Yard {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  blocks?: Block[];
}

export interface Block {
  id: number;
  yard_id: number;
  block_code: string;
  max_length: number;
  max_width: number;
  max_height: number;
  is_active: boolean;
  yard?: Yard;
}

export interface ContainerSize {
  id: number;
  code: string;
  description: string;
  is_active: boolean;
}

export interface ContainerType {
  id: number;
  code: string;
  description: string;
  is_active: boolean;
}

export interface CargoStatus {
  id: number;
  code: string;
  description: string;
  is_active: boolean;
}

export interface FreightForwarder {
  id: number;
  name: string;
  email?: string;
  address?: string;
  contact_person?: string;
  contact_number?: string;
  is_active: boolean;
}

export interface Tax {
  id: number;
  name: string;
  percentage: number;
  type: "ADD" | "DEDUCT";
  is_active: boolean;
}

// ─── Tariff ──────────────────────────────────────────────────────────────────
export interface TariffLolo {
  id: number;
  yard_id: number;
  container_size_id: number;
  container_type_id: number;
  cargo_status_id: number;
  price_lift_off: number;
  price_lift_on: number;
  effective_date: string;
  is_active: boolean;
  yard?: Yard;
  container_size?: ContainerSize;
  container_type?: ContainerType;
  cargo_status?: CargoStatus;
}

export interface TariffStorage {
  id: number;
  yard_id: number;
  container_size_id: number;
  container_type_id: number;
  cargo_status_id: number;
  price_per_day: number;
  effective_date: string;
  is_active: boolean;
  yard?: Yard;
  container_size?: ContainerSize;
  container_type?: ContainerType;
  cargo_status?: CargoStatus;
}

// ─── Operational ─────────────────────────────────────────────────────────────
export interface Registration {
  id: number;
  freight_forwarder_id: number;
  container_number: string;
  container_size_id: number;
  container_type_id: number;
  cargo_status_id: number;
  no_do_jo?: string;
  shipper_tenant?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  operator_name?: string;
  status: "OPEN" | "CLOSED";
  is_active: boolean;
  created_at: string;
  closed_at?: string;
  freight_forwarder?: FreightForwarder;
  container_size?: ContainerSize;
  container_type?: ContainerType;
  cargo_status?: CargoStatus;
  last_lolo_type?: "LIFT_ON" | "LIFT_OFF";
  current_yard?: Yard;
  current_block?: Block;
}

export interface LoloRecord {
  id: number;
  registration_id: number;
  cargo_status_id: number;
  operation_type: "LIFT_ON" | "LIFT_OFF";
  vehicle_type?: string;
  vehicle_number?: string;
  operator_name?: string;
  lolo_at: string;
  yard_id?: number;
  block_id?: number;
  pos_length?: number;
  pos_width?: number;
  pos_height?: number;
  moved_at?: string;
  note?: string;
  cargo_status?: CargoStatus;
  yard?: Yard;
  block?: Block;
  created_at: string;
}

export interface StorageRecord {
  id: number;
  registration_id: number;
  cargo_status_id: number;
  yard_id: number;
  block_id: number;
  pos_length: number;
  pos_width: number;
  pos_height: number;
  moved_at: string;
  start_date: string;
  note?: string;
  cargo_status?: CargoStatus;
  yard?: Yard;
  block?: Block;
  created_at: string;
}

export interface RegistrationRemark {
  id: number;
  registration_id: number;
  remark: string;
  created_by?: string;
  created_at: string;
}

// ─── Invoice ─────────────────────────────────────────────────────────────────
export interface Invoice {
  id: number;
  invoice_number: string;
  freight_forwarder_id: number;
  invoice_date: string;
  status: "DRAFT" | "PAID";
  is_active: boolean;
  bank_name?: string;
  swift_code?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  signatory_name?: string;
  signatory_position?: string;
  total_amount?: number;
  paid_at?: string;
  created_at: string;
  freight_forwarder?: FreightForwarder;
  registrations?: Registration[];
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}
