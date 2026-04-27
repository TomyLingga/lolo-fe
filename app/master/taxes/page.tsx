"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { taxesApi } from "@/lib/api";
import { getErrorMessage, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Tax } from "@/types";

export default function TaxesPage() {
  const [data, setData] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Tax | null>(null);
  const [form, setForm] = useState({ name: "", value: "", value_type: "PERCENTAGE", type: "ADD" });
  const [saving, setSaving] = useState(false);
  const [deactivateItem, setDeactivateItem] = useState<Tax | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData((await taxesApi.getAll()).data.data || []); }
    catch { toast.error("Gagal memuat data"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  function openForm(item?: Tax) {
    setEditItem(item || null);
    setForm(item ? { name: item.name, value: String(item.value), value_type: item.value_type, type: item.type } : { name: "", value: "", value_type: "PERCENTAGE", type: "ADD" });
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { name: form.name, value: Number(form.value), value_type: form.value_type as "PERCENTAGE" | "NOMINAL", type: form.type as "ADD" | "DEDUCT" };
      if (editItem) await taxesApi.update(editItem.id, payload); else await taxesApi.create(payload);
      toast.success("Data disimpan"); setFormOpen(false); fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function handleDeactivate() {
    if (!deactivateItem) return; setDeactivateLoading(true);
    try { await taxesApi.deactivate(deactivateItem.id); toast.success("Data dinonaktifkan"); setDeactivateItem(null); fetchData(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeactivateLoading(false); }
  }

  const filtered = search ? data.filter(d => d.name.toLowerCase().includes(search.toLowerCase())) : data;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader title="Tax & Discount" subtitle="Manajemen pajak dan diskon"
          actions={<button className="btn-primary btn-sm sm:btn" onClick={() => openForm()}>+ Tambah</button>} />
        <div className="card p-4 mb-4">
          <input className="input max-w-sm" placeholder="Cari nama..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>{["Nama", "Nilai", "Tipe", "Status", "Aksi"].map(h => <th key={h} className="px-4 py-3 text-left table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Memuat...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Tidak ada data</td></tr>
                : filtered.map(item => (
                  <tr key={item.id} className={cn("table-row", !item.is_active && "opacity-40")}>
                    <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {item.value_type === "PERCENTAGE" ? `${item.value}%` : `Rp ${Number(item.value).toLocaleString('id-ID')}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("badge", item.type === "ADD" ? "badge-red" : "badge-green")}>
                        {item.type === "ADD" ? "Tambah" : "Kurang"}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className={cn("badge", item.is_active ? "badge-green" : "badge-slate")}>{item.is_active ? "Aktif" : "Nonaktif"}</span></td>
                    <td className="px-4 py-3"><div className="flex gap-1">
                      <button className="btn btn-sm btn-ghost" onClick={() => openForm(item)}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button className="btn btn-sm btn-ghost text-red-400" onClick={() => setDeactivateItem(item)}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      </button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editItem ? "Edit Tax/Discount" : "Tambah Tax/Discount"} size="sm">
          <form onSubmit={handleSave} className="space-y-4">
            <div><label className="label">Nama <span className="text-red-400">*</span></label>
              <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="PPN, Diskon Khusus, dll" /></div>
            
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Nilai <span className="text-red-400">*</span></label>
                <input className="input" type="number" required min={0} step={0.01} value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} /></div>
              <div><label className="label">Jenis Nilai <span className="text-red-400">*</span></label>
                <select className="input" required value={form.value_type} onChange={e => setForm(p => ({ ...p, value_type: e.target.value }))}>
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="NOMINAL">Nominal (Rp)</option>
                </select></div>
            </div>

            <div><label className="label">Tipe (Tambah/Kurang) <span className="text-red-400">*</span></label>
              <select className="input" required value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="ADD">Tambah</option>
                <option value="DEDUCT">Kurang</option>
              </select></div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Batal</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
        <ConfirmDialog open={!!deactivateItem} onClose={() => setDeactivateItem(null)} onConfirm={handleDeactivate}
          title="Nonaktifkan Tax/Discount" message={`Nonaktifkan "${deactivateItem?.name}"?`} confirmLabel="Nonaktifkan" danger loading={deactivateLoading} />
      </div>
    </AppLayout>
  );
}
