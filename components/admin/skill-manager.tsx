"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { SingleResponse } from "@/lib/response";
import { ConfirmDialog } from "./confirm-dialog";

interface Item {
  id: string;
  name: string;
}

interface Props {
  /** Display title e.g. "Skills" or "Primary Skills" */
  title: string;
  /** Base API endpoint e.g. "/api/admin/skills" */
  endpoint: string;
}

export function SkillManager({ title, endpoint }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add new
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Inline rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delete confirm
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<SingleResponse<Item[]>>(endpoint);
      setItems(res.data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearchQuery(searchInput), 500);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchInput]);

  const filteredItems = searchQuery
    ? items.filter((it) => it.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setAddError(null);
    setAdding(true);
    try {
      const res = await apiClient.post<SingleResponse<Item>>(endpoint, { name });
      setItems((prev) => [...prev, res.data]);
      setNewName("");
    } catch (err) {
      setAddError(
        err instanceof ApiClientError ? err.message : "Failed to add.",
      );
    } finally {
      setAdding(false);
    }
  };

  const startRename = (item: Item) => {
    setRenamingId(item.id);
    setRenameValue(item.name);
    setRenameError(null);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
    setRenameError(null);
  };

  const handleRename = async (id: string) => {
    const name = renameValue.trim();
    if (!name) return;

    setRenameError(null);
    setRenaming(true);
    try {
      const res = await apiClient.put<SingleResponse<Item>>(
        `${endpoint}/${id}`,
        { name },
      );
      setItems((prev) => prev.map((it) => (it.id === id ? res.data : it)));
      setRenamingId(null);
    } catch (err) {
      setRenameError(
        err instanceof ApiClientError ? err.message : "Failed to rename.",
      );
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`${endpoint}/${deletingItem.id}`);
      setItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
      setDeletingItem(null);
    } catch {
      // nothing — keep dialog open
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-xl">
        {/* Add form */}
        <form
          onSubmit={handleAdd}
          className="flex gap-0 border border-[var(--color-border)] mb-2"
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`Add new ${title.toLowerCase().replace(/s$/, "")}…`}
            disabled={adding}
            className="flex-1 px-4 py-3 text-sm bg-[var(--color-background)] focus:outline-none placeholder:text-[var(--color-muted)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="px-6 py-3 text-sm font-medium border-l border-[var(--color-border)] bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-80 transition-opacity disabled:opacity-50 whitespace-nowrap"
          >
            {adding ? "Adding…" : "+ Add"}
          </button>
        </form>
        {addError && (
          <p className="text-xs font-mono text-[var(--color-accent)] mb-4">
            {addError}
          </p>
        )}

        {/* Search */}
        <div className="mb-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}…`}
            className="w-full border border-[var(--color-border-light)] px-4 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none placeholder:text-[var(--color-muted)]"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="border border-[var(--color-border-light)] divide-y divide-[var(--color-border-light)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-3 animate-pulse">
                <div className="h-4 bg-[var(--color-muted-bg)] w-48" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="border border-[var(--color-accent)] px-5 py-4">
            <p className="text-sm font-mono text-[var(--color-accent)]">{error}</p>
            <button onClick={load} className="mt-1 text-xs underline">
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="border border-[var(--color-border-light)] px-5 py-10 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              No {title.toLowerCase()} yet. Add one above.
            </p>
          </div>
        ) : (
          <div className="border border-[var(--color-border-light)] divide-y divide-[var(--color-border-light)]">
            {filteredItems.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[var(--color-muted)]">
                No {title.toLowerCase()} match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : filteredItems.map((item, idx) =>
              renamingId === item.id ? (
                <div
                  key={item.id}
                  className="flex items-center gap-0 bg-[var(--color-muted-bg)]"
                >
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(item.id);
                      if (e.key === "Escape") cancelRename();
                    }}
                    autoFocus
                    disabled={renaming}
                    className="flex-1 px-5 py-3 text-sm bg-transparent focus:outline-none disabled:opacity-50"
                  />
                  {renameError && (
                    <span className="text-xs font-mono text-[var(--color-accent)] px-3">
                      {renameError}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRename(item.id)}
                    disabled={renaming}
                    className="px-4 py-3 text-xs font-mono border-l border-[var(--color-border-light)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors disabled:opacity-50"
                  >
                    {renaming ? "…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelRename}
                    disabled={renaming}
                    className="px-4 py-3 text-xs font-mono border-l border-[var(--color-border-light)] hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[var(--color-muted-bg)] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-[var(--color-muted)] w-6 text-right shrink-0">{idx + 1}</span>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="flex gap-0 border border-[var(--color-border-light)]">
                    <button
                      type="button"
                      onClick={() => startRename(item)}
                      className="px-4 py-1.5 text-xs font-mono border-r border-[var(--color-border-light)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingItem(item)}
                      className="px-4 py-1.5 text-xs font-mono hover:bg-[var(--color-accent)] hover:text-white transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        <p className="mt-3 text-xs font-mono text-[var(--color-muted)]">
          {searchQuery ? `${filteredItems.length} of ` : ""}{items.length} {title.toLowerCase()}
        </p>
      </div>

      <ConfirmDialog
        open={!!deletingItem}
        title={`Delete ${title.replace(/s$/, "")}`}
        message={
          deletingItem
            ? `Delete "${deletingItem.name}"? This may affect existing talent records that reference it.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </>
  );
}
