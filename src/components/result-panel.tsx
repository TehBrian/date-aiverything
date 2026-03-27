import { WooMeter } from "~/components/woo-meter";
import type { SolveResult, ValidationResult } from "~/server/puzzle";

type ResultPanelProps = {
	validation: ValidationResult | null;
	solveResult: (SolveResult & { summary: string; hasSolution: boolean }) | null;
};

export function ResultPanel({ validation, solveResult }: ResultPanelProps) {
	return (
		<section className="space-y-4 rounded-3xl border border-white/15 bg-black/30 p-5">
			<h3 className="font-semibold text-white text-xl">4) Results</h3>
			{validation ? (
				<>
					<div
						className={`rounded-2xl border p-3 text-sm ${
							validation.valid
								? "border-emerald-400/50 bg-emerald-500/10 text-emerald-100"
								: "border-rose-400/50 bg-rose-500/10 text-rose-100"
						}`}
					>
						{validation.valid
							? "Your chain is valid. The object is charmed."
							: "Your chain violates one or more constraints."}
					</div>
					<WooMeter score={validation.score} value={validation.wooMeter} />
					<div className="grid gap-3 md:grid-cols-2">
						<div>
							<h4 className="font-medium text-emerald-200 text-sm">
								Satisfied
							</h4>
							<ul className="mt-2 space-y-1 text-slate-100 text-sm">
								{validation.satisfied.length > 0 ? (
									validation.satisfied.map((item) => (
										<li key={item}>• {item}</li>
									))
								) : (
									<li className="text-slate-300">
										No satisfied constraints yet.
									</li>
								)}
							</ul>
						</div>
						<div>
							<h4 className="font-medium text-rose-200 text-sm">Failed</h4>
							<ul className="mt-2 space-y-1 text-slate-100 text-sm">
								{validation.violations.length > 0 ? (
									validation.violations.map((item) => (
										<li key={item}>• {item}</li>
									))
								) : (
									<li className="text-slate-300">No failures.</li>
								)}
							</ul>
						</div>
					</div>
					<p className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-200 text-sm">
						Hint: {validation.hint}
					</p>
				</>
			) : (
				<p className="text-slate-300 text-sm">
					Validate a chain to see detailed feedback and woo meter.
				</p>
			)}

			{solveResult ? (
				<div className="space-y-3 rounded-2xl border border-sky-400/40 bg-sky-500/10 p-4">
					<h4 className="font-medium text-sky-100">Solver Diagnostics</h4>
					<p className="text-slate-100 text-sm">{solveResult.summary}</p>
					<ul className="text-slate-100 text-sm">
						<li>Nodes explored: {solveResult.diagnostics.nodesExplored}</li>
						<li>Branches pruned: {solveResult.diagnostics.branchesPruned}</li>
						<li>
							Total valid solutions:{" "}
							{solveResult.diagnostics.totalValidSolutions}
						</li>
						<li>
							Pruning occurred:{" "}
							{solveResult.diagnostics.pruningOccurred ? "Yes" : "No"}
						</li>
						<li>Best score: {solveResult.bestScore ?? "N/A"}</li>
					</ul>
					{solveResult.bestChain ? (
						<p className="text-slate-100 text-sm">
							Optimal chain: {solveResult.bestChain.join(" → ")}
						</p>
					) : (
						<p className="text-rose-100 text-sm">
							No valid chain exists for this puzzle instance.
						</p>
					)}
				</div>
			) : null}
		</section>
	);
}
