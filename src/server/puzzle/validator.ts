import { checkConstraintFull } from "~/server/puzzle/constraints";
import type {
	ConstraintStatus,
	PuzzleDefinition,
	ValidationResult,
} from "~/server/puzzle/schema";
import { computeScore, computeWooMeter } from "~/server/puzzle/scoring";

const DEFAULT_HINT =
	"Reorder your chain to satisfy hard rules first, then optimize score with preferred cards.";

const buildCardsById = (puzzle: PuzzleDefinition) =>
	new Map(puzzle.cards.map((card) => [card.id, card] as const));

export const validateChain = (
	puzzle: PuzzleDefinition,
	submittedChain: string[],
): ValidationResult => {
	const cardsById = buildCardsById(puzzle);
	const unknownCardIds = submittedChain.filter(
		(cardId) => !cardsById.has(cardId),
	);

	const lengthOk = submittedChain.length === puzzle.chainLength;
	const duplicateViolation =
		!puzzle.allowRepeatedCards &&
		new Set(submittedChain).size !== submittedChain.length;

	const constraintStatuses: ConstraintStatus[] = [];
	for (const constraint of puzzle.constraints) {
		const result = checkConstraintFull(constraint, submittedChain, cardsById);
		constraintStatuses.push({
			constraintType: constraint.type,
			message: constraint.message,
			passed: result.valid,
			triggerIndex: result.triggerIndex,
		});
	}

	const violatedByConstraints = constraintStatuses.filter(
		(status) => !status.passed,
	);
	const satisfied = constraintStatuses
		.filter((status) => status.passed)
		.map((status) => status.message);
	const violations = violatedByConstraints.map((status) => status.message);

	if (!lengthOk) {
		violations.unshift(
			`Chain length mismatch: expected ${puzzle.chainLength}, got ${submittedChain.length}.`,
		);
	}

	if (duplicateViolation) {
		violations.unshift(
			"Duplicate card selection is not allowed for this puzzle instance.",
		);
	}

	if (unknownCardIds.length > 0) {
		violations.unshift(
			`Unknown card IDs in chain: ${unknownCardIds.join(", ")}. Please rebuild the chain from available cards.`,
		);
	}

	const firstFailureIndex =
		constraintStatuses.find((status) => !status.passed)?.triggerIndex ?? null;

	const score = computeScore(submittedChain, puzzle, cardsById);
	const failedChecks =
		violatedByConstraints.length +
		(lengthOk ? 0 : 1) +
		(duplicateViolation ? 1 : 0) +
		(unknownCardIds.length > 0 ? 1 : 0);
	const totalChecks = puzzle.constraints.length + 3;
	const wooMeter = computeWooMeter(failedChecks, totalChecks);
	const valid =
		lengthOk &&
		!duplicateViolation &&
		unknownCardIds.length === 0 &&
		violations.length === 0;

	let hint = DEFAULT_HINT;
	if (violatedByConstraints.length > 0) {
		hint = `Focus on this first: ${violatedByConstraints[0]?.message}`;
	} else if (!lengthOk) {
		hint = `Pick exactly ${puzzle.chainLength} cards.`;
	} else if (duplicateViolation) {
		hint = "Use each card at most once for this puzzle.";
	}

	return {
		valid,
		score,
		wooMeter,
		lengthOk,
		duplicateViolation,
		unknownCardIds,
		firstFailureIndex,
		satisfied,
		violations,
		constraintStatuses,
		hint,
	};
};
