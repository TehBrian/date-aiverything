import type { Constraint } from "~/server/puzzle";

type ConstraintListProps = {
	constraints: Constraint[];
};

export function ConstraintList({ constraints }: ConstraintListProps) {
	return (
		<section className="rounded-3xl border border-white/15 bg-black/30 p-5">
			<h3 className="font-semibold text-lg text-white">Hard Rules</h3>
			<p className="mt-1 text-slate-300 text-sm">
				These constraints are deterministic and evaluated server-side.
			</p>
			<ul className="mt-4 space-y-2 text-slate-100 text-sm">
				{constraints.map((constraint) => (
					<li
						className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
						key={`${constraint.type}-${constraint.message}`}
					>
						{constraint.message}
					</li>
				))}
			</ul>
		</section>
	);
}
