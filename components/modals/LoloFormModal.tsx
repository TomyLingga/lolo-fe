"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { loloRecordsApi, yardsApi, blocksApi, cargoStatusesApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Registration, Yard, Block, CargoStatus } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  registration: Registration | null;
}

const FormWrapper = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="label">{label}{req && <span className="text-red-400"> *</span>}</label>
    {children}
  </div>
);

export default function LoloFormModal({ open, onClose, onSaved, registration }: Props) {
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false); // State untuk loading data master
  const [yards, setYards] = useState<Yard[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [statuses, setStatuses] = useState<CargoStatus[]>([]);
  
  const loloRecs = (registration as any)?.lolo_records || [];
  const actualLastLolo = loloRecs.length > 0 ? loloRecs[loloRecs.length - 1].operation_type : null;
  const opType = actualLastLolo === "LIFT_OFF" ? "LIFT_ON" : "LIFT_OFF";
  const isLiftOff = opType === "LIFT_OFF";

  const [form, setForm] = useState({
    cargo_status_id: "", vehicle_type: "", vehicle_number: "", lolo_at: "",
    yard_id: "", block_id: "", pos_length: "", pos_width: "", pos_height: "", moved_at: "", note: "",
  });

  useEffect(() => {
    if (!open) return;
    setInitLoading(true); // Mulai loading
    Promise.all([yardsApi.getAll(), blocksApi.getAll(), cargoStatusesApi.getAll()])
      .then(([y, b, c]) => {
        setYards(y.data.data.filter(x => x.is_active));
        setBlocks(b.data.data.filter(x => x.is_active));
        setStatuses(c.data.data.filter(x => x.is_active));
      })
      .finally(() => setInitLoading(false)); // Selesai loading

    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm({ cargo_status_id: String(registration?.cargo_status_id || ""), vehicle_type: "", vehicle_number: "", lolo_at: local, yard_id: "", block_id: "", pos_length: "", pos_width: "", pos_height: "", moved_at: local, note: "" });
  }, [open, registration]);

  const filteredBlocks = form.yard_id ? blocks.filter(b => b.yard_id === Number(form.yard_id)) : blocks;
  
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!registration) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        cargo_status_id: Number(form.cargo_status_id),
        operation_type: opType,
        vehicle_type: form.vehicle_type,
        vehicle_number: form.vehicle_number,
        lolo_at: form.lolo_at.replace("T", " ") + ":00",
      };
      if (isLiftOff) {
        payload.yard_id = Number(form.yard_id);
        payload.block_id = Number(form.block_id);
        payload.pos_length = Number(form.pos_length);
        payload.pos_width = Number(form.pos_width);
        payload.pos_height = Number(form.pos_height);
        payload.moved_at = form.moved_at.replace("T", " ") + ":00";
        if (form.note) payload.note = form.note;
      }
      await loloRecordsApi.create(registration.id, payload);
      toast.success(`${opType === "LIFT_ON" ? "Lift On" : "Lift Off"} berhasil dicatat`);
      onSaved();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose}
      title={`Tambah LOLO — ${opType === "LIFT_ON" ? "LIFT ON (Keluar)" : "LIFT OFF (Masuk)"}`} size="lg">
      {initLoading ? (
        <div className="py-12 text-center text-slate-400">
          <svg className="animate-spin w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p>Memuat data form...</p>
        </div>
      ) : (
        <>
          <div className="mb-4 p-3 bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-400">Container: <span className="text-white font-medium">{registration?.container_number}</span></p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormWrapper label="Status Kargo" req>
                <select className="input" required value={form.cargo_status_id} onChange={set("cargo_status_id")}>
                  <option value="">-- Pilih --</option>
                  {statuses.map(s => <option key={s.id} value={s.id}>{s.code} - {s.description}</option>)}
                </select>
              </FormWrapper>
              <FormWrapper label="Jenis Kendaraan" req>
                <input className="input" required value={form.vehicle_type} onChange={set("vehicle_type")} placeholder="Truk / KA" />
              </FormWrapper>
              <FormWrapper label="No. Kendaraan" req>
                <input className="input" required value={form.vehicle_number} onChange={set("vehicle_number")} />
              </FormWrapper>
              <FormWrapper label="Waktu LOLO" req>
                <input className="input" type="datetime-local" required value={form.lolo_at} onChange={set("lolo_at")} />
              </FormWrapper>
            </div>
            
            {isLiftOff && (
              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Posisi Kontainer</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormWrapper label="Yard" req>
                    <select className="input" required value={form.yard_id} onChange={set("yard_id")}>
                      <option value="">-- Pilih Yard --</option>
                      {yards.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                  </FormWrapper>
                  <FormWrapper label="Block" req>
                    <select className="input" required value={form.block_id} onChange={set("block_id")}>
                      <option value="">-- Pilih Block --</option>
                      {filteredBlocks.map(b => <option key={b.id} value={b.id}>{b.block_code}</option>)}
                    </select>
                  </FormWrapper>
                  <FormWrapper label="Pos. Length" req><input className="input" type="number" required min={1} value={form.pos_length} onChange={set("pos_length")} /></FormWrapper>
                  <FormWrapper label="Pos. Width" req><input className="input" type="number" required min={1} value={form.pos_width} onChange={set("pos_width")} /></FormWrapper>
                  <FormWrapper label="Pos. Height" req><input className="input" type="number" required min={1} value={form.pos_height} onChange={set("pos_height")} /></FormWrapper>
                  <FormWrapper label="Waktu Masuk" req><input className="input" type="datetime-local" required value={form.moved_at} onChange={set("moved_at")} /></FormWrapper>
                  <div className="sm:col-span-2">
                    <FormWrapper label="Catatan">
                      <textarea className="input" rows={2} value={form.note} onChange={set("note")} />
                    </FormWrapper>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}