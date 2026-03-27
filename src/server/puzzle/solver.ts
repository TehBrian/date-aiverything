import { hasPartialViolations } from "~/server/puzzle/constraints";
import type {
	PuzzleCard,
	PuzzleDefinition,
	SolveResult,
	SolverDiagnostics,
} from "~/server/puzzle/schema";
import { computeScore } from "~/server/puzzle/scoring";
import { validateChain } from "~/server/puzzle/validator";

const buildCardsById = (puzzle: PuzzleDefinition) =>
	new Map(puzzle.cards.map((card) => [card.id, card] as const));

const nextCandidates = (
	puzzle: PuzzleDefinition,
	cards: PuzzleCard[],
	chain: string[],
): PuzzleCard[] => {
	if (puzzle.allowRepeatedCards) return cards;
	const used = new Set(chain);
	return cards.filter((card) => !used.has(card.id));
};

export const solvePuzzleWithBacktracking = (
	puzzle: PuzzleDefinition,
	options?: { includeAllValidSolutions?: boolean; maxStoredSolutions?: number },
): SolveResult => {
	const cardsById = buildCardsById(puzzle);
	const includeAll = options?.includeAllValidSolutions ?? true;
	const maxStoredSolutions = options?.maxStoredSolutions ?? 200;

	let bestScore: number | null = null;
	let bestChain: string[] | null = null;
	let anyValidChain: string[] | null = null;
	const allValidSolutions: string[][] = [];

	const diagnostics: SolverDiagnostics = {
		nodesExplored: 0,
		branchesPruned: 0,
		totalValidSolutions: 0,
		pruningOccurred: false,
		bestScore: null,
	};

	const recurse = (chain: string[]) => {
		diagnostics.nodesExplored += 1;

		// Early rejection of invalid prefixes dramatically shrinks the search tree.
		if (hasPartialViolations(chain, puzzle, cardsById)) {
			diagnostics.branchesPruned += 1;
			diagnostics.pruningOccurred = true;
			return;
		}

		if (chain.length === puzzle.chainLength) {
			// Only full-length chains are scored and considered candidate solutions.
			const validation = validateChain(puzzle, chain);
			if (!validation.valid) {
				return;
			}

			diagnostics.totalValidSolutions += 1;
			const score = computeScore(chain, puzzle, cardsById);
			if (!anyValidChain) {
				anyValidChain = [...chain];
			}
			if (includeAll && allValidSolutions.length < maxStoredSolutions) {
				allValidSolutions.push([...chain]);
			}
			if (bestScore === null || score > bestScore) {
				bestScore = score;
				bestChain = [...chain];
				diagnostics.bestScore = score;
			}
			return;
		}

		const candidates = nextCandidates(puzzle, puzzle.cards, chain);
		for (const candidate of candidates) {
			recurse([...chain, candidate.id]);
		}
	};

	recurse([]);

	return {
		bestChain,
		bestScore,
		anyValidChain,
		allValidSolutions,
		diagnostics,
	};
};
