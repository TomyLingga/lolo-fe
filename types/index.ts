// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "operator" | "finance";
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
  value: number;
  value_type: "PERCENTAGE" | "NOMINAL";
  type: "ADD" | "DEDUCT";
  is_active: boolean;
}

export interface Package {
  id: number;
  name: string;
  code: string;
  free_time_days: number;
  is_active: boolean;
}

// ─── Tariff ──────────────────────────────────────────────────────────────────
export interface TariffLolo {
  id: number;
  yard_id: number;
  container_size_id: number;
  container_type_id: number;
  cargo_status_id: number;
  package_id: number;
  price_lift_off: number;
  price_lift_on: number;
  effective_date: string;
  is_active: boolean;
  yard?: Yard;
  container_size?: ContainerSize;
  container_type?: ContainerType;
  cargo_status?: CargoStatus;
  package?: Package;
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
  package_id: number;
  no_do_jo?: string;
  shipper_tenant_id?: number;
  vehicle_type?: string;
  vehicle_number?: string;
  operator_name?: string;
  record_status: "OPEN" | "CLOSED";
  is_active: boolean;
  created_at: string;
  closed_at?: string;
  freight_forwarder?: FreightForwarder;
  shipper_tenant?: FreightForwarder;
  container_size?: ContainerSize;
  container_type?: ContainerType;
  size?: ContainerSize; // Alias to match backend relation
  type?: ContainerType; // Alias to match backend relation
  cargo_status?: CargoStatus;
  package?: Package;
  last_lolo_type?: "LIFT_ON" | "LIFT_OFF";
  last_invoiced_at?: string;
  current_yard?: Yard;
  current_block?: Block;
  lolo_records?: LoloRecord[];
  storage_records?: StorageRecord[];
  registration_remarks?: RegistrationRemark[];
  created_by?: {
    id: number;
    name: string;
  };
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
  tariff_price?: string;
  registration?: Registration;
  created_by?: {
    id: number;
    name: string;
    jabatan?: string;
    bagian?: string;
  };
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
  end_date?: string;
  note?: string;
  cargo_status?: CargoStatus;
  yard?: Yard;
  block?: Block;
  created_at: string;
  storage_price_per_day?: string;
  moved_by?: {
    id: number;
    name: string;
    jabatan?: string;
    bagian?: string;
  };
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
  subtotal: number;
  grand_total: number;
  total_amount?: number; // legacy
  paid_at?: string;
  created_at: string;
  freight_forwarder?: FreightForwarder;
  invoice_registrations?: InvoiceRegistration[];
  taxes?: InvoiceTax[];
}

export interface InvoiceRegistration {
  id: number;
  invoice_id: number;
  registration_id: number;
  lolo_cost: number;
  storage_cost: number;
  subtotal: number;
  billed_from: string;
  registration?: Registration;
}

export interface InvoiceTax {
  id: number;
  name: string;
  type: "ADD" | "DEDUCT";
  value: number;
  value_type: "PERCENTAGE" | "NOMINAL";
  pivot?: {
    invoice_id: number;
    tax_id: number;
    tax_value: number;
    tax_value_type: "PERCENTAGE" | "NOMINAL";
    tax_type: "ADD" | "DEDUCT";
    calculated_amount: number;
  };
}

// ─── Warehouse ─────────────────────────────────────────────────────────────
export interface Warehouse {
  id: number;
  name: string;
  code: string;
  location?: string;
  total_area_m2?: number;
  description?: string;
  is_active: boolean;
  chambers?: WarehouseChamber[];
}

export interface WarehouseChamber {
  id: number;
  warehouse_id: number;
  code: string;
  name?: string;
  length_m?: number;
  width_m?: number;
  area_m2?: number;
  is_available?: boolean;
  is_active: boolean;
  warehouse?: Warehouse;
}

export interface WarehouseTariff {
  id: number;
  warehouse_id: number;
  price_per_m2: number;
  effective_date: string;
  is_active: boolean;
  warehouse?: Warehouse;
}

export interface WarehouseRegistration {
  id: number;
  freight_forwarder_id: number;
  chamber_id: number;
  tariff_per_m2: number;
  area_m2: number;
  rent_start: string;
  rent_end: string;
  record_status: "ACTIVE" | "CLOSED";
  invoiced: boolean;
  is_active: boolean;
  created_at: string;
  freight_forwarder?: FreightForwarder;
  chamber?: WarehouseChamber;
  subtotal: number;
  total_rent_days: number;
  total_rent_cost: number;
  remarks?: WarehouseRegistrationRemark[];
  remark?: string; // used for initial creation
}

export interface WarehouseRegistrationRemark {
  id: number;
  warehouse_registration_id: number;
  remark: string;
  created_at: string;
  created_by?: { id: number; name: string };
}

export interface WarehouseBeritaAcara {
  id: number;
  freight_forwarder_id: number;
  warehouse_id: number;
  ba_number: string;
  ba_date: string;
  subtotal: number;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  signer_smnt_name?: string;
  signer_smnt_position?: string;
  signer_ff_name?: string;
  signer_ff_position?: string;
  approver_ff_name?: string;
  approver_ff_position?: string;
  invoiced: boolean;
  is_active: boolean;
  created_at: string;
  freight_forwarder?: FreightForwarder;
  warehouse?: Warehouse;
  ba_registrations?: WarehouseBaRegistration[];
  additional_fees?: WarehouseBaAdditionalFee[];
}

export interface WarehouseBaRegistration {
  id: number;
  ba_id: number;
  warehouse_registration_id: number;
  area_m2: number;
  tariff_per_m2: number;
  months: number;
  subtotal: number;
  warehouse_registration?: WarehouseRegistration;
}

export interface WarehouseBaAdditionalFee {
  id: number;
  ba_id: number;
  fee_name: string;
  fee_amount: number;
  note?: string;
}

export interface WarehouseInvoice {
  id: number;
  invoice_number: string;
  freight_forwarder_id: number;
  warehouse_id: number;
  spk_name?: string;
  spk_number?: string;
  spk_date?: string;
  po_number?: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  grand_total: number;
  bank_name?: string;
  swift_code?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  signatory_name?: string;
  signatory_position?: string;
  status: "DRAFT" | "PAID";
  is_active: boolean;
  created_at: string;
  freight_forwarder?: FreightForwarder;
  warehouse?: Warehouse;
  invoice_bas?: WarehouseInvoiceBa[];
  taxes?: WarehouseInvoiceTax[];
}

export interface WarehouseInvoiceBa {
  id: number;
  warehouse_invoice_id: number;
  ba_id: number;
  ba?: WarehouseBeritaAcara;
}

export interface WarehouseInvoiceTax {
  id: number;
  warehouse_invoice_id: number;
  tax_id: number;
  tax_name: string;
  tax_value: number;
  tax_value_type: "PERCENTAGE" | "NOMINAL";
  tax_type: "ADD" | "DEDUCT";
  amount: number;
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
