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

// ── defined OUTSIDE component to prevent re-mount on every render ──
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

function formatTaxValue(tax: Tax): string {
  if (tax.value_type === "PERCENTAGE") return `${tax.value}%`;
  return `Rp ${Number(tax.value).toLocaleString("id-ID")}`;
}

export default function TaxesPage() {
  const [data, setData] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // modal
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Tax | null>(null);
  const [saving, setSaving] = useState(false);
  const [deactivateItem, setDeactivateItem] = useState<Tax | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // individual form field states — NO object state to prevent focus loss
  const [tname, setTname] = useState("");
  const [tvalue, setTvalue] = useState("");
  const [tvalueType, setTvalueType] = useState<"PERCENTAGE" | "NOMINAL">("PERCENTAGE");
  const [ttype, setTtype] = useState<"ADD" | "DEDUCT">("ADD");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData((await taxesApi.getAll()).data.data || []); }
    catch { toast.error("Gagal memuat data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openForm(item?: Tax) {
    setEditItem(item || null);
    setTname(item?.name ?? "");
    setTvalue(item ? String(item.value) : "");
    setTvalueType(item?.value_type ?? "PERCENTAGE");
    setTtype(item?.type ?? "ADD");
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: tname, value: Number(tvalue), value_type: tvalueType, type: ttype };
      if (editItem) await taxesApi.update(editItem.id, payload);
      else await taxesApi.create(payload);
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
      await taxesApi.deactivate(deactivateItem.id);
      toast.success(deactivateItem.is_active ? "Data dinonaktifkan" : "Data diaktifkan");
      setDeactivateItem(null);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeactivateLoading(false); }
  }

  const filtered = search
    ? data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    : data;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader
          title="Tax & Discount"
          subtitle="Manajemen pajak dan diskon invoice"
          actions={
            <button className="btn-primary btn-sm sm:btn" onClick={() => openForm()}>
              + Tambah
            </button>
          }
        />

        <div className="card p-4 mb-4">
          <input className="input max-w-sm" placeholder="Cari nama..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  {["Nama", "Nilai", "Jenis Nilai", "Tipe", "Status", "Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left table-header whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Memuat...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Tidak ada data</td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className={cn("table-row", !item.is_active && "opacity-40")}>
                    <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono">{formatTaxValue(item)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("badge", item.value_type === "PERCENTAGE" ? "badge-blue" : "badge-amber")}>
                        {item.value_type === "PERCENTAGE" ? "Persentase" : "Nominal"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("badge", item.type === "ADD" ? "badge-red" : "badge-green")}>
                        {item.type === "ADD" ? "Penambahan" : "Pengurangan"}
                      </span>
                    </td>
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
                              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          title={editItem ? "Edit Tax / Discount" : "Tambah Tax / Discount"} size="sm">
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Nama" required hint="Contoh: PPN 11%, PPh 23, Diskon Agen">
              <input className="input" required placeholder="PPN, PPh, Diskon Khusus..."
                value={tname} onChange={e => setTname(e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Nilai" required>
                <div className="relative">
                  <input className="input pr-10" type="number" required min={0} step={0.01}
                    placeholder={tvalueType === "PERCENTAGE" ? "11" : "50000"}
                    value={tvalue} onChange={e => setTvalue(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                    {tvalueType === "PERCENTAGE" ? "%" : "Rp"}
                  </span>
                </div>
              </Field>
              <Field label="Jenis Nilai" required>
                <select className="input" value={tvalueType}
                  onChange={e => setTvalueType(e.target.value as "PERCENTAGE" | "NOMINAL")}>
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="NOMINAL">Nominal (Rp)</option>
                </select>
              </Field>
            </div>

            <Field label="Efek ke Invoice" required hint="Penambahan = menambah total, Pengurangan = mengurangi total">
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => setTtype("ADD")}
                  className={cn("py-2.5 px-3 rounded-lg border text-sm font-medium transition-all",
                    ttype === "ADD"
                      ? "bg-red-500/20 border-red-500 text-red-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600")}>
                  <span className="text-lg mr-1">＋</span> Penambahan
                </button>
                <button type="button"
                  onClick={() => setTtype("DEDUCT")}
                  className={cn("py-2.5 px-3 rounded-lg border text-sm font-medium transition-all",
                    ttype === "DEDUCT"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600")}>
                  <span className="text-lg mr-1">－</span> Pengurangan
                </button>
              </div>
            </Field>

            {/* Preview */}
            {tvalue && (
              <div className="p-3 bg-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-300">Preview:</p>
                <p>
                  Subtotal <strong className="text-white">Rp 1.000.000</strong>
                  {" → "}{ttype === "ADD" ? "ditambah" : "dikurangi"}{" "}
                  <strong className={ttype === "ADD" ? "text-red-400" : "text-emerald-400"}>
                    {tvalueType === "PERCENTAGE"
                      ? `${tvalue}% = Rp ${(10000 * Number(tvalue)).toLocaleString("id-ID")}`
                      : `Rp ${Number(tvalue).toLocaleString("id-ID")}`}
                  </strong>
                  {" → "} Total{" "}
                  <strong className="text-white">
                    Rp {(
                      1000000 + (ttype === "ADD" ? 1 : -1) *
                      (tvalueType === "PERCENTAGE"
                        ? 1000000 * (Number(tvalue) / 100)
                        : Number(tvalue))
                    ).toLocaleString("id-ID")}
                  </strong>
                </p>
              </div>
            )}

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
          title={deactivateItem?.is_active ? "Nonaktifkan Tax/Discount" : "Aktifkan Tax/Discount"}
          message={`${deactivateItem?.is_active ? "Nonaktifkan" : "Aktifkan"} "${deactivateItem?.name}"?`}
          confirmLabel={deactivateItem?.is_active ? "Nonaktifkan" : "Aktifkan"}
          danger={deactivateItem?.is_active} loading={deactivateLoading} />
      </div>
    </AppLayout>
  );
}
