import type {
	Constraint,
	PuzzleCard,
	PuzzleDefinition,
} from "~/server/puzzle/schema";

type ConstraintCheckResult = {
	valid: boolean;
	triggerIndex: number | null;
};

const findFirstAdjacentMatch = (
	chain: string[],
	a: string,
	b: string,
): number | null => {
	for (let i = 0; i < chain.length - 1; i += 1) {
		const left = chain[i];
		const right = chain[i + 1];
		if ((left === a && right === b) || (left === b && right === a)) {
			return i + 1;
		}
	}
	return null;
};

const countByCategory = (
	chain: string[],
	cardsById: Map<string, PuzzleCard>,
) => {
	const counts = new Map<string, number>();
	for (const cardId of chain) {
		const category = cardsById.get(cardId)?.category;
		if (!category) continue;
		counts.set(category, (counts.get(category) ?? 0) + 1);
	}
	return counts;
};

export const checkConstraintPartial = (
	constraint: Constraint,
	partialChain: string[],
	puzzle: PuzzleDefinition,
	cardsById: Map<string, PuzzleCard>,
): ConstraintCheckResult => {
	switch (constraint.type) {
		case "before": {
			const firstIndex = partialChain.indexOf(constraint.firstCardId);
			const secondIndex = partialChain.indexOf(constraint.secondCardId);
			if (
				secondIndex !== -1 &&
				(firstIndex === -1 || firstIndex > secondIndex)
			) {
				return { valid: false, triggerIndex: secondIndex };
			}
			return { valid: true, triggerIndex: null };
		}
		case "not_adjacent": {
			const idx = findFirstAdjacentMatch(
				partialChain,
				constraint.cardAId,
				constraint.cardBId,
			);
			if (idx !== null) return { valid: false, triggerIndex: idx };
			return { valid: true, triggerIndex: null };
		}
		case "at_least_one_category": {
			const counts = countByCategory(partialChain, cardsById);
			const current = counts.get(constraint.category) ?? 0;
			const remainingSlots = puzzle.chainLength - partialChain.length;
			if (current + remainingSlots < constraint.minCount) {
				return { valid: false, triggerIndex: partialChain.length - 1 };
			}
			return { valid: true, triggerIndex: null };
		}
		case "exactly_one_category": {
			const counts = countByCategory(partialChain, cardsById);
			const current = counts.get(constraint.category) ?? 0;
			if (current > 1)
				return { valid: false, triggerIndex: partialChain.length - 1 };
			return { valid: true, triggerIndex: null };
		}
		case "max_category_count": {
			const counts = countByCategory(partialChain, cardsById);
			const current = counts.get(constraint.category) ?? 0;
			if (current > constraint.maxCount) {
				return { valid: false, triggerIndex: partialChain.length - 1 };
			}
			return { valid: true, triggerIndex: null };
		}
		case "not_first": {
			if (partialChain.length > 0 && partialChain[0] === constraint.cardId) {
				return { valid: false, triggerIndex: 0 };
			}
			return { valid: true, triggerIndex: null };
		}
		case "if_then_in_sequence": {
			const ifPositions = partialChain
				.map((cardId, index) => ({ cardId, index }))
				.filter((entry) => entry.cardId === constraint.ifCardId)
				.map((entry) => entry.index);
			if (ifPositions.length === 0) return { valid: true, triggerIndex: null };

			const thenPositions = partialChain
				.map((cardId, index) => ({ cardId, index }))
				.filter((entry) => entry.cardId === constraint.thenCardId)
				.map((entry) => entry.index);

			const lastIf = ifPositions.at(-1) ?? -1;
			const hasThenAfterLastIf = thenPositions.some((idx) => idx > lastIf);
			const remainingSlots = puzzle.chainLength - partialChain.length;

			if (!hasThenAfterLastIf && remainingSlots === 0) {
				return { valid: false, triggerIndex: lastIf };
			}

			return { valid: true, triggerIndex: null };
		}
	}
};

export const checkConstraintFull = (
	constraint: Constraint,
	chain: string[],
	cardsById: Map<string, PuzzleCard>,
): ConstraintCheckResult => {
	switch (constraint.type) {
		case "before": {
			const firstIndex = chain.indexOf(constraint.firstCardId);
			const secondIndex = chain.indexOf(constraint.secondCardId);
			if (
				secondIndex !== -1 &&
				(firstIndex === -1 || firstIndex > secondIndex)
			) {
				return { valid: false, triggerIndex: secondIndex };
			}
			return { valid: true, triggerIndex: null };
		}
		case "not_adjacent": {
			const idx = findFirstAdjacentMatch(
				chain,
				constraint.cardAId,
				constraint.cardBId,
			);
			if (idx !== null) return { valid: false, triggerIndex: idx };
			return { valid: true, triggerIndex: null };
		}
		case "at_least_one_category": {
			const counts = countByCategory(chain, cardsById);
			const count = counts.get(constraint.category) ?? 0;
			if (count < constraint.minCount) {
				return { valid: false, triggerIndex: chain.length - 1 };
			}
			return { valid: true, triggerIndex: null };
		}
		case "exactly_one_category": {
			const counts = countByCategory(chain, cardsById);
			const count = counts.get(constraint.category) ?? 0;
			if (count !== 1) return { valid: false, triggerIndex: chain.length - 1 };
			return { valid: true, triggerIndex: null };
		}
		case "max_category_count": {
			const counts = countByCategory(chain, cardsById);
			const count = counts.get(constraint.category) ?? 0;
			if (count > constraint.maxCount) {
				return { valid: false, triggerIndex: chain.length - 1 };
			}
			return { valid: true, triggerIndex: null };
		}
		case "not_first": {
			if (chain.length > 0 && chain[0] === constraint.cardId) {
				return { valid: false, triggerIndex: 0 };
			}
			return { valid: true, triggerIndex: null };
		}
		case "if_then_in_sequence": {
			const ifPositions = chain
				.map((cardId, index) => ({ cardId, index }))
				.filter((entry) => entry.cardId === constraint.ifCardId)
				.map((entry) => entry.index);
			if (ifPositions.length === 0) return { valid: true, triggerIndex: null };
			for (const ifPos of ifPositions) {
				const hasThenAfter = chain.some(
					(cardId, index) => cardId === constraint.thenCardId && index > ifPos,
				);
				if (!hasThenAfter) {
					return { valid: false, triggerIndex: ifPos };
				}
			}
			return { valid: true, triggerIndex: null };
		}
	}
};

export const hasPartialViolations = (
	partialChain: string[],
	puzzle: PuzzleDefinition,
	cardsById: Map<string, PuzzleCard>,
): boolean => {
	// This prefix check is the key pruning hook used by recursive backtracking.
	for (const constraint of puzzle.constraints) {
		const check = checkConstraintPartial(
			constraint,
			partialChain,
			puzzle,
			cardsById,
		);
		if (!check.valid) return true;
	}
	return false;
};
