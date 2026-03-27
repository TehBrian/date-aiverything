import type { PuzzleDefinition } from "~/server/puzzle";

type ChainBuilderProps = {
	puzzle: PuzzleDefinition;
	chain: string[];
	onAddCard: (cardId: string) => void;
	onRemoveCard: (index: number) => void;
	onMoveLeft: (index: number) => void;
	onMoveRight: (index: number) => void;
	onReset: () => void;
	onValidate: () => void;
	onSolve: () => void;
	isValidating: boolean;
	isSolving: boolean;
};

export function ChainBuilder({
	puzzle,
	chain,
	onAddCard,
	onRemoveCard,
	onMoveLeft,
	onMoveRight,
	onReset,
	onValidate,
	onSolve,
	isValidating,
	isSolving,
}: ChainBuilderProps) {
	const chainFull = chain.length >= puzzle.chainLength;
	const occurrenceByCard = new Map<string, number>();

	return (
		<section className="space-y-4 rounded-3xl border border-white/15 bg-black/30 p-5">
			<h3 className="font-semibold text-white text-xl">
				3) Build Your Conversation Chain
			</h3>
			<p className="text-slate-300 text-sm">
				Target length: {puzzle.chainLength}.{" "}
				{puzzle.allowRepeatedCards
					? "Repeats allowed."
					: "No duplicate cards allowed."}
			</p>

			<div>
				<h4 className="mb-2 font-medium text-slate-100 text-sm">
					Available Cards
				</h4>
				<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
					{puzzle.cards.map((card) => {
						const alreadyUsed = chain.includes(card.id);
						const disabled =
							chainFull || (!puzzle.allowRepeatedCards && alreadyUsed);
						return (
							<button
								className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-slate-100 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
								disabled={disabled}
								key={card.id}
								onClick={() => onAddCard(card.id)}
								type="button"
							>
								<p className="font-medium">{card.label}</p>
								<p className="text-slate-300 text-xs">
									{card.category} · base {card.baseScore} ·{" "}
									{card.tags.join(", ") || "no tags"}
								</p>
							</button>
						);
					})}
				</div>
			</div>

			<div>
				<h4 className="mb-2 font-medium text-slate-100 text-sm">
					Selected Chain
				</h4>
				{chain.length === 0 ? (
					<p className="rounded-xl border border-white/20 border-dashed p-3 text-slate-300 text-sm">
						Pick cards to build your sequence.
					</p>
				) : (
					<ul className="space-y-2">
						{chain.map((cardId, index) => {
							const occurrence = (occurrenceByCard.get(cardId) ?? 0) + 1;
							occurrenceByCard.set(cardId, occurrence);
							const card = puzzle.cards.find((entry) => entry.id === cardId);
							return (
								<li
									className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
									key={`${cardId}-${occurrence}`}
								>
									<div>
										<p className="text-slate-100 text-sm">
											#{index + 1} {card?.label ?? cardId}
										</p>
										<p className="text-slate-300 text-xs">
											{card?.category ?? "unknown"}
										</p>
									</div>
									<div className="flex gap-2 text-xs">
										<button
											className="rounded-lg border border-white/20 px-2 py-1 text-slate-200 disabled:opacity-40"
											disabled={index === 0}
											onClick={() => onMoveLeft(index)}
											type="button"
										>
											←
										</button>
										<button
											className="rounded-lg border border-white/20 px-2 py-1 text-slate-200 disabled:opacity-40"
											disabled={index === chain.length - 1}
											onClick={() => onMoveRight(index)}
											type="button"
										>
											→
										</button>
										<button
											className="rounded-lg border border-white/20 px-2 py-1 text-slate-200"
											onClick={() => onRemoveCard(index)}
											type="button"
										>
											Remove
										</button>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>

			<div className="flex flex-wrap gap-2">
				<button
					className="rounded-full bg-emerald-300 px-4 py-2 font-semibold text-slate-900 disabled:opacity-50"
					disabled={isValidating}
					onClick={onValidate}
					type="button"
				>
					{isValidating ? "Validating..." : "Validate Chain"}
				</button>
				<button
					className="rounded-full bg-sky-300 px-4 py-2 font-semibold text-slate-900 disabled:opacity-50"
					disabled={isSolving}
					onClick={onSolve}
					type="button"
				>
					{isSolving ? "Solving..." : "Solve with Backtracking"}
				</button>
				<button
					className="rounded-full border border-white/20 px-4 py-2 font-semibold text-slate-100"
					onClick={onReset}
					type="button"
				>
					Reset
				</button>
			</div>
		</section>
	);
}
