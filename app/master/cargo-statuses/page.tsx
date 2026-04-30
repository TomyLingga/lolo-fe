"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { cargoStatusesApi } from "@/lib/api";
import { getErrorMessage, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { CargoStatus } from "@/types";

export default function CargoStatusesPage() {
  const [data, setData] = useState<CargoStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<CargoStatus | null>(null);
  const [form, setForm] = useState({ code: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deactivateItem, setDeactivateItem] = useState<CargoStatus | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData((await cargoStatusesApi.getAll()).data.data || []); }
    catch { toast.error("Gagal memuat data"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  function openForm(item?: CargoStatus) {
    setEditItem(item || null);
    setForm(item ? { code: item.code, description: item.description } : { code: "", description: "" });
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) await cargoStatusesApi.update(editItem.id, form);
      else await cargoStatusesApi.create(form);
      toast.success("Data disimpan"); setFormOpen(false); fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function handleDeactivate() {
    if (!deactivateItem) return; setDeactivateLoading(true);
    try { 
      const res = await cargoStatusesApi.deactivate(deactivateItem.id); 
      toast.success(res.data.is_active ? "Data diaktifkan" : "Data dinonaktifkan"); 
      setDeactivateItem(null); 
      fetchData(); 
    }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeactivateLoading(false); }
  }

  const filtered = search ? data.filter(d => [d.code, d.description].some(v => v?.toLowerCase().includes(search.toLowerCase()))) : data;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader title="Cargo Status" subtitle="Manajemen status kargo"
          actions={<button className="btn-primary btn-sm sm:btn" onClick={() => openForm()}>+ Tambah</button>} />
        <div className="card p-4 mb-4">
          <input className="input max-w-sm" placeholder="Cari kode, deskripsi..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>{["Kode", "Deskripsi", "Status", "Aksi"].map(h => <th key={h} className="px-4 py-3 text-left table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Memuat...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Tidak ada data</td></tr>
                : filtered.map(item => (
                  <tr key={item.id} className={cn("table-row", !item.is_active && "opacity-40")}>
                    <td className="px-4 py-3 font-mono font-semibold text-white">{item.code}</td>
                    <td className="px-4 py-3 text-slate-300">{item.description}</td>
                    <td className="px-4 py-3"><span className={cn("badge", item.is_active ? "badge-green" : "badge-slate")}>{item.is_active ? "Aktif" : "Nonaktif"}</span></td>
                    <td className="px-4 py-3"><div className="flex gap-1">
                      <button className="btn btn-sm btn-ghost" onClick={() => openForm(item)}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button className={cn("btn btn-sm btn-ghost", item.is_active ? "text-red-400" : "text-emerald-400")} 
                        onClick={() => setDeactivateItem(item)} title={item.is_active ? "Nonaktifkan" : "Aktifkan"}>
                        {item.is_active ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editItem ? "Edit Cargo Status" : "Tambah Cargo Status"} size="sm">
          <form onSubmit={handleSave} className="space-y-4">
            <div><label className="label">Kode <span className="text-red-400">*</span></label>
              <input className="input" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
            <div><label className="label">Deskripsi <span className="text-red-400">*</span></label>
              <input className="input" required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Batal</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
        <ConfirmDialog open={!!deactivateItem} onClose={() => setDeactivateItem(null)} onConfirm={handleDeactivate}
          title={deactivateItem?.is_active ? "Nonaktifkan Cargo Status" : "Aktifkan Cargo Status"} 
          message={deactivateItem?.is_active 
            ? `Nonaktifkan cargo status "${deactivateItem?.code}"?`
            : `Aktifkan kembali cargo status "${deactivateItem?.code}"?`} 
          confirmLabel={deactivateItem?.is_active ? "Nonaktifkan" : "Aktifkan"} 
          danger={deactivateItem?.is_active}
          success={!deactivateItem?.is_active}
          loading={deactivateLoading} />
      </div>
    </AppLayout>
  );
}
