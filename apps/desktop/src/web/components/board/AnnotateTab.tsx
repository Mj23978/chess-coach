/**
 * AnnotateTab — annotation controls for game review.
 *
 * Features:
 *   - Bookmark moves (★ flag) to mark critical positions
 *   - Add text comments to the current position
 *   - Mark positions as "critical" or "interesting"
 *
 * Annotations are stored in component state for now (not persisted to DB).
 * Future: store in a `game_annotations` table linked to game ID + ply index.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Bookmark,
  MessageSquare,
  Star,
  AlertTriangle,
  Lightbulb,
  Trash2,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";

export interface AnnotateTabProps {
  pgn: string;
  ply: number;
  onAnnotationChange?: () => void;
}

export interface Annotation {
  bookmark?: boolean;
  comment?: string;
  mark?: "critical" | "interesting";
}

export type Annotations = Record<number, Annotation>;

/** Storage key for annotations (per-game, keyed by PGN hash). */
function annotationsKey(pgn: string): string {
  // Simple hash — not cryptographically secure, just a stable key.
  let hash = 0;
  for (let i = 0; i < pgn.length; i++) {
    hash = ((hash << 5) - hash + pgn.charCodeAt(i)) | 0;
  }
  return `chess-coach:annotations:${hash.toString(36)}`;
}

function loadAnnotations(pgn: string): Annotations {
  try {
    const raw = localStorage.getItem(annotationsKey(pgn));
    return raw ? (JSON.parse(raw) as Annotations) : {};
  } catch {
    return {};
  }
}

function saveAnnotations(pgn: string, ann: Annotations): void {
  try {
    localStorage.setItem(annotationsKey(pgn), JSON.stringify(ann));
  } catch {
    // localStorage full or unavailable — silently drop.
  }
}

export function AnnotateTab({ pgn, ply, onAnnotationChange }: AnnotateTabProps) {
  const [annotations, setAnnotations] = useState<Annotations>(() =>
    loadAnnotations(pgn),
  );
  const [commentDraft, setCommentDraft] = useState("");

  // Reload from localStorage when PGN changes.
  useEffect(() => {
    setAnnotations(loadAnnotations(pgn));
  }, [pgn]);

  // Sync comment draft when ply changes.
  useEffect(() => {
    setCommentDraft(annotations[ply]?.comment ?? "");
  }, [ply, annotations]);

  const current: Annotation | undefined = annotations[ply];
  const isBookmarked = current?.bookmark ?? false;
  const mark = current?.mark ?? null;

  const update = useCallback(
    (patch: Partial<Annotation>) => {
      setAnnotations((prev) => {
        const next = { ...prev };
        const existing = next[ply] ?? {};
        next[ply] = { ...existing, ...patch };
        // Clean up empty entries.
        if (!next[ply].bookmark && !next[ply].comment && !next[ply].mark) {
          delete next[ply];
        }
        return next;
      });
      onAnnotationChange?.();
    },
    [ply, onAnnotationChange],
  );

  // Persist whenever annotations change.
  useEffect(() => {
    saveAnnotations(pgn, annotations);
  }, [pgn, annotations]);

  const applyComment = useCallback(() => {
    update({ comment: commentDraft.trim() || undefined });
  }, [commentDraft, update]);

  return (
    <div className="space-y-4">
      {/* Bookmark */}
      <Section title="Bookmark">
        <Button
          variant={isBookmarked ? "default" : "outline"}
          size="sm"
          onClick={() => update({ bookmark: !isBookmarked })}
          className="w-full"
        >
          <Bookmark
            className={cn("mr-1.5 size-4", isBookmarked && "fill-current")}
          />
          {isBookmarked ? "Bookmarked" : "Bookmark this move"}
        </Button>
      </Section>

      {/* Marks */}
      <Section title="Mark Position">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={mark === "critical" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              update({ mark: mark === "critical" ? undefined : "critical" })
            }
          >
            <AlertTriangle className="mr-1 size-3.5" />
            Critical
          </Button>
          <Button
            variant={mark === "interesting" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              update({
                mark: mark === "interesting" ? undefined : "interesting",
              })
            }
          >
            <Lightbulb className="mr-1 size-3.5" />
            Interesting
          </Button>
        </div>
        {mark && (
          <p className="mt-1 text-xs text-neutral-500">
            Current mark:{" "}
            <span className="font-medium capitalize">{mark}</span>
          </p>
        )}
      </Section>

      {/* Comment */}
      <Section title="Comment">
        <div className="space-y-2">
          <Textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            onBlur={applyComment}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                applyComment();
              }
            }}
            placeholder="Add a note about this position…"
            className="min-h-[80px] text-xs"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400">
              ⌘/Ctrl+Enter to save
            </span>
            {current?.comment && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => update({ comment: undefined })}
                className="h-6 px-2 text-[10px] text-neutral-500"
              >
                <Trash2 className="mr-1 size-3" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </Section>

      {/* Annotation summary */}
      <Section title="Summary">
        <AnnotationSummary annotations={annotations} />
      </Section>
    </div>
  );
}

function AnnotationSummary({ annotations }: { annotations: Annotations }) {
  const entries = Object.entries(annotations);
  if (entries.length === 0) {
    return (
      <p className="text-xs text-neutral-500">
        No annotations yet. Bookmark moves, mark critical positions, or add
        comments to build your analysis.
      </p>
    );
  }

  const bookmarked = entries.filter(([, a]) => a.bookmark).length;
  const commented = entries.filter(([, a]) => a.comment).length;
  const critical = entries.filter(([, a]) => a.mark === "critical").length;
  const interesting = entries.filter(([, a]) => a.mark === "interesting").length;

  return (
    <div className="flex flex-wrap gap-3 text-xs text-neutral-600">
      {bookmarked > 0 && (
        <span className="flex items-center gap-1">
          <Bookmark className="size-3" />
          {bookmarked}
        </span>
      )}
      {commented > 0 && (
        <span className="flex items-center gap-1">
          <MessageSquare className="size-3" />
          {commented}
        </span>
      )}
      {critical > 0 && (
        <span className="flex items-center gap-1">
          <AlertTriangle className="size-3 text-amber-500" />
          {critical}
        </span>
      )}
      {interesting > 0 && (
        <span className="flex items-center gap-1">
          <Lightbulb className="size-3 text-blue-500" />
          {interesting}
        </span>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">
        {title}
      </h3>
      {children}
    </div>
  );
}
