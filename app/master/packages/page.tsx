"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { packagesApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { getErrorMessage, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Package } from "@/types";

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label}{required && <span className="text-red-400"> *</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function PackagesPage() {
  const user = typeof window !== "undefined" ? getUser() : null;
  const isAdmin = user?.role === "admin";

  const [data, setData] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // modal
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Package | null>(null);
  const [saving, setSaving] = useState(false);
  const [deactivateItem, setDeactivateItem] = useState<Package | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // individual form field states
  const [pname, setPname] = useState("");
  const [pcode, setPcode] = useState("");
  const [pfreeTime, setPfreeTime] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData((await packagesApi.getAll()).data.data || []); }
    catch { toast.error("Gagal memuat data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openForm(item?: Package) {
    setEditItem(item || null);
    setPname(item?.name ?? "");
    setPcode(item?.code ?? "");
    setPfreeTime(item ? String(item.free_time_days) : "");
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: pname, code: pcode, free_time_days: Number(pfreeTime) };
      if (editItem) await packagesApi.update(editItem.id, payload);
      else await packagesApi.create(payload);
      toast.success("Data disimpan");
      setFormOpen(false);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function handleDeactivate() {
    if (!deactivateItem) return;
    setDeactivateLoading(true);
    try {
      const res = await packagesApi.deactivate(deactivateItem.id);
      toast.success(res.data.is_active ? "Data diaktifkan" : "Data dinonaktifkan");
      setDeactivateItem(null);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeactivateLoading(false); }
  }

  const filtered = search
    ? data.filter(d => [d.name, d.code].some(v => v.toLowerCase().includes(search.toLowerCase())))
    : data;

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-slate-400">Akses Ditolak. Hanya Admin yang dapat mengakses halaman ini.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader
          title="Paket"
          subtitle="Manajemen kategori paket registrasi"
          actions={
            <button className="btn-primary btn-sm sm:btn" onClick={() => openForm()}>
              + Tambah
            </button>
          }
        />

        <div className="card p-4 mb-4">
          <input className="input max-w-sm" placeholder="Cari nama atau kode..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  {["Kode", "Nama", "Free Time (Hari)", "Status", "Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left table-header whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Memuat...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Tidak ada data</td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className={cn("table-row", !item.is_active && "opacity-40")}>
                    <td className="px-4 py-3 font-mono font-semibold text-white">{item.code}</td>
                    <td className="px-4 py-3 text-slate-300">{item.name}</td>
                    <td className="px-4 py-3 text-slate-300">{item.free_time_days} Hari</td>
                    <td className="px-4 py-3">
                      <span className={cn("badge", item.is_active ? "badge-green" : "badge-slate")}>
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="btn btn-sm btn-ghost" onClick={() => openForm(item)} title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          className={cn("btn btn-sm btn-ghost", item.is_active ? "text-red-400" : "text-emerald-400")}
                          onClick={() => setDeactivateItem(item)}
                          title={item.is_active ? "Nonaktifkan" : "Aktifkan"}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {item.is_active
                              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            }
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">{filtered.length} dari {data.length} data</p>
          </div>
        </div>

        {/* ── Form Modal ── */}
        <Modal open={formOpen} onClose={() => setFormOpen(false)}
          title={editItem ? "Edit Paket" : "Tambah Paket"} size="sm">
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Kode" required hint="Contoh: KA-DOM, KA-INT, NON">
              <input className="input uppercase" required placeholder="NON..."
                value={pcode} onChange={e => setPcode(e.target.value.toUpperCase())} />
            </Field>

            <Field label="Nama" required hint="Contoh: KA Domestik, Non Paket">
              <input className="input" required placeholder="Non Paket..."
                value={pname} onChange={e => setPname(e.target.value)} />
            </Field>

            <Field label="Free Time Days (Hari)" required hint="Jumlah hari bebas biaya storage">
              <input className="input" type="number" required min={0}
                placeholder="0"
                value={pfreeTime} onChange={e => setPfreeTime(e.target.value)} />
            </Field>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Batal</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!deactivateItem} onClose={() => setDeactivateItem(null)} onConfirm={handleDeactivate}
          title={deactivateItem?.is_active ? "Nonaktifkan Paket" : "Aktifkan Paket"}
          message={deactivateItem?.is_active 
            ? `Nonaktifkan paket "${deactivateItem?.name}"?`
            : `Aktifkan kembali paket "${deactivateItem?.name}"?`}
          confirmLabel={deactivateItem?.is_active ? "Nonaktifkan" : "Aktifkan"}
          danger={deactivateItem?.is_active} 
          success={!deactivateItem?.is_active}
          loading={deactivateLoading} />
      </div>
    </AppLayout>
  );
}
