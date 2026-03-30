"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Check } from "lucide-react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export interface CategoryNode {
  id: string;
  name: string;
  parent_id: string | null;
  children?: CategoryNode[];
}

interface CategoryTreeProps {
  nodes: CategoryNode[];
  selectedIds: string[];          // supports multi-select
  onToggle: (id: string) => void;
  multiSelect?: boolean;
  className?: string;
}

// ─────────────────────────────────────────────
// NODE COMPONENT (recursive)
// ─────────────────────────────────────────────
function TreeNode({
  node,
  selectedIds,
  onToggle,
  depth = 0,
  multiSelect = true,
}: {
  node: CategoryNode;
  selectedIds: string[];
  onToggle: (id: string) => void;
  depth?: number;
  multiSelect?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected  = selectedIds.includes(node.id);

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all select-none ${
          isSelected
            ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
            : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
        }`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={() => onToggle(node.id)}
      >
        {/* Expand arrow */}
        {hasChildren ? (
          <button
            onClick={e => { e.stopPropagation(); setOpen(!open); }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 flex-shrink-0"
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}

        {/* Folder icon */}
        {open && hasChildren
          ? <FolderOpen size={15} className="flex-shrink-0 text-amber-500" />
          : <Folder size={15} className={`flex-shrink-0 ${isSelected ? "text-violet-500" : "text-gray-400"}`} />
        }

        {/* Name */}
        <span className="text-sm font-medium flex-1 truncate">{node.name}</span>

        {/* Checkmark */}
        {isSelected && (
          <Check size={14} className="flex-shrink-0 text-violet-600" />
        )}
      </div>

      {/* Children */}
      {open && hasChildren && (
        <div>
          {node.children!.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
              depth={depth + 1}
              multiSelect={multiSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export function CategoryTree({
  nodes,
  selectedIds,
  onToggle,
  multiSelect = true,
  className = "",
}: CategoryTreeProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-gray-400 italic">
        Aucune catégorie disponible
      </div>
    );
  }

  return (
    <div className={`space-y-0.5 ${className}`}>
      {nodes.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          selectedIds={selectedIds}
          onToggle={onToggle}
          depth={0}
          multiSelect={multiSelect}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// FLAT CATEGORY UTILS
// ─────────────────────────────────────────────

/** Build tree structure from flat list */
export function buildCategoryTree(flat: { id: string; name: string; parent_id: string | null }[]): CategoryNode[] {
  const map: Record<string, CategoryNode> = {};
  const roots: CategoryNode[] = [];

  flat.forEach(item => { map[item.id] = { ...item, children: [] }; });
  flat.forEach(item => {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].children!.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });
  return roots;
}
