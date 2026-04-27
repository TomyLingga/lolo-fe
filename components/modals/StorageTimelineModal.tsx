"use client";
import Modal from "@/components/ui/Modal";
import Timeline from "@/components/ui/Timeline";
import { formatDateTime, formatDate } from "@/lib/utils";
import type { Registration } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  registration: Registration | null;
}

export default function StorageTimelineModal({ open, onClose, registration }: Props) {
  // Langsung ambil dari data registrasi, tidak perlu fetch API lagi
  const records = registration?.storage_records || [];

  const items = records.map(r => ({
    id: r.id,
    title: `${r.yard?.name || "Yard"} — Block ${r.block?.block_code || "-"}`,
    subtitle: r.note || undefined,
    datetime: formatDateTime(r.moved_at),
    badge: `L${r.pos_length} W${r.pos_width} H${r.pos_height}`,
    badgeColor: "green" as const,
    details: [
      { label: "Status", value: r.cargo_status?.description || "-" },
      { label: "Mulai", value: formatDate(r.start_date) },
    ],
  }));

  return (
    <Modal open={open} onClose={onClose} title="Riwayat Storage" size="md">
      {records.length === 0 ? (
        <p className="text-center text-slate-500 py-8">Belum ada riwayat Storage</p>
      ) : (
        <Timeline items={items} />
      )}
    </Modal>
  );
}