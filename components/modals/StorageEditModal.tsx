"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { storageRecordsApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import type { CargoStatus } from "@/types";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  storageId: number | null;
  cargoStatuses?: CargoStatus[];
  initialData?: { cargo_status_id?: number; start_date: string; end_date: string | null; moved_at: string; note: string } | null;
}

const FormWrapper = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="label text-slate-400 text-xs mb-1.5 block uppercase tracking-wider font-semibold">{label}{req && <span className="text-red-400"> *</span>}</label>
    {children}
  </div>
);

export default function StorageEditModal({ open, onClose, onSaved, storageId, initialData, cargoStatuses = [] }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cargo_status_id: "",
    start_date: "",
    end_date: "",
    moved_at: "",
    note: "",
  });

  useEffect(() => {
    if (!open || !storageId) {
      setForm({ cargo_status_id: "", start_date: "", end_date: "", moved_at: "", note: "" });
      return;
    }
    if (initialData) {
      setForm({
        cargo_status_id: initialData.cargo_status_id ? String(initialData.cargo_status_id) : "",
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
        moved_at: initialData.moved_at ? initialData.moved_at.replace(" ", "T").substring(0, 16) : "",
        note: initialData.note || "",
      });
    }
  }, [open, storageId, initialData]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storageId) return;
    setLoading(true);
    try {
      const payload: any = { note: form.note };
      if (form.cargo_status_id) {
        payload.cargo_status_id = Number(form.cargo_status_id);
      }
      if (form.start_date) {
        payload.start_date = form.start_date;
      }
      if (form.end_date) {
        payload.end_date = form.end_date;
      }
      if (form.moved_at) {
        payload.moved_at = form.moved_at.replace("T", " ") + ":00";
      }
      await storageRecordsApi.update(storageId, payload);
      toast.success("Riwayat storage diperbarui");
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Riwayat Storage" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Cargo Status */}
        {cargoStatuses.length > 0 && (
          <FormWrapper label="Status Kargo">
            <select
              className="input"
              value={form.cargo_status_id}
              onChange={set("cargo_status_id")}
            >
              <option value="">-- Tidak Diubah --</option>
              {cargoStatuses.map(cs => (
                <option key={cs.id} value={cs.id}>{cs.description}</option>
              ))}
            </select>
            {form.cargo_status_id && form.cargo_status_id !== String(initialData?.cargo_status_id) && (
              <p className="text-xs text-amber-400 mt-1">⚠ Tarif storage akan disesuaikan otomatis dengan status kargo baru</p>
            )}
          </FormWrapper>
        )}

        <FormWrapper label="Tanggal Mulai">
          <input className="input" type="date" value={form.start_date} onChange={set("start_date")} />
        </FormWrapper>

        {initialData?.end_date && (
          <FormWrapper label="Tanggal Selesai">
            <input className="input" type="date" value={form.end_date} onChange={set("end_date")} />
          </FormWrapper>
        )}

        <FormWrapper label="Waktu Perpindahan">
          <input className="input" type="datetime-local" value={form.moved_at} onChange={set("moved_at")} />
        </FormWrapper>

        <FormWrapper label="Catatan">
          <textarea className="input py-2" rows={3} value={form.note} onChange={set("note")} placeholder="Tambahkan catatan koreksi..." />
        </FormWrapper>

        <div className="pt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>Batal</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
