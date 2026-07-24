/**
 * Files page — `/files`.
 *
 * Placeholder for file management UI.
 * Will be implemented in Phase 6 (Files Page).
 */
import { Link } from "react-router-dom";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { FolderOpen, Plus, Upload, FileText, BookOpen, Trophy, Puzzle } from "lucide-react";

export default function FilesPage() {
	return (
		<div className="mx-auto max-w-4xl p-8">
			<header className="mb-6 flex items-start justify-between">
				<div>
					<Link to="/" className="text-xs text-blue-600">
						← Dashboard
					</Link>
					<h1 className="mt-1 text-2xl font-bold">Files</h1>
					<p className="text-sm text-neutral-500">
						Import and organize your PGN files, repertoires, and puzzles.
					</p>
				</div>
				<Button size="sm">
					<Plus className="mr-1.5 size-4" />
					Add File
				</Button>
			</header>

			{/* File type cards */}
			<div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="cursor-pointer hover:border-blue-300 transition-colors">
					<CardContent className="flex items-center gap-3 py-4">
						<div className="rounded-lg bg-blue-100 p-2">
							<FileText className="size-5 text-blue-600" />
						</div>
						<div>
							<CardTitle className="text-sm">Games</CardTitle>
							<p className="text-xs text-neutral-500">0 files</p>
						</div>
					</CardContent>
				</Card>

				<Card className="cursor-pointer hover:border-emerald-300 transition-colors">
					<CardContent className="flex items-center gap-3 py-4">
						<div className="rounded-lg bg-emerald-100 p-2">
							<BookOpen className="size-5 text-emerald-600" />
						</div>
						<div>
							<CardTitle className="text-sm">Repertoires</CardTitle>
							<p className="text-xs text-neutral-500">0 files</p>
						</div>
					</CardContent>
				</Card>

				<Card className="cursor-pointer hover:border-amber-300 transition-colors">
					<CardContent className="flex items-center gap-3 py-4">
						<div className="rounded-lg bg-amber-100 p-2">
							<Trophy className="size-5 text-amber-600" />
						</div>
						<div>
							<CardTitle className="text-sm">Tournaments</CardTitle>
							<p className="text-xs text-neutral-500">0 files</p>
						</div>
					</CardContent>
				</Card>

				<Card className="cursor-pointer hover:border-purple-300 transition-colors">
					<CardContent className="flex items-center gap-3 py-4">
						<div className="rounded-lg bg-purple-100 p-2">
							<Puzzle className="size-5 text-purple-600" />
						</div>
						<div>
							<CardTitle className="text-sm">Puzzles</CardTitle>
							<p className="text-xs text-neutral-500">0 files</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Empty state */}
			<div className="rounded-lg border border-dashed border-neutral-300 p-12 text-center">
				<FolderOpen className="mx-auto mb-4 size-12 text-neutral-300" />
				<h3 className="mb-2 font-medium text-neutral-700">No files imported</h3>
				<p className="mb-4 text-sm text-neutral-500">
					Import PGN files to analyze your games, build repertoires, or study puzzles.
				</p>
				<Button size="sm">
					<Upload className="mr-1.5 size-4" />
					Import PGN
				</Button>
			</div>

			<div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center">
				<p className="text-neutral-500">
					Files page will be fully implemented in Phase 6.
				</p>
			</div>
		</div>
	);
}
