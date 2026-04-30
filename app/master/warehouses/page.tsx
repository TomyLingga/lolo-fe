"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { warehousesApi, warehouseChambersApi } from "@/lib/api";
import { getErrorMessage, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Warehouse, WarehouseChamber } from "@/types";

interface ChamberForm {
  code: string;
  name: string;
  length_m: string;
  width_m: string;
  area_m2: string;
  id?: number;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [chambers, setChambers] = useState<WarehouseChamber[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedWarehouse, setExpandedWarehouse] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);
  const [form, setForm] = useState({ name: "", code: "", location: "", total_area_m2: "", description: "" });
  const [chamberForms, setChamberForms] = useState<ChamberForm[]>([{ code: "", name: "", length_m: "", width_m: "", area_m2: "" }]);
  const [saving, setSaving] = useState(false);

  const [deactivateWarehouse, setDeactivateWarehouse] = useState<Warehouse | null>(null);
  const [deactivateChamber, setDeactivateChamber] = useState<WarehouseChamber | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [w, c] = await Promise.all([warehousesApi.getAll(), warehouseChambersApi.getAll()]);
      setWarehouses(w.data.data || []);
      setChambers(c.data.data || []);
    } catch { toast.error("Gagal memuat data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openForm(warehouse?: Warehouse) {
    setEditWarehouse(warehouse || null);
    if (warehouse) {
      setForm({
        name: warehouse.name,
        code: warehouse.code,
        location: warehouse.location || "",
        total_area_m2: String(warehouse.total_area_m2 || ""),
        description: warehouse.description || ""
      });
      const warehouseChambers = chambers.filter(c => c.warehouse_id === warehouse.id);
      setChamberForms(warehouseChambers.length > 0
        ? warehouseChambers.map(c => ({
          id: c.id,
          code: c.code,
          name: c.name || "",
          length_m: String(c.length_m || ""),
          width_m: String(c.width_m || ""),
          area_m2: String(c.area_m2 || "")
        }))
        : [{ code: "", name: "", length_m: "", width_m: "", area_m2: "" }]);
    } else {
      setForm({ name: "", code: "", location: "", total_area_m2: "", description: "" });
      setChamberForms([{ code: "", name: "", length_m: "", width_m: "", area_m2: "" }]);
    }
    setFormOpen(true);
  }

  function addChamberRow() { setChamberForms(p => [...p, { code: "", name: "", length_m: "", width_m: "", area_m2: "" }]); }
  function removeChamberRow(i: number) { setChamberForms(p => p.filter((_, idx) => idx !== i)); }
  function setChamberField(i: number, k: keyof ChamberForm, v: string) {
    setChamberForms(p => {
      const updated = [...p];
      updated[i] = { ...updated[i], [k]: v };

      // Auto calculate area if length or width changes
      if (k === "length_m" || k === "width_m") {
        const l = parseFloat(k === "length_m" ? v : updated[i].length_m);
        const w = parseFloat(k === "width_m" ? v : updated[i].width_m);
        if (!isNaN(l) && !isNaN(w)) {
          updated[i].area_m2 = String(l * w);
        }
      }

      return updated;
    });
  }

  useEffect(() => {
    const total = chamberForms.reduce((sum, cf) => sum + (parseFloat(cf.area_m2) || 0), 0);
    setForm(p => ({ ...p, total_area_m2: String(total) }));
  }, [chamberForms]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      let warehouseId: number;
      const warehousePayload = {
        name: form.name,
        code: form.code,
        location: form.location,
        total_area_m2: parseFloat(form.total_area_m2) || 0,
        description: form.description
      };

      if (editWarehouse) {
        await warehousesApi.update(editWarehouse.id, warehousePayload);
        warehouseId = editWarehouse.id;
      } else {
        const res = await warehousesApi.create(warehousePayload);
        warehouseId = res.data.data.id;
      }
      // Save chambers
      for (const cf of chamberForms) {
        if (!cf.code) continue;
        const payload = {
          warehouse_id: warehouseId,
          code: cf.code,
          name: cf.name,
          length_m: parseFloat(cf.length_m) || 0,
          width_m: parseFloat(cf.width_m) || 0,
          area_m2: parseFloat(cf.area_m2) || 0
        };
        if (cf.id) await warehouseChambersApi.update(cf.id, payload);
        else await warehouseChambersApi.create(payload);
      }
      toast.success(editWarehouse ? "Warehouse diperbarui" : "Warehouse dibuat"); setFormOpen(false); fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function handleDeactivateWarehouse() {
    if (!deactivateWarehouse) return; setDeactivateLoading(true);
    try {
      const res = await warehousesApi.deactivate(deactivateWarehouse.id);
      toast.success(res.data.is_active ? "Warehouse diaktifkan" : "Warehouse dinonaktifkan");
      setDeactivateWarehouse(null);
      fetchData();
    }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeactivateLoading(false); }
  }

  async function handleDeactivateChamber() {
    if (!deactivateChamber) return; setDeactivateLoading(true);
    try {
      const res = await warehouseChambersApi.deactivate(deactivateChamber.id);
      toast.success(res.data.is_active ? "Chamber diaktifkan" : "Chamber dinonaktifkan");
      setDeactivateChamber(null);
      fetchData();
    }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeactivateLoading(false); }
  }

  const filteredWarehouses = search ? warehouses.filter(w => [w.name, w.code].some(v => v?.toLowerCase().includes(search.toLowerCase()))) : warehouses;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader title="Warehouse & Chamber" subtitle="Manajemen gudang dan ruangan penyimpanan"
          actions={<button className="btn-primary btn-sm sm:btn" onClick={() => openForm()}>+ Tambah Warehouse</button>} />

        <div className="card p-4 mb-4">
          <input className="input max-w-sm" placeholder="Cari warehouse..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="space-y-3">
          {loading ? <div className="card p-8 text-center text-slate-500">Memuat...</div>
            : filteredWarehouses.length === 0 ? <div className="card p-8 text-center text-slate-500">Tidak ada data</div>
              : filteredWarehouses.map(warehouse => {
                const warehouseChambers = chambers.filter(c => c.warehouse_id === warehouse.id);
                const isExpanded = expandedWarehouse === warehouse.id;
                return (
                  <div key={warehouse.id} className={cn("card overflow-hidden", !warehouse.is_active && "opacity-50")}>
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-800/30 transition-colors"
                      onClick={() => setExpandedWarehouse(isExpanded ? null : warehouse.id)}>
                      <svg className={cn("w-4 h-4 text-slate-500 transition-transform", isExpanded && "rotate-90")}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{warehouse.name}</span>
                          <span className="badge badge-slate">{warehouse.code}</span>
                          <span className="text-xs text-slate-500">{warehouseChambers.length} chamber • {warehouse.total_area_m2} m² • {warehouse.location}</span>
                        </div>
                        {warehouse.description && <p className="text-xs text-slate-500 mt-0.5">{warehouse.description}</p>}
                      </div>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button className="btn btn-sm btn-ghost" onClick={() => openForm(warehouse)} title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button className={cn("btn btn-sm btn-ghost", warehouse.is_active ? "text-red-400" : "text-emerald-400")}
                          onClick={() => setDeactivateWarehouse(warehouse)} title={warehouse.is_active ? "Nonaktifkan" : "Aktifkan"}>
                          {warehouse.is_active ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          )}
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-slate-800">
                        {warehouseChambers.length === 0 ? (
                          <p className="text-sm text-slate-500 px-8 py-4">Belum ada chamber</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead className="bg-slate-800/40">
                              <tr>
                                {["Kode", "Nama", "Dimensi (m)", "Luas", "Status", "Aksi"].map(h => (
                                  <th key={h} className="px-4 py-2 text-left table-header text-xs">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {warehouseChambers.map(chamber => (
                                <tr key={chamber.id} className={cn("border-t border-slate-800/50", !chamber.is_active && "opacity-40")}>
                                  <td className="px-4 py-2 font-medium text-slate-200">{chamber.code}</td>
                                  <td className="px-4 py-2 text-slate-300">{chamber.name || "-"}</td>
                                  <td className="px-4 py-2 text-slate-400">{chamber.length_m} x {chamber.width_m}</td>
                                  <td className="px-4 py-2 text-slate-400">{chamber.area_m2} m²</td>
                                  <td className="px-4 py-2">
                                    <span className={cn("badge", chamber.is_active ? "badge-green" : "badge-slate")}>
                                      {chamber.is_active ? "Aktif" : "Nonaktif"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <button className={cn("btn btn-sm btn-ghost", chamber.is_active ? "text-red-400" : "text-emerald-400")}
                                      onClick={() => setDeactivateChamber(chamber)} title={chamber.is_active ? "Nonaktifkan" : "Aktifkan"}>
                                      {chamber.is_active ? (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                      ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
        </div>

        {/* Warehouse Form Modal */}
        <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editWarehouse ? "Edit Warehouse" : "Tambah Warehouse"} size="xl">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Informasi Warehouse</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Nama Warehouse <span className="text-red-400">*</span></label>
                  <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><label className="label">Kode Warehouse <span className="text-red-400">*</span></label>
                  <input className="input" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
                <div><label className="label">Lokasi <span className="text-red-400">*</span></label>
                  <input className="input" required value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
                <div><label className="label">Total Luas (m²) <span className="text-slate-500">(Auto)</span></label>
                  <input className="input bg-slate-900/50" readOnly value={form.total_area_m2} /></div>
                <div className="sm:col-span-2"><label className="label">Deskripsi</label>
                  <input className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Daftar Chamber</p>
                <button type="button" className="btn-ghost btn-sm text-brand-400" onClick={addChamberRow}>+ Tambah Chamber</button>
              </div>
              <div className="space-y-3">
                {chamberForms.map((cf, i) => (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end p-3 bg-slate-800/40 rounded-lg relative group">
                    <div><label className="label text-[10px]">Kode <span className="text-red-400">*</span></label>
                      <input className="input text-xs" required value={cf.code} onChange={e => setChamberField(i, "code", e.target.value)} placeholder="PLB-IN-R" /></div>
                    <div><label className="label text-[10px]">Nama <span className="text-red-400">*</span></label>
                      <input className="input text-xs" required value={cf.name} onChange={e => setChamberField(i, "name", e.target.value)} placeholder="Gudang Kanan" /></div>
                    <div><label className="label text-[10px]">P (m)</label>
                      <input className="input text-xs" type="number" step="0.1" value={cf.length_m} onChange={e => setChamberField(i, "length_m", e.target.value)} /></div>
                    <div><label className="label text-[10px]">L (m)</label>
                      <input className="input text-xs" type="number" step="0.1" value={cf.width_m} onChange={e => setChamberField(i, "width_m", e.target.value)} /></div>
                    <div><label className="label text-[10px]">Luas (m²)</label>
                      <input className="input text-xs bg-slate-900/50" readOnly value={cf.area_m2} /></div>
                    {i > 0 && !cf.id && (
                      <button type="button" onClick={() => removeChamberRow(i)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                        title="Hapus Chamber">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Batal</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog open={!!deactivateWarehouse} onClose={() => setDeactivateWarehouse(null)} onConfirm={handleDeactivateWarehouse}
          title={deactivateWarehouse?.is_active ? "Nonaktifkan Warehouse" : "Aktifkan Warehouse"}
          message={deactivateWarehouse?.is_active
            ? `Nonaktifkan warehouse "${deactivateWarehouse?.name}"?`
            : `Aktifkan kembali warehouse "${deactivateWarehouse?.name}"?`}
          confirmLabel={deactivateWarehouse?.is_active ? "Nonaktifkan" : "Aktifkan"}
          danger={deactivateWarehouse?.is_active}
          success={!deactivateWarehouse?.is_active}
          loading={deactivateLoading} />

        <ConfirmDialog open={!!deactivateChamber} onClose={() => setDeactivateChamber(null)} onConfirm={handleDeactivateChamber}
          title={deactivateChamber?.is_active ? "Nonaktifkan Chamber" : "Aktifkan Chamber"}
          message={deactivateChamber?.is_active
            ? `Nonaktifkan chamber "${deactivateChamber?.code}"?`
            : `Aktifkan kembali chamber "${deactivateChamber?.code}"?`}
          confirmLabel={deactivateChamber?.is_active ? "Nonaktifkan" : "Aktifkan"}
          danger={deactivateChamber?.is_active}
          success={!deactivateChamber?.is_active}
          loading={deactivateLoading} />
      </div>
    </AppLayout>
  );
}
