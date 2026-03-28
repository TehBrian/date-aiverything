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

export const computeWooMeter = (
	violationCount: number,
	totalChecks: number,
): number => {
	if (violationCount <= 0) {
		return 100;
	}

	// Linear scaling by failed-check ratio; only solved chains can show 100%.
	const solvedRatio = 1 - violationCount / Math.max(totalChecks, 1);
	return Math.round(clamp(solvedRatio * 100, 0, 99));
};
