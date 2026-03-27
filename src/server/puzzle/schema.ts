import { z } from "zod";

export const puzzleCardSchema = z.object({
	id: z.string().min(1),
	label: z.string().min(1),
	category: z.string().min(1),
	tags: z.array(z.string()).default([]),
	baseScore: z.number().int().default(0),
});

const beforeConstraintSchema = z.object({
	type: z.literal("before"),
	firstCardId: z.string(),
	secondCardId: z.string(),
	message: z.string(),
});

const notAdjacentConstraintSchema = z.object({
	type: z.literal("not_adjacent"),
	cardAId: z.string(),
	cardBId: z.string(),
	message: z.string(),
});

const atLeastOneCategoryConstraintSchema = z.object({
	type: z.literal("at_least_one_category"),
	category: z.string(),
	minCount: z.number().int().positive().default(1),
	message: z.string(),
});

const exactlyOneCategoryConstraintSchema = z.object({
	type: z.literal("exactly_one_category"),
	category: z.string(),
	message: z.string(),
});

const maxCategoryCountConstraintSchema = z.object({
	type: z.literal("max_category_count"),
	category: z.string(),
	maxCount: z.number().int().nonnegative(),
	message: z.string(),
});

const notFirstConstraintSchema = z.object({
	type: z.literal("not_first"),
	cardId: z.string(),
	message: z.string(),
});

const ifThenInSequenceConstraintSchema = z.object({
	type: z.literal("if_then_in_sequence"),
	ifCardId: z.string(),
	thenCardId: z.string(),
	message: z.string(),
});

export const constraintSchema = z.discriminatedUnion("type", [
	beforeConstraintSchema,
	notAdjacentConstraintSchema,
	atLeastOneCategoryConstraintSchema,
	exactlyOneCategoryConstraintSchema,
	maxCategoryCountConstraintSchema,
	notFirstConstraintSchema,
	ifThenInSequenceConstraintSchema,
]);

export const scoringSchema = z.object({
	preferredCardIds: z.array(z.string()).default([]),
	preferredCategories: z.array(z.string()).default([]),
	pairBonuses: z
		.array(
			z.object({
				firstCardId: z.string(),
				secondCardId: z.string(),
				bonus: z.number().int(),
			}),
		)
		.default([]),
	penalties: z
		.array(
			z.object({
				cardId: z.string(),
				penalty: z.number().int().nonnegative(),
				reason: z.string(),
			}),
		)
		.default([]),
});

export const puzzleDefinitionSchema = z.object({
	objectName: z.string().min(1),
	objectPersona: z.string().min(1),
	introText: z.string().min(1),
	chainLength: z.number().int().min(3).max(8),
	allowRepeatedCards: z.boolean().default(false),
	cards: z.array(puzzleCardSchema).min(8).max(12),
	constraints: z.array(constraintSchema).min(4).max(8),
	scoring: scoringSchema,
	difficulty: z.enum(["easy", "medium", "hard"]),
});

export type PuzzleCard = z.infer<typeof puzzleCardSchema>;
export type Constraint = z.infer<typeof constraintSchema>;
export type PuzzleDefinition = z.infer<typeof puzzleDefinitionSchema>;

export type ConstraintStatus = {
	constraintType: Constraint["type"];
	message: string;
	passed: boolean;
	triggerIndex: number | null;
};

export type ValidationResult = {
	valid: boolean;
	score: number;
	wooMeter: number;
	lengthOk: boolean;
	duplicateViolation: boolean;
	unknownCardIds: string[];
	firstFailureIndex: number | null;
	satisfied: string[];
	violations: string[];
	constraintStatuses: ConstraintStatus[];
	hint: string;
};

export type SolverDiagnostics = {
	nodesExplored: number;
	branchesPruned: number;
	totalValidSolutions: number;
	pruningOccurred: boolean;
	bestScore: number | null;
};

export type SolveResult = {
	bestChain: string[] | null;
	bestScore: number | null;
	anyValidChain: string[] | null;
	allValidSolutions: string[][];
	diagnostics: SolverDiagnostics;
};
