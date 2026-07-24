/**
 * UCI engine option types — shared between API and DB schema.
 *
 * These types describe the UCI options an engine exposes (name, type, default,
 * min/max for spin, choices for combo). Used in the engine configuration UI
 * and stored in the engines table's `options` JSON column.
 */

export type UciOptionType = "check" | "spin" | "combo" | "string" | "button" | "filename";

export interface UciOption {
  name: string;
  type: UciOptionType;
  default?: string | number | boolean;
  min?: number;
  max?: number;
  /** For combo type: list of allowed values. */
  vars?: string[];
  /** Current value set by the user. */
  value?: string | number | boolean;
}

export interface UciOptionWithValue extends UciOption {
  value: string | number | boolean;
}
