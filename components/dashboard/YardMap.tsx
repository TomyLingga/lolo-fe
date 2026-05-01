"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { YardMapBlock, YardMapYard } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlotKey { l: number; w: number; h: number; }

// ─── Slot Grid Panel ─────────────────────────────────────────────────────────

interface SlotGridProps {
  block: YardMapBlock;
  yardName: string;
  onClose: () => void;
}

function SlotGridPanel({ block, yardName, onClose }: SlotGridProps) {
  const [selectedSlot, setSelectedSlot] = useState<SlotKey | null>(null);
  const [mounted, setMounted] = useState(false);

  // Lock body scroll & ensure portal mounting
  useEffect(() => {
    setMounted(true);
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Build lookup: {`l-w-h` → registrations[]}
  const slotMap = new Map<string, typeof block.registrations>();
  for (const reg of block.registrations) {
    const key = `${reg.pos_length}-${reg.pos_width}-${reg.pos_height}`;
    const arr = slotMap.get(key) ?? [];
    arr.push(reg);
    slotMap.set(key, arr);
  }

  const slotKey = selectedSlot ? `${selectedSlot.l}-${selectedSlot.w}-${selectedSlot.h}` : null;
  const slotRegs = slotKey ? (slotMap.get(slotKey) ?? []) : [];

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
      <div
        className="relative z-10 bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        style={{ animation: "slideUp 0.2s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{yardName}</p>
            <h3 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-400 ring-4 ring-brand-400/20 inline-block" />
              Blok {block.block_code}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
              {block.max_length}L × {block.max_width}W × {block.max_height}H
            </span>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden min-h-0">
          {/* Slot grid */}
          <div className="flex-1 overflow-y-auto p-4 border-b sm:border-b-0 sm:border-r border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Peta Slot — klik untuk detail
            </p>

            {/* Render by Length row */}
            <div className="space-y-3">
              {Array.from({ length: block.max_length }, (_, li) => {
                const l = li + 1;
                return (
                  <div key={l}>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: block.max_width }, (_, wi) => {
                        const w = wi + 1;
                        // Stack (heights) for this L-W position
                        const stackCount = Array.from({ length: block.max_height }, (_, hi): number =>
                          slotMap.has(`${l}-${w}-${hi + 1}`) ? 1 : 0
                        ).reduce((a, b) => a + b, 0);

                        const isSelected = selectedSlot?.l === l && selectedSlot?.w === w;

                        return (
                          <button
                            key={w}
                            onClick={() => setSelectedSlot(isSelected ? null : { l, w, h: 1 })}
                            title={`Blok ${block.block_code} L${l} W${w} — ${stackCount} kontainer`}
                            className={[
                              "flex flex-col items-center justify-center rounded-lg border transition-all w-12 h-14 text-xs font-bold",
                              stackCount > 0 && !isSelected
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                                : isSelected
                                ? "bg-brand-500/25 border-brand-400 text-brand-300 ring-2 ring-brand-400/30"
                                : "bg-slate-800/60 border-slate-700/50 text-slate-600",
                            ].join(" ")}
                          >
                            <span>{block.block_code}{l}{w}</span>
                            {stackCount > 0 && (
                              <span className="text-[10px] font-normal opacity-80">{stackCount}×</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side: slot detail / registrations */}
          <div className="w-full sm:w-64 flex-shrink-0 overflow-y-auto">
            {!selectedSlot ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-600 text-sm px-4 text-center">
                <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                </svg>
                <p>Pilih posisi slot untuk melihat detail</p>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  L{selectedSlot.l} W{selectedSlot.w} — Isi Stack
                </p>
                {/* Show all heights at this L-W — Reversed so highest is on top */}
                {Array.from({ length: block.max_height }, (_, hi) => {
                  const h = block.max_height - hi;
                  const key = `${selectedSlot.l}-${selectedSlot.w}-${h}`;
                  const regs = slotMap.get(key) ?? [];
                  return (
                    <div key={h} className={[
                      "mb-2 rounded-lg border p-2.5",
                      regs.length > 0
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-slate-800/30 border-slate-700/30",
                    ].join(" ")}>
                      <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Level {h}</p>
                      {regs.length === 0 ? (
                        <p className="text-xs text-slate-600 italic">Kosong</p>
                      ) : regs.map((reg) => (
                        <div key={reg.id} className="mb-2 last:mb-0">
                          <p className="font-mono font-bold text-white text-xs">{reg.container_number}</p>
                          {reg.freight_forwarder && (
                            <p className="text-xs text-slate-400 truncate">{reg.freight_forwarder.name}</p>
                          )}
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {reg.size && <span className="px-1 py-0.5 rounded text-[10px] bg-brand-500/15 text-brand-400">{reg.size.code}</span>}
                            {reg.type && <span className="px-1 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300">{reg.type.code}</span>}
                          </div>
                          <p className="text-[10px] text-slate-600 mt-1">Sejak: {new Date(reg.start_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
          <span>Terisi: <span className="text-emerald-400 font-semibold">{block.occupied_count}</span></span>
          <span>Kapasitas: <span className="text-white font-semibold">{block.capacity}</span> slot</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Block Card ───────────────────────────────────────────────────────────────

interface BlockCardProps {
  block: YardMapBlock;
  onClick: () => void;
}

function BlockCard({ block, onClick }: BlockCardProps) {
  const isEmpty = block.occupied_count === 0;
  const isHighlighted = block.is_highlighted;
  const pct = block.capacity > 0 ? Math.round((block.occupied_count / block.capacity) * 100) : 0;

  let cls = "bg-slate-800/60 border-slate-700/50 text-slate-500 hover:bg-slate-800";
  let dotCls = "bg-slate-600";
  let glow: React.CSSProperties = {};

  if (isHighlighted) {
    cls = "bg-amber-500/15 border-amber-400/50 text-amber-300 hover:bg-amber-500/20";
    dotCls = "bg-amber-400";
    glow = { boxShadow: "0 0 16px 2px rgba(251,191,36,0.28)" };
  } else if (!isEmpty) {
    cls = "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15";
    dotCls = "bg-emerald-400";
    glow = { boxShadow: "0 0 12px 1px rgba(52,211,153,0.18)" };
  }

  return (
    <button
      onClick={onClick}
      style={glow}
      className={[
        "relative flex flex-col items-center justify-center gap-1 rounded-xl border p-3",
        "transition-all duration-200 active:scale-95 min-w-[76px] min-h-[76px]",
        cls,
        !block.is_active ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${dotCls} ${!isEmpty ? "animate-pulse" : ""}`} />
      <span className="font-bold text-sm leading-none">{block.block_code}</span>
      {!isEmpty ? (
        <span className="text-[11px] opacity-80">{block.occupied_count}/{block.capacity} <span className="opacity-60">({pct}%)</span></span>
      ) : (
        <span className="text-[11px] opacity-40">kosong</span>
      )}
    </button>
  );
}

// ─── Yard Slide ───────────────────────────────────────────────────────────────

interface YardSlideProps {
  yard: YardMapYard;
  onBlockClick: (block: YardMapBlock, yardName: string) => void;
}

function YardSlide({ yard, onBlockClick }: YardSlideProps) {
  const pct = yard.total_capacity > 0
    ? Math.round((yard.total_occupied / yard.total_capacity) * 100)
    : 0;

  const color = pct > 80 ? "#ef4444" : pct > 40 ? "#10b981" : "#3b82f6";

  return (
    <div className="w-full bg-slate-800/20 rounded-2xl p-5 border border-slate-800 mb-6 last:mb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-wider">
              {yard.code}
            </span>
            <h3 className="text-lg font-bold text-white">{yard.name}</h3>
          </div>
          <p className="text-sm text-slate-500">
            {yard.total_occupied} dari {yard.total_capacity} slot terisi ({yard.total_blocks} blok)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center relative shadow-inner"
            style={{ background: `conic-gradient(${color} ${pct}%, #1e293b 0)` }}
          >
            <div className="w-11 h-11 bg-slate-900 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">{pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Block grid */}
      {yard.blocks.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-slate-600 text-sm">
          Tidak ada blok di yard ini
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {yard.blocks.map((block) => (
            <BlockCard key={block.id} block={block} onClick={() => onBlockClick(block, yard.name)} />
          ))}
        </div>
      )}
    </div>
  );
}


// ─── Main Component (props-driven — no own fetch) ─────────────────────────────

interface YardMapProps {
  yards: YardMapYard[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onRetry: () => void;
}

export default function YardMap({ yards, loading, error, searchQuery, onRetry }: YardMapProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<YardMapBlock | null>(null);
  const [selectedYardName, setSelectedYardName] = useState("");

  // Reset slide when yards changes
  useEffect(() => {
    setCurrentSlide((prev) => Math.min(prev, Math.max(0, yards.length - 1)));
  }, [yards.length]);

  useEffect(() => {
    if (!searchQuery || yards.length === 0) return;
    // Just re-render, the vertical layout naturally shows highlighted blocks
  }, [yards, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Memuat peta yard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
        <svg className="w-10 h-10 text-red-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-sm">{error}</p>
        <button onClick={onRetry} className="text-xs text-brand-400 hover:text-brand-300 underline">Coba lagi</button>
      </div>
    );
  }

  if (yards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-600">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-sm">Belum ada data yard</p>
      </div>
    );
  }

  return (
    <>

      {/* Vertical list of Yard slides */}
      <div className="flex flex-col">
        {yards.map((yard) => (
          <YardSlide
            key={yard.id}
            yard={yard}
            onBlockClick={(block, yardName) => { setSelectedBlock(block); setSelectedYardName(yardName); }}
          />
        ))}
      </div>

      {/* Slot Grid Modal */}
      {selectedBlock && (
        <SlotGridPanel
          block={selectedBlock}
          yardName={selectedYardName}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </>
  );
}
