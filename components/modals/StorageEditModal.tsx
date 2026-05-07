"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { storageRecordsApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  storageId: number | null;
  initialData?: { start_date: string; note: string } | null;
}

const FormWrapper = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="label text-slate-400 text-xs mb-1.5 block uppercase tracking-wider font-semibold">{label}{req && <span className="text-red-400"> *</span>}</label>
    {children}
  </div>
);

export default function StorageEditModal({ open, onClose, onSaved, storageId, initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    start_date: "",
    note: "",
  });

  useEffect(() => {
    if (!open || !storageId) {
      setForm({ start_date: "", note: "" });
      return;
    }
    if (initialData) {
      setForm({
        start_date: initialData.start_date || "",
        note: initialData.note || "",
      });
    }
  }, [open, storageId, initialData]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storageId) return;
    setLoading(true);
    try {
      const payload: any = { note: form.note };
      if (form.start_date) {
        payload.start_date = form.start_date;
      }
      await storageRecordsApi.update(storageId, payload);
      toast.success("Catatan storage diperbarui");
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
        
        {/* We only allow editing note and start_date */}
        <FormWrapper label="Tanggal Mulai">
          <input className="input" type="date" value={form.start_date} onChange={set("start_date")} />
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
