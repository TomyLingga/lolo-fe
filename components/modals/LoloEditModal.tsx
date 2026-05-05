"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { loloRecordsApi, cargoStatusesApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import toast from "react-hot-toast";
import type { LoloRecord, CargoStatus } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  loloId: number | null;
}

const FormWrapper = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="label text-slate-400 text-xs mb-1.5 block uppercase tracking-wider font-semibold">{label}{req && <span className="text-red-400"> *</span>}</label>
    {children}
  </div>
);

export default function LoloEditModal({ open, onClose, onSaved, loloId }: Props) {
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [statuses, setStatuses] = useState<CargoStatus[]>([]);
  const [lolo, setLolo] = useState<LoloRecord | null>(null);
  const [form, setForm] = useState({
    cargo_status_id: "",
    vehicle_type: "",
    vehicle_number: "",
    lolo_at: "",
  });

  useEffect(() => {
    if (!open || !loloId) return;

    async function loadData() {
      setInitLoading(true);
      try {
        const [sRes, lRes] = await Promise.all([
          cargoStatusesApi.getAll(),
          loloRecordsApi.getDetail(loloId as number)
        ]);
        
        setStatuses(sRes.data.data.filter((s: any) => s.is_active));
        const lData = lRes.data.data;
        setLolo(lData);
        setForm({
          cargo_status_id: String(lData.cargo_status_id),
          vehicle_type: lData.vehicle_type || "",
          vehicle_number: lData.vehicle_number || "",
          lolo_at: lData.lolo_at ? lData.lolo_at.replace(" ", "T").slice(0, 16) : "",
        });
      } catch (err) {
        toast.error("Gagal memuat data");
        onClose();
      } finally {
        setInitLoading(false);
      }
    }

    loadData();
  }, [open, loloId, onClose]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loloId) return;
    setLoading(true);
    try {
      await loloRecordsApi.update(loloId as number, {
        cargo_status_id: Number(form.cargo_status_id),
        vehicle_type: form.vehicle_type,
        vehicle_number: form.vehicle_number,
        lolo_at: form.lolo_at.replace("T", " ") + ":00",
      });
      toast.success("Riwayat LOLO diperbarui");
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Riwayat LOLO" size="md">
      {initLoading ? (
        <div className="py-12 text-center text-slate-500">
          <svg className="animate-spin w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p>Memuat data...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 mb-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">No. Container</p>
                  <p className="text-sm text-white font-mono">{lolo?.registration?.container_number}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Operasi</p>
                  <p className="text-sm text-white">{lolo?.operation_type}</p>
                </div>
             </div>
          </div>

          <FormWrapper label="Status Kargo" req>
            <select className="input" required value={form.cargo_status_id} onChange={set("cargo_status_id")}>
              <option value="">-- Pilih Status --</option>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.code} - {s.description}</option>)}
            </select>
          </FormWrapper>

          <div className="grid grid-cols-2 gap-4">
            <FormWrapper label="Jenis Kendaraan">
              <input className="input" value={form.vehicle_type} onChange={set("vehicle_type")} placeholder="Truk / KA" />
            </FormWrapper>
            <FormWrapper label="No. Kendaraan">
              <input className="input" value={form.vehicle_number} onChange={set("vehicle_number")} placeholder="BK 1234 AB" />
            </FormWrapper>
          </div>

          <FormWrapper label="Waktu LOLO" req>
            <input className="input" type="datetime-local" required value={form.lolo_at} onChange={set("lolo_at")} />
          </FormWrapper>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
