"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import WarehouseBaFormModal from "../../components/modals/WarehouseBaFormModal";
import { warehouseBeritaAcarasApi } from "@/lib/api";
import { formatDate, getErrorMessage, cn, formatCurrency, firstOfMonth, today } from "@/lib/utils";
import toast from "react-hot-toast";
import type { WarehouseBeritaAcara } from "@/types";

export default function WarehouseBaPage() {
  const [data, setData] = useState<WarehouseBeritaAcara[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [selectedBa, setSelectedBa] = useState<WarehouseBeritaAcara | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await warehouseBeritaAcarasApi.getAll({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined
      });
      setData(res.data.data || []);
    } catch (err: any) {
      if (err?.response?.status === 404) setData([]);
      else toast.error(getErrorMessage(err));
    } finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter(b => [b.ba_number, b.freight_forwarder?.name, b.warehouse?.name]
    .some(v => v?.toLowerCase().includes(search.toLowerCase())));

  async function handleCancel() {
    if (!selectedBa) return; setActionLoading(true);
    try {
      await warehouseBeritaAcarasApi.deactivate(selectedBa.id);
      toast.success("BA dibatalkan"); setCancelConfirm(false); fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionLoading(false); }
  }

  function handleExport(ba: WarehouseBeritaAcara) {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/warehouse-berita-acaras/${ba.id}/pdf`, "_blank");
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <PageHeader title="Berita Acara Warehouse" subtitle="Manajemen dokumen Berita Acara sewa"
          actions={<button className="btn-primary btn-sm sm:btn" onClick={() => setFormOpen(true)}>+ Buat BA Baru</button>} />

        <div className="card p-4 mb-4 flex flex-wrap gap-4 items-end">
          <div><label className="label">Dari Tanggal</label><input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
          <div><label className="label">Sampai Tanggal</label><input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          <div className="flex-1 min-w-[200px]"><label className="label">Cari</label><input className="input" placeholder="No. BA, FF, Warehouse..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  {["No. BA", "Tanggal", "Freight Forwarder", "Warehouse", "Subtotal", "Status", "Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left table-header whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Memuat...</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Tidak ada data</td></tr>
                    : filtered.map(ba => (
                      <tr key={ba.id} className={cn("table-row", !ba.is_active && "opacity-40")}>
                        <td className="px-4 py-3 font-mono font-semibold text-white">{ba.ba_number}</td>
                        <td className="px-4 py-3 text-slate-300">{formatDate(ba.ba_date)}</td>
                        <td className="px-4 py-3 text-slate-300">{ba.freight_forwarder?.name}</td>
                        <td className="px-4 py-3 text-slate-300">{ba.warehouse?.name}</td>
                        <td className="px-4 py-3 text-brand-400 font-semibold">{formatCurrency(ba.subtotal)}</td>
                        <td className="px-4 py-3">
                          {ba.invoiced ? <span className="badge badge-blue">Invoiced</span> : <span className="badge badge-green">Ready</span>}
                          {!ba.is_active && <span className="badge badge-red ml-1">Void</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleExport(ba)} className="btn btn-sm btn-ghost" title="Cetak PDF">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            </button>
                            {!ba.invoiced && ba.is_active && (
                              <button onClick={() => { setSelectedBa(ba); setCancelConfirm(true); }} className="btn btn-sm btn-ghost text-red-400" title="Batalkan BA">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        <WarehouseBaFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); fetchData(); }} />

        <ConfirmDialog open={cancelConfirm} onClose={() => setCancelConfirm(false)} onConfirm={handleCancel}
          title="Batalkan Berita Acara" message="Membatalkan BA akan mengembalikan status registrasi ke belum diinvoice. Lanjutkan?"
          confirmLabel="Ya, Batalkan" danger loading={actionLoading} />
      </div>
    </AppLayout>
  );
}
