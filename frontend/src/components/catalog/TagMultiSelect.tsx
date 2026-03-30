"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus, Hash, ChevronDown } from "lucide-react";

export interface Tag { id: string; name: string; }

interface TagMultiSelectProps {
  availableTags: Tag[];
  selectedTagIds: string[];
  onChange: (ids: string[]) => void;
  onCreateTag?: (name: string) => Promise<Tag | null>;  // optional creation
  placeholder?: string;
  className?: string;
}

export function TagMultiSelect({
  availableTags,
  selectedTagIds,
  onChange,
  onCreateTag,
  placeholder = "Ajouter des tags...",
  className = "",
}: TagMultiSelectProps) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);
  const containerRef          = useRef<HTMLDivElement>(null);

  const selectedTags = availableTags.filter(t => selectedTagIds.includes(t.id));

  const filtered = availableTags.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) &&
    !selectedTagIds.includes(t.id)
  );

  const canCreate = onCreateTag && search.trim() &&
    !availableTags.some(t => t.name.toLowerCase() === search.trim().toLowerCase());

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleTag(id: string) {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter(i => i !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  }

  function removeTag(id: string) {
    onChange(selectedTagIds.filter(i => i !== id));
  }

  async function handleCreate() {
    if (!onCreateTag || !search.trim() || creating) return;
    setCreating(true);
    const newTag = await onCreateTag(search.trim());
    if (newTag) {
      onChange([...selectedTagIds, newTag.id]);
    }
    setSearch("");
    setCreating(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input box showing selected tags */}
      <div
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className={`min-h-[42px] flex flex-wrap gap-1.5 items-center px-3 py-2 border rounded-xl cursor-text transition-all bg-gray-50 dark:bg-[#2A2A2A] ${
          open
            ? "border-[#7C4DFF] ring-2 ring-[#7C4DFF]/20"
            : "border-gray-200 dark:border-white/10"
        }`}
      >
        {/* Selected tags pills */}
        {selectedTags.map(tag => (
          <span
            key={tag.id}
            className="flex items-center gap-1 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium"
          >
            <Hash size={10} />
            {tag.name}
            <button
              onClick={e => { e.stopPropagation(); removeTag(tag.id); }}
              className="hover:text-red-500 transition ml-0.5"
            >
              <X size={11} />
            </button>
          </span>
        ))}

        {/* Search input */}
        <input
          ref={inputRef}
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === "Enter" && canCreate) handleCreate();
            if (e.key === "Backspace" && !search && selectedTagIds.length > 0) {
              removeTag(selectedTagIds[selectedTagIds.length - 1]);
            }
          }}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none placeholder:text-gray-400"
        />

        <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
          {/* Create option */}
          {canCreate && (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition border-b border-gray-100 dark:border-white/5"
            >
              <Plus size={14} />
              {creating ? "Création..." : `Créer "${search.trim()}"`}
            </button>
          )}

          {/* Tag list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && !canCreate ? (
              <p className="px-4 py-3 text-sm text-gray-400 italic">
                {search ? "Aucun tag trouvé" : "Tous les tags sont sélectionnés"}
              </p>
            ) : (
              filtered.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => { toggleTag(tag.id); setSearch(""); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left"
                >
                  <Hash size={12} className="text-gray-400" />
                  {tag.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
