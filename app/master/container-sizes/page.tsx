"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { containerSizesApi, containerTypesApi } from "@/lib/api";
import { getErrorMessage, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ContainerSize, ContainerType } from "@/types";

function CodeDescTable<T extends { id: number; code: string; description: string; is_active: boolean }>({
  title, data, loading, search, onSearch, onEdit, onDeactivate, onAdd
}: {
  title: string; data: T[]; loading: boolean; search: string;
  onSearch: (v: string) => void; onEdit: (item: T) => void; onDeactivate: (item: T) => void; onAdd: () => void;
}) {
  const filtered = search ? data.filter(d => [d.code, d.description].some(v => v?.toLowerCase().includes(search.toLowerCase()))) : data;
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <p className="font-semibold text-white text-sm">{title}</p>
        <button className="btn-primary btn-sm" onClick={onAdd}>+ Tambah</button>
      </div>
      <div className="p-3 border-b border-slate-800">
        <input className="input max-w-xs" placeholder="Cari..." value={search} onChange={e => onSearch(e.target.value)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/60">
            <tr>{["Kode", "Deskripsi", "Status", "Aksi"].map(h => <th key={h} className="px-4 py-3 text-left table-header">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Memuat...</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Tidak ada data</td></tr>
            : filtered.map(item => (
              <tr key={item.id} className={cn("table-row", !item.is_active && "opacity-40")}>
                <td className="px-4 py-3 font-mono font-semibold text-white">{item.code}</td>
                <td className="px-4 py-3 text-slate-300">{item.description}</td>
                <td className="px-4 py-3"><span className={cn("badge", item.is_active ? "badge-green" : "badge-slate")}>{item.is_active ? "Aktif" : "Nonaktif"}</span></td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <button className="btn btn-sm btn-ghost" onClick={() => onEdit(item)}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button className="btn btn-sm btn-ghost text-red-400" onClick={() => onDeactivate(item)}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  </button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ContainerSizesPage() {
  const [sizes, setSizes] = useState<ContainerSize[]>([]);
  const [types, setTypes] = useState<ContainerType[]>([]);
  const [sizesLoading, setSizesLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);
  const [sizeSearch, setSizeSearch] = useState("");
  const [typeSearch, setTypeSearch] = useState("");

  const [sizeFormOpen, setSizeFormOpen] = useState(false);
  const [editSize, setEditSize] = useState<ContainerSize | null>(null);
  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [editType, setEditType] = useState<ContainerType | null>(null);
  const [form, setForm] = useState({ code: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deactivateSize, setDeactivateSize] = useState<ContainerSize | null>(null);
  const [deactivateType, setDeactivateType] = useState<ContainerType | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchSizes = useCallback(async () => { setSizesLoading(true); try { setSizes((await containerSizesApi.getAll()).data.data || []); } catch {} finally { setSizesLoading(false); } }, []);
  const fetchTypes = useCallback(async () => { setTypesLoading(true); try { setTypes((await containerTypesApi.getAll()).data.data || []); } catch {} finally { setTypesLoading(false); } }, []);
  useEffect(() => { fetchSizes(); fetchTypes(); }, [fetchSizes, fetchTypes]);

  async function saveSize(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (editSize) await containerSizesApi.update(editSize.id, form); else await containerSizesApi.create(form);
      toast.success("Ukuran disimpan"); setSizeFormOpen(false); fetchSizes();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }

  async function saveType(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (editType) await containerTypesApi.update(editType.id, form); else await containerTypesApi.create(form);
      toast.success("Tipe disimpan"); setTypeFormOpen(false); fetchTypes();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }

  async function deactivateS() {
    if (!deactivateSize) return; setDeactivateLoading(true);
    try { await containerSizesApi.deactivate(deactivateSize.id); toast.success("Dinonaktifkan"); setDeactivateSize(null); fetchSizes(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setDeactivateLoading(false); }
  }

  async function deactivateT() {
    if (!deactivateType) return; setDeactivateLoading(true);
    try { await containerTypesApi.deactivate(deactivateType.id); toast.success("Dinonaktifkan"); setDeactivateType(null); fetchTypes(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setDeactivateLoading(false); }
  }

  const CodeDescForm = ({ onSubmit, title }: { onSubmit: (e: React.FormEvent) => void; title: string }) => (
    <Modal open={sizeFormOpen || typeFormOpen} onClose={() => { setSizeFormOpen(false); setTypeFormOpen(false); }} title={title} size="sm">
      <form onSubmit={onSubmit} className="space-y-4">
        <div><label className="label">Kode <span className="text-red-400">*</span></label>
          <input className="input" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
        <div><label className="label">Deskripsi <span className="text-red-400">*</span></label>
          <input className="input" required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
          <button type="button" className="btn-secondary" onClick={() => { setSizeFormOpen(false); setTypeFormOpen(false); }}>Batal</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </form>
    </Modal>
  );

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader title="Container Size & Type" subtitle="Manajemen ukuran dan tipe kontainer" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CodeDescTable title="Ukuran Container" data={sizes} loading={sizesLoading} search={sizeSearch} onSearch={setSizeSearch}
            onEdit={item => { setEditSize(item); setForm({ code: item.code, description: item.description }); setSizeFormOpen(true); }}
            onDeactivate={setDeactivateSize}
            onAdd={() => { setEditSize(null); setForm({ code: "", description: "" }); setSizeFormOpen(true); }} />
          <CodeDescTable title="Tipe Container" data={types} loading={typesLoading} search={typeSearch} onSearch={setTypeSearch}
            onEdit={item => { setEditType(item); setForm({ code: item.code, description: item.description }); setTypeFormOpen(true); }}
            onDeactivate={setDeactivateType}
            onAdd={() => { setEditType(null); setForm({ code: "", description: "" }); setTypeFormOpen(true); }} />
        </div>
        {sizeFormOpen && <CodeDescForm onSubmit={saveSize} title={editSize ? "Edit Ukuran" : "Tambah Ukuran"} />}
        {typeFormOpen && <CodeDescForm onSubmit={saveType} title={editType ? "Edit Tipe" : "Tambah Tipe"} />}
        <ConfirmDialog open={!!deactivateSize} onClose={() => setDeactivateSize(null)} onConfirm={deactivateS} title="Nonaktifkan Ukuran" message={`Nonaktifkan "${deactivateSize?.code}"?`} confirmLabel="Nonaktifkan" danger loading={deactivateLoading} />
        <ConfirmDialog open={!!deactivateType} onClose={() => setDeactivateType(null)} onConfirm={deactivateT} title="Nonaktifkan Tipe" message={`Nonaktifkan "${deactivateType?.code}"?`} confirmLabel="Nonaktifkan" danger loading={deactivateLoading} />
      </div>
    </AppLayout>
  );
}
