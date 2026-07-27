/**
 * Files subcomponents barrel (PLAN-009 / FL2).
 *
 * The Files page (`pages/files.tsx`) imports only from here so the individual
 * components stay swappable and the import surface is small.
 */
export { FileCard } from "./FileCard";
export type { FileCardProps } from "./FileCard";
export { FileDrawer } from "./FileDrawer";
export type { FileDrawerProps } from "./FileDrawer";
export { CreateFileModal } from "./CreateFileModal";
export type { CreateFileModalProps } from "./CreateFileModal";
