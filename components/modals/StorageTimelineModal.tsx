"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Timeline from "@/components/ui/Timeline";
import { storageRecordsApi } from "@/lib/api";
import { formatDateTime, formatDate } from "@/lib/utils";
import type { Registration, StorageRecord } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  registration: Registration | null;
}

export default function StorageTimelineModal({ open, onClose, registration }: Props) {
  const [records, setRecords] = useState<StorageRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !registration) return;
    setLoading(true);
    storageRecordsApi.getByRegistration(registration.id)
      .then(r => setRecords(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, registration]);

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
      {loading ? <p className="text-center text-slate-500 py-8">Memuat...</p> : <Timeline items={items} />}
    </Modal>
  );
}
