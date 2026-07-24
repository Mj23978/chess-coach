/**
 * Databases page — `/databases`.
 *
 * Placeholder for database management UI.
 * Will be implemented in Phase 5 (Databases Page).
 */
import { Link } from "react-router-dom";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Database, Plus, Search, Grid, List } from "lucide-react";

export default function DatabasesPage() {
	return (
		<div className="mx-auto max-w-4xl p-8">
			<header className="mb-6 flex items-start justify-between">
				<div>
					<Link to="/" className="text-xs text-blue-600">
						← Dashboard
					</Link>
					<h1 className="mt-1 text-2xl font-bold">Databases</h1>
					<p className="text-sm text-neutral-500">
						Organize your game collections and opening repertoires.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" size="sm">
						<Search className="mr-1.5 size-4" />
						Search
					</Button>
					<Button size="sm">
						<Plus className="mr-1.5 size-4" />
						New Database
					</Button>
				</div>
			</header>

			{/* View toggle placeholder */}
			<div className="mb-4 flex items-center justify-between">
				<div className="flex gap-1 rounded-lg border border-neutral-200 p-1">
					<button className="rounded bg-neutral-100 px-2 py-1 text-sm">
						<Grid className="size-4" />
					</button>
					<button className="rounded px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-50">
						<List className="size-4" />
					</button>
				</div>
				<span className="text-sm text-neutral-500">0 databases</span>
			</div>

			{/* Empty state */}
			<div className="rounded-lg border border-dashed border-neutral-300 p-12 text-center">
				<Database className="mx-auto mb-4 size-12 text-neutral-300" />
				<h3 className="mb-2 font-medium text-neutral-700">No databases yet</h3>
				<p className="mb-4 text-sm text-neutral-500">
					Create a database to organize your games by theme, opening, or event.
				</p>
				<Button size="sm">
					<Plus className="mr-1.5 size-4" />
					Create Database
				</Button>
			</div>

			<div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center">
				<p className="text-neutral-500">
					Databases page will be fully implemented in Phase 5.
				</p>
			</div>
		</div>
	);
}
