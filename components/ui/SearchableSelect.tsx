"use client";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface Props {
  options: Option[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder = "Pilih...", disabled, className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div
        className={cn(
          "input flex items-center justify-between cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "ring-2 ring-brand-500/50 border-brand-500"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={cn("truncate", !selectedOption && "text-slate-500")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-2 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                autoFocus
                className="w-full bg-slate-950 border-none text-xs rounded-lg pl-9 py-2 focus:ring-1 focus:ring-brand-500 text-white placeholder:text-slate-600"
                placeholder="Cari..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  className={cn(
                    "px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors flex justify-between items-center",
                    opt.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-brand-500/10 hover:text-brand-400 text-slate-300",
                    String(opt.value) === String(value) && "bg-brand-500/20 text-brand-400 font-bold"
                  )}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(String(opt.value));
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  <span>{opt.label}</span>
                  {String(opt.value) === String(value) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 italic">Data tidak ditemukan</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
