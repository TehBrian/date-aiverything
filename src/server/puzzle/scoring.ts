import type { PuzzleCard, PuzzleDefinition } from "~/server/puzzle/schema";

const clamp = (value: number, min: number, max: number) =>
	Math.max(min, Math.min(max, value));

export const computeScore = (
	chain: string[],
	puzzle: PuzzleDefinition,
	cardsById: Map<string, PuzzleCard>,
): number => {
	let score = 0;

	for (const cardId of chain) {
		score += cardsById.get(cardId)?.baseScore ?? 0;
	}

	for (const preferredCardId of puzzle.scoring.preferredCardIds) {
		if (chain.includes(preferredCardId)) score += 2;
	}

	for (const preferredCategory of puzzle.scoring.preferredCategories) {
		const hasCategory = chain.some(
			(cardId) => cardsById.get(cardId)?.category === preferredCategory,
		);
		if (hasCategory) score += 2;
	}

	for (const pairBonus of puzzle.scoring.pairBonuses) {
		const firstIndex = chain.indexOf(pairBonus.firstCardId);
		const secondIndex = chain.indexOf(pairBonus.secondCardId);
		if (firstIndex !== -1 && secondIndex !== -1 && firstIndex < secondIndex) {
			score += pairBonus.bonus;
		}
	}

	for (const penalty of puzzle.scoring.penalties) {
		const count = chain.filter((cardId) => cardId === penalty.cardId).length;
		if (count > 0) {
			score -= penalty.penalty * count;
		}
	}

	return score;
};

export const computeWooMeter = (score: number): number => {
	// Normalizes score into a playful 0-100 meter for UI display.
	return Math.round(clamp(50 + score * 4, 0, 100));
};
