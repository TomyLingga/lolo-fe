"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { tariffLoloApi, tariffStorageApi, warehousesApi, warehouseTariffsApi, yardsApi, containerSizesApi, containerTypesApi, cargoStatusesApi, packagesApi } from "@/lib/api";
import { formatDate, formatCurrency, getErrorMessage, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { TariffLolo, TariffStorage, WarehouseTariff, Yard, Warehouse, ContainerSize, ContainerType, CargoStatus, Package } from "@/types";

type TabType = "lolo" | "storage" | "warehouse";

export default function TariffsPage() {
  const [tab, setTab] = useState<TabType>("lolo");

  // Master data
  const [yards, setYards] = useState<Yard[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [sizes, setSizes] = useState<ContainerSize[]>([]);
  const [types, setTypes] = useState<ContainerType[]>([]);
  const [statuses, setStatuses] = useState<CargoStatus[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);

  // Lolo tariffs
  const [loloData, setLoloData] = useState<TariffLolo[]>([]);
  const [loloLoading, setLoloLoading] = useState(false);
  const [loloForm, setLoloForm] = useState({ yard_id: "", package_id: "", container_size_id: "", container_type_id: "", cargo_status_id: "", price_lift_off: "", price_lift_on: "", effective_date: "" });
  const [loloFormOpen, setLoloFormOpen] = useState(false);
  const [editLolo, setEditLolo] = useState<TariffLolo | null>(null);
  const [loloColFilters, setLoloColFilters] = useState({ yard: "", size: "", type: "", status: "", package: "" });
  const [storageColFilters, setStorageColFilters] = useState({ yard: "", size: "", type: "", status: "" });
  const [loloSaving, setLoloSaving] = useState(false);
  const [loloDeactivate, setLoloDeactivate] = useState<TariffLolo | null>(null);

  // Storage tariffs
  const [storageData, setStorageData] = useState<TariffStorage[]>([]);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageForm, setStorageForm] = useState({ yard_id: "", container_size_id: "", container_type_id: "", cargo_status_id: "", price_per_day: "", effective_date: "" });
  const [storageFormOpen, setStorageFormOpen] = useState(false);
  const [editStorage, setEditStorage] = useState<TariffStorage | null>(null);
  const [storageSaving, setStorageSaving] = useState(false);
  const [storageDeactivate, setStorageDeactivate] = useState<TariffStorage | null>(null);

  // Warehouse tariffs
  const [warehouseTariffData, setWarehouseTariffData] = useState<WarehouseTariff[]>([]);
  const [warehouseTariffLoading, setWarehouseTariffLoading] = useState(false);
  const [warehouseTariffForm, setWarehouseTariffForm] = useState({ warehouse_id: "", price_per_m2: "", effective_date: "" });
  const [warehouseTariffFormOpen, setWarehouseTariffFormOpen] = useState(false);
  const [editWarehouseTariff, setEditWarehouseTariff] = useState<WarehouseTariff | null>(null);
  const [warehouseTariffSaving, setWarehouseTariffSaving] = useState(false);
  const [warehouseTariffDeactivate, setWarehouseTariffDeactivate] = useState<WarehouseTariff | null>(null);
  const [warehouseColFilters, setWarehouseColFilters] = useState({ warehouse: "" });

  const [deactivateLoading, setDeactivateLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      yardsApi.getAll(),
      warehousesApi.getAll(),
      containerSizesApi.getAll(),
      containerTypesApi.getAll(),
      cargoStatusesApi.getAll(),
      packagesApi.getAll()
    ]).then(([y, w, s, t, c, p]) => {
      setYards(y.data.data);
      setWarehouses(w.data.data);
      setSizes(s.data.data);
      setTypes(t.data.data);
      setStatuses(c.data.data);
      setPackages(p.data.data);
    }).catch(() => {});
  }, []);

  const fetchLolo = useCallback(async () => {
    setLoloLoading(true);
    try { setLoloData((await tariffLoloApi.getAll()).data.data || []); }
    catch { toast.error("Gagal memuat tarif LOLO"); }
    finally { setLoloLoading(false); }
  }, []);

  const fetchStorage = useCallback(async () => {
    setStorageLoading(true);
    try { setStorageData((await tariffStorageApi.getAll()).data.data || []); }
    catch { toast.error("Gagal memuat tarif Storage"); }
    finally { setStorageLoading(false); }
  }, []);

  const fetchWarehouseTariff = useCallback(async () => {
    setWarehouseTariffLoading(true);
    try { setWarehouseTariffData((await warehouseTariffsApi.getAll()).data.data || []); }
    catch { toast.error("Gagal memuat tarif Warehouse"); }
    finally { setWarehouseTariffLoading(false); }
  }, []);

  // Guard: fetch only once even in StrictMode
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchLolo();
    fetchStorage();
    fetchWarehouseTariff();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openLoloForm(t?: TariffLolo) {
    setEditLolo(t || null);
    if (t) {
      setLoloForm({ yard_id: String(t.yard_id), package_id: String(t.package_id || ""), container_size_id: String(t.container_size_id), container_type_id: String(t.container_type_id), cargo_status_id: String(t.cargo_status_id), price_lift_off: String(t.price_lift_off), price_lift_on: String(t.price_lift_on), effective_date: t.effective_date?.slice(0, 10) || "" });
    } else {
      setLoloForm({ yard_id: "", package_id: "", container_size_id: "", container_type_id: "", cargo_status_id: "", price_lift_off: "", price_lift_on: "", effective_date: "" });
    }
    setLoloFormOpen(true);
  }

  function openStorageForm(t?: TariffStorage) {
    setEditStorage(t || null);
    if (t) {
      setStorageForm({ yard_id: String(t.yard_id), container_size_id: String(t.container_size_id), container_type_id: String(t.container_type_id), cargo_status_id: String(t.cargo_status_id), price_per_day: String(t.price_per_day), effective_date: t.effective_date?.slice(0, 10) || "" });
    } else {
      setStorageForm({ yard_id: "", container_size_id: "", container_type_id: "", cargo_status_id: "", price_per_day: "", effective_date: "" });
    }
    setStorageFormOpen(true);
  }

  function openWarehouseTariffForm(t?: WarehouseTariff) {
    setEditWarehouseTariff(t || null);
    if (t) {
      setWarehouseTariffForm({ warehouse_id: String(t.warehouse_id), price_per_m2: String(t.price_per_m2), effective_date: t.effective_date?.slice(0, 10) || "" });
    } else {
      setWarehouseTariffForm({ warehouse_id: "", price_per_m2: "", effective_date: "" });
    }
    setWarehouseTariffFormOpen(true);
  }

  async function saveLolo(e: React.FormEvent) {
    e.preventDefault(); setLoloSaving(true);
    try {
      const payload = { yard_id: Number(loloForm.yard_id), package_id: Number(loloForm.package_id), container_size_id: Number(loloForm.container_size_id), container_type_id: Number(loloForm.container_type_id), cargo_status_id: Number(loloForm.cargo_status_id), price_lift_off: Number(loloForm.price_lift_off), price_lift_on: Number(loloForm.price_lift_on), effective_date: loloForm.effective_date };
      if (editLolo) await tariffLoloApi.update(editLolo.id, payload);
      else await tariffLoloApi.create(payload);
      toast.success("Tarif LOLO disimpan"); setLoloFormOpen(false); fetchLolo();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoloSaving(false); }
  }

  async function saveStorage(e: React.FormEvent) {
    e.preventDefault(); setStorageSaving(true);
    try {
      const payload = { yard_id: Number(storageForm.yard_id), container_size_id: Number(storageForm.container_size_id), container_type_id: Number(storageForm.container_type_id), cargo_status_id: Number(storageForm.cargo_status_id), price_per_day: Number(storageForm.price_per_day), effective_date: storageForm.effective_date };
      if (editStorage) await tariffStorageApi.update(editStorage.id, payload);
      else await tariffStorageApi.create(payload);
      toast.success("Tarif Storage disimpan"); setStorageFormOpen(false); fetchStorage();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setStorageSaving(false); }
  }

  async function saveWarehouseTariff(e: React.FormEvent) {
    e.preventDefault(); setWarehouseTariffSaving(true);
    try {
      const payload = { warehouse_id: Number(warehouseTariffForm.warehouse_id), price_per_m2: Number(warehouseTariffForm.price_per_m2), effective_date: warehouseTariffForm.effective_date };
      if (editWarehouseTariff) await warehouseTariffsApi.update(editWarehouseTariff.id, payload);
      else await warehouseTariffsApi.create(payload);
      toast.success("Tarif Warehouse disimpan"); setWarehouseTariffFormOpen(false); fetchWarehouseTariff();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setWarehouseTariffSaving(false); }
  }

  async function deactivateLolo() {
    if (!loloDeactivate) return; setDeactivateLoading(true);
    try { await tariffLoloApi.deactivate(loloDeactivate.id); toast.success("Tarif dinonaktifkan"); setLoloDeactivate(null); fetchLolo(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeactivateLoading(false); }
  }

  async function deactivateStorage() {
    if (!storageDeactivate) return; setDeactivateLoading(true);
    try { await tariffStorageApi.deactivate(storageDeactivate.id); toast.success("Tarif dinonaktifkan"); setStorageDeactivate(null); fetchStorage(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeactivateLoading(false); }
  }

  async function deactivateWarehouseTariff() {
    if (!warehouseTariffDeactivate) return; setDeactivateLoading(true);
    try { await warehouseTariffsApi.deactivate(warehouseTariffDeactivate.id); toast.success("Tarif dinonaktifkan"); setWarehouseTariffDeactivate(null); fetchWarehouseTariff(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeactivateLoading(false); }
  }

  const MasterSelects = ({ form, setForm }: { form: Record<string, string>; setForm: (f: Record<string, string>) => void }) => (
    <>
      <div><label className="label">Yard <span className="text-red-400">*</span></label>
        <select className="input" required value={form.yard_id} onChange={e => setForm({ ...form, yard_id: e.target.value })}>
          <option value="">-- Pilih --</option>{yards.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select></div>
      <div><label className="label">Ukuran Container <span className="text-red-400">*</span></label>
        <select className="input" required value={form.container_size_id} onChange={e => setForm({ ...form, container_size_id: e.target.value })}>
          <option value="">-- Pilih --</option>{sizes.map(s => <option key={s.id} value={s.id}>{s.code} - {s.description}</option>)}
        </select></div>
      <div><label className="label">Tipe Container <span className="text-red-400">*</span></label>
        <select className="input" required value={form.container_type_id} onChange={e => setForm({ ...form, container_type_id: e.target.value })}>
          <option value="">-- Pilih --</option>{types.map(t => <option key={t.id} value={t.id}>{t.code} - {t.description}</option>)}
        </select></div>
      <div><label className="label">Status Kargo <span className="text-red-400">*</span></label>
        <select className="input" required value={form.cargo_status_id} onChange={e => setForm({ ...form, cargo_status_id: e.target.value })}>
          <option value="">-- Pilih --</option>{statuses.map(s => <option key={s.id} value={s.id}>{s.code} - {s.description}</option>)}
        </select></div>
    </>
  );

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader title="Tarif" subtitle="Manajemen tarif LOLO, Storage, dan Warehouse" />

        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg w-fit mb-6">
          {(["lolo", "storage", "warehouse"] as TabType[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all",
                tab === t ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white")}>
              {t === "lolo" ? "Tarif LOLO" : t === "storage" ? "Tarif Storage" : "Tarif Warehouse"}
            </button>
          ))}
        </div>

        {/* ── LOLO tab ── */}
        {tab === "lolo" && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-semibold text-white">Tarif LOLO</p>
              <button className="btn-primary btn-sm" onClick={() => openLoloForm()}>+ Tambah</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60">
                  <tr>{["Paket", "Yard", "Ukuran", "Tipe", "Cargo Status", "Harga Lift Off", "Harga Lift On", "Eff. Date", "Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left table-header whitespace-nowrap">{h}</th>
                  ))}</tr>
                  <tr className="bg-slate-900/40">
                    <td className="px-2 py-1">
                      <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={loloColFilters.package} onChange={e => setLoloColFilters(p => ({...p, package: e.target.value}))} />
                    </td>
                    <td className="px-2 py-1">
                      <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={loloColFilters.yard} onChange={e => setLoloColFilters(p => ({...p, yard: e.target.value}))} />
                    </td>
                    <td className="px-2 py-1">
                      <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={loloColFilters.size} onChange={e => setLoloColFilters(p => ({...p, size: e.target.value}))} />
                    </td>
                    <td className="px-2 py-1">
                      <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={loloColFilters.type} onChange={e => setLoloColFilters(p => ({...p, type: e.target.value}))} />
                    </td>
                    <td className="px-2 py-1">
                      <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={loloColFilters.status} onChange={e => setLoloColFilters(p => ({...p, status: e.target.value}))} />
                    </td>
                    <td className="px-2 py-1"></td>
                    <td className="px-2 py-1"></td>
                    <td className="px-2 py-1"></td>
                    <td className="px-2 py-1"></td>
                  </tr>
                </thead>
                <tbody>
                  {loloLoading ? <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">Memuat...</td></tr>
                  : loloData.length === 0 ? <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">Tidak ada data</td></tr>
                  : (() => {
                      let filtered = loloData;
                      if (loloColFilters.package) filtered = filtered.filter(t => t.package?.code?.toLowerCase().includes(loloColFilters.package.toLowerCase()));
                      if (loloColFilters.yard) filtered = filtered.filter(t => t.yard?.name?.toLowerCase().includes(loloColFilters.yard.toLowerCase()));
                      if (loloColFilters.size) filtered = filtered.filter(t => t.container_size?.code?.toLowerCase().includes(loloColFilters.size.toLowerCase()));
                      if (loloColFilters.type) filtered = filtered.filter(t => t.container_type?.code?.toLowerCase().includes(loloColFilters.type.toLowerCase()));
                      if (loloColFilters.status) filtered = filtered.filter(t => t.cargo_status?.code?.toLowerCase().includes(loloColFilters.status.toLowerCase()));
                      
                      return filtered.map(t => (
                        <tr key={t.id} className={cn("table-row", !t.is_active && "opacity-40")}>
                          <td className="px-4 py-3 text-slate-300 font-medium">{t.package?.code || "-"}</td>
                          <td className="px-4 py-3 text-slate-300">{t.yard?.name || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{t.container_size?.code || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{t.container_type?.code || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{t.cargo_status?.code || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{formatCurrency(t.price_lift_off)}</td>
                      <td className="px-4 py-3 text-slate-300">{formatCurrency(t.price_lift_on)}</td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(t.effective_date)}</td>
                      <td className="px-4 py-3"><div className="flex gap-1">
                        <button className="btn btn-sm btn-ghost" onClick={() => openLoloForm(t)} title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button className="btn btn-sm btn-ghost text-red-400" onClick={() => setLoloDeactivate(t)} title="Nonaktifkan">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </button>
                      </div></td>
                    </tr>
                  ));
                })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Storage tab ── */}
        {tab === "storage" && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-semibold text-white">Tarif Storage</p>
              <button className="btn-primary btn-sm" onClick={() => openStorageForm()}>+ Tambah</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60">
                  <tr>{["Yard", "Ukuran", "Tipe", "Cargo Status", "Harga/Hari", "Eff. Date", "Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left table-header whitespace-nowrap">{h}</th>
                  ))}</tr>
                  <tr className="bg-slate-900/40">
                    <td className="px-2 py-1">
                      <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={storageColFilters.yard} onChange={e => setStorageColFilters(p => ({...p, yard: e.target.value}))} />
                    </td>
                    <td className="px-2 py-1">
                      <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={storageColFilters.size} onChange={e => setStorageColFilters(p => ({...p, size: e.target.value}))} />
                    </td>
                    <td className="px-2 py-1">
                      <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={storageColFilters.type} onChange={e => setStorageColFilters(p => ({...p, type: e.target.value}))} />
                    </td>
                    <td className="px-2 py-1">
                      <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={storageColFilters.status} onChange={e => setStorageColFilters(p => ({...p, status: e.target.value}))} />
                    </td>
                    <td className="px-2 py-1"></td>
                    <td className="px-2 py-1"></td>
                    <td className="px-2 py-1"></td>
                  </tr>
                </thead>
                <tbody>
                  {storageLoading ? <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Memuat...</td></tr>
                  : storageData.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Tidak ada data</td></tr>
                  : (() => {
                      let filtered = storageData;
                      if (storageColFilters.yard) filtered = filtered.filter(t => t.yard?.name?.toLowerCase().includes(storageColFilters.yard.toLowerCase()));
                      if (storageColFilters.size) filtered = filtered.filter(t => t.container_size?.code?.toLowerCase().includes(storageColFilters.size.toLowerCase()));
                      if (storageColFilters.type) filtered = filtered.filter(t => t.container_type?.code?.toLowerCase().includes(storageColFilters.type.toLowerCase()));
                      if (storageColFilters.status) filtered = filtered.filter(t => t.cargo_status?.code?.toLowerCase().includes(storageColFilters.status.toLowerCase()));
                      
                      return filtered.map(t => (
                        <tr key={t.id} className={cn("table-row", !t.is_active && "opacity-40")}>
                          <td className="px-4 py-3 text-slate-300">{t.yard?.name || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{t.container_size?.code || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{t.container_type?.code || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{t.cargo_status?.code || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{formatCurrency(t.price_per_day)}</td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(t.effective_date)}</td>
                      <td className="px-4 py-3"><div className="flex gap-1">
                        <button className="btn btn-sm btn-ghost" onClick={() => openStorageForm(t)} title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button className="btn btn-sm btn-ghost text-red-400" onClick={() => setStorageDeactivate(t)} title="Nonaktifkan">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </button>
                      </div></td>
                    </tr>
                  ));
                })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Warehouse tab ── */}
        {tab === "warehouse" && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-semibold text-white">Tarif Warehouse</p>
              <button className="btn-primary btn-sm" onClick={() => openWarehouseTariffForm()}>+ Tambah</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60">
                  <tr>{["Warehouse", "Harga/m²", "Eff. Date", "Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left table-header whitespace-nowrap">{h}</th>
                  ))}</tr>
                  <tr className="bg-slate-900/40">
                    <td className="px-2 py-1">
                      <input className="input py-1 text-xs w-full bg-slate-800/50 border-slate-700" placeholder="Filter..." value={warehouseColFilters.warehouse} onChange={e => setWarehouseColFilters(p => ({...p, warehouse: e.target.value}))} />
                    </td>
                    <td className="px-2 py-1"></td>
                    <td className="px-2 py-1"></td>
                    <td className="px-2 py-1"></td>
                  </tr>
                </thead>
                <tbody>
                  {warehouseTariffLoading ? <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Memuat...</td></tr>
                  : warehouseTariffData.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Tidak ada data</td></tr>
                  : (() => {
                      let filtered = warehouseTariffData;
                      if (warehouseColFilters.warehouse) filtered = filtered.filter(t => t.warehouse?.name?.toLowerCase().includes(warehouseColFilters.warehouse.toLowerCase()));
                      
                      return filtered.map(t => (
                        <tr key={t.id} className={cn("table-row", !t.is_active && "opacity-40")}>
                          <td className="px-4 py-3 text-slate-300">{t.warehouse?.name || "-"}</td>
                          <td className="px-4 py-3 text-slate-300">{formatCurrency(t.price_per_m2)}</td>
                          <td className="px-4 py-3 text-slate-400">{formatDate(t.effective_date)}</td>
                          <td className="px-4 py-3"><div className="flex gap-1">
                            <button className="btn btn-sm btn-ghost" onClick={() => openWarehouseTariffForm(t)} title="Edit">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button className="btn btn-sm btn-ghost text-red-400" onClick={() => setWarehouseTariffDeactivate(t)} title="Nonaktifkan">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            </button>
                          </div></td>
                        </tr>
                      ));
                    })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LOLO Form Modal */}
        <Modal open={loloFormOpen} onClose={() => setLoloFormOpen(false)} title={editLolo ? "Edit Tarif LOLO" : "Tambah Tarif LOLO"} size="lg">
          <form onSubmit={saveLolo} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MasterSelects form={loloForm} setForm={f => setLoloForm(f as typeof loloForm)} />
              <div><label className="label">Paket <span className="text-red-400">*</span></label>
                <select className="input" required value={loloForm.package_id} onChange={e => setLoloForm(p => ({ ...p, package_id: e.target.value }))}>
                  <option value="">-- Pilih --</option>{packages.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                </select></div>
              <div><label className="label">Harga Lift Off (Rp) <span className="text-red-400">*</span></label>
                <input className="input" type="number" required min={0} value={loloForm.price_lift_off} onChange={e => setLoloForm(p => ({ ...p, price_lift_off: e.target.value }))} /></div>
              <div><label className="label">Harga Lift On (Rp) <span className="text-red-400">*</span></label>
                <input className="input" type="number" required min={0} value={loloForm.price_lift_on} onChange={e => setLoloForm(p => ({ ...p, price_lift_on: e.target.value }))} /></div>
              <div><label className="label">Tanggal Efektif <span className="text-red-400">*</span></label>
                <input className="input" type="date" required value={loloForm.effective_date} onChange={e => setLoloForm(p => ({ ...p, effective_date: e.target.value }))} /></div>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={() => setLoloFormOpen(false)}>Batal</button>
              <button type="submit" className="btn-primary" disabled={loloSaving}>{loloSaving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>

        {/* Storage Form Modal */}
        <Modal open={storageFormOpen} onClose={() => setStorageFormOpen(false)} title={editStorage ? "Edit Tarif Storage" : "Tambah Tarif Storage"} size="lg">
          <form onSubmit={saveStorage} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MasterSelects form={storageForm} setForm={f => setStorageForm(f as typeof storageForm)} />
              <div><label className="label">Harga per Hari (Rp) <span className="text-red-400">*</span></label>
                <input className="input" type="number" required min={0} value={storageForm.price_per_day} onChange={e => setStorageForm(p => ({ ...p, price_per_day: e.target.value }))} /></div>
              <div><label className="label">Tanggal Efektif <span className="text-red-400">*</span></label>
                <input className="input" type="date" required value={storageForm.effective_date} onChange={e => setStorageForm(p => ({ ...p, effective_date: e.target.value }))} /></div>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={() => setStorageFormOpen(false)}>Batal</button>
              <button type="submit" className="btn-primary" disabled={storageSaving}>{storageSaving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>

        {/* Warehouse Tariff Form Modal */}
        <Modal open={warehouseTariffFormOpen} onClose={() => setWarehouseTariffFormOpen(false)} title={editWarehouseTariff ? "Edit Tarif Warehouse" : "Tambah Tarif Warehouse"} size="lg">
          <form onSubmit={saveWarehouseTariff} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Warehouse <span className="text-red-400">*</span></label>
                <select className="input" required value={warehouseTariffForm.warehouse_id} onChange={e => setWarehouseTariffForm(p => ({ ...p, warehouse_id: e.target.value }))}>
                  <option value="">-- Pilih --</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select></div>
              <div><label className="label">Harga per m² (Rp) <span className="text-red-400">*</span></label>
                <input className="input" type="number" required min={0} value={warehouseTariffForm.price_per_m2} onChange={e => setWarehouseTariffForm(p => ({ ...p, price_per_m2: e.target.value }))} /></div>
              <div><label className="label">Tanggal Efektif <span className="text-red-400">*</span></label>
                <input className="input" type="date" required value={warehouseTariffForm.effective_date} onChange={e => setWarehouseTariffForm(p => ({ ...p, effective_date: e.target.value }))} /></div>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={() => setWarehouseTariffFormOpen(false)}>Batal</button>
              <button type="submit" className="btn-primary" disabled={warehouseTariffSaving}>{warehouseTariffSaving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog open={!!loloDeactivate} onClose={() => setLoloDeactivate(null)} onConfirm={deactivateLolo}
          title="Nonaktifkan Tarif LOLO" message="Yakin nonaktifkan tarif LOLO ini?" confirmLabel="Nonaktifkan" danger loading={deactivateLoading} />
        <ConfirmDialog open={!!storageDeactivate} onClose={() => setStorageDeactivate(null)} onConfirm={deactivateStorage}
          title="Nonaktifkan Tarif Storage" message="Yakin nonaktifkan tarif Storage ini?" confirmLabel="Nonaktifkan" danger loading={deactivateLoading} />
        <ConfirmDialog open={!!warehouseTariffDeactivate} onClose={() => setWarehouseTariffDeactivate(null)} onConfirm={deactivateWarehouseTariff}
          title="Nonaktifkan Tarif Warehouse" message="Yakin nonaktifkan tarif Warehouse ini?" confirmLabel="Nonaktifkan" danger loading={deactivateLoading} />
      </div>
    </AppLayout>
  );
}
