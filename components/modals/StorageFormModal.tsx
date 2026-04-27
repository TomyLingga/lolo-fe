"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { storageRecordsApi, yardsApi, blocksApi, cargoStatusesApi } from "@/lib/api";
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

export default function StorageFormModal({ open, onClose, onSaved, registration }: Props) {
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [yards, setYards] = useState<Yard[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [statuses, setStatuses] = useState<CargoStatus[]>([]);
  const [form, setForm] = useState({
    cargo_status_id: "", yard_id: "", block_id: "",
    pos_length: "", pos_width: "", pos_height: "", moved_at: "", start_date: "", note: "",
  });

  useEffect(() => {
    if (!open) return;
    setInitLoading(true);

    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const today = local.slice(0, 10);

    Promise.all([yardsApi.getAll(), cargoStatusesApi.getAll()])
      .then(([y, c]) => {
        setYards(y.data.data.filter((x: any) => x.is_active));
        setStatuses(c.data.data.filter((x: any) => x.is_active));
        setBlocks([]);
        // Set form after options loaded
        setForm({
          cargo_status_id: String(registration?.cargo_status_id || ""),
          yard_id: "", block_id: "", pos_length: "", pos_width: "", pos_height: "",
          moved_at: local, start_date: today, note: "",
        });
      })
      .finally(() => setInitLoading(false));
  }, [open, registration]);

  // Load blocks when yard changes
  async function handleYardChange(yardId: string) {
    setForm(p => ({ ...p, yard_id: yardId, block_id: "" }));
    setBlocks([]);
    if (!yardId) return;
    setBlocksLoading(true);
    try {
      const res = await blocksApi.getAll();
      setBlocks(res.data.data.filter((b: any) => b.is_active && String(b.yard_id) === yardId));
    } catch {
      toast.error("Gagal memuat blok");
    } finally {
      setBlocksLoading(false);
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!registration) return;
    setLoading(true);
    try {
      await storageRecordsApi.create(registration.id, {
        cargo_status_id: Number(form.cargo_status_id),
        yard_id: Number(form.yard_id), block_id: Number(form.block_id),
        pos_length: Number(form.pos_length), pos_width: Number(form.pos_width), pos_height: Number(form.pos_height),
        moved_at: form.moved_at.replace("T", " ") + ":00",
        start_date: form.start_date,
        note: form.note || undefined,
      });
      toast.success("Kontainer berhasil dipindahkan");
      onSaved();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Pindah Kontainer" size="lg">
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
          <div className="mb-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/40">
            <p className="text-xs text-slate-400">Container: <span className="text-white font-semibold font-mono">{registration?.container_number}</span></p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormWrapper label="Status Kargo" req>
                <select className="input" required value={form.cargo_status_id} onChange={set("cargo_status_id")}>
                  <option value="">-- Pilih --</option>
                  {statuses.map(s => <option key={s.id} value={s.id}>{s.code} - {s.description}</option>)}
                </select>
              </FormWrapper>

              {/* Yard — select first */}
              <FormWrapper label="Yard" req>
                <select className="input" required value={form.yard_id}
                  onChange={e => handleYardChange(e.target.value)}>
                  <option value="">-- Pilih Yard --</option>
                  {yards.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </FormWrapper>

              {/* Block — disabled until yard selected */}
              <FormWrapper label="Block" req>
                <div className="relative">
                  <select className="input" required value={form.block_id} onChange={set("block_id")}
                    disabled={!form.yard_id || blocksLoading}>
                    <option value="">
                      {!form.yard_id ? "— Pilih yard dulu —" : blocksLoading ? "Memuat blok…" : "-- Pilih Block --"}
                    </option>
                    {blocks.map(b => <option key={b.id} value={b.id}>{b.block_code}</option>)}
                  </select>
                  {blocksLoading && (
                    <svg className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400 pointer-events-none"
                      fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </div>
              </FormWrapper>

              <FormWrapper label="Pos. Length" req><input className="input" type="number" required min={1} value={form.pos_length} onChange={set("pos_length")} /></FormWrapper>
              <FormWrapper label="Pos. Width" req><input className="input" type="number" required min={1} value={form.pos_width} onChange={set("pos_width")} /></FormWrapper>
              <FormWrapper label="Pos. Height" req><input className="input" type="number" required min={1} value={form.pos_height} onChange={set("pos_height")} /></FormWrapper>
              <FormWrapper label="Waktu Pindah" req><input className="input" type="datetime-local" required value={form.moved_at} onChange={set("moved_at")} /></FormWrapper>
              <FormWrapper label="Tanggal Mulai Storage" req><input className="input" type="date" required value={form.start_date} onChange={set("start_date")} /></FormWrapper>
              <div className="sm:col-span-2">
                <FormWrapper label="Catatan">
                  <textarea className="input" rows={2} value={form.note} onChange={set("note")} />
                </FormWrapper>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Menyimpan..." : "Pindahkan"}</button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}