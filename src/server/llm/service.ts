import { createLlmProvider } from "~/server/llm/provider";
import type { LlmStructuredResult } from "~/server/llm/types";
import { createFallbackPuzzle } from "~/server/puzzle/fallback";
import { puzzleDefinitionSchema } from "~/server/puzzle/schema";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const pickString = (
	record: Record<string, unknown>,
	keys: string[],
): string | undefined => {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "string" && value.trim().length > 0) {
			return value.trim();
		}
	}
	return undefined;
};

const pickNumber = (
	record: Record<string, unknown>,
	keys: string[],
): number | undefined => {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "number" && Number.isFinite(value)) {
			return value;
		}
		if (typeof value === "string" && value.trim().length > 0) {
			const parsed = Number(value);
			if (Number.isFinite(parsed)) return parsed;
		}
	}
	return undefined;
};

const pickBoolean = (
	record: Record<string, unknown>,
	keys: string[],
): boolean | undefined => {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "boolean") return value;
	}
	return undefined;
};

const normalizeType = (value: unknown): string => {
	if (typeof value !== "string") return "";
	return value.trim().toLowerCase().replaceAll("-", "_");
};

const normalizeLlmPuzzlePayload = (payload: unknown): unknown => {
	if (!isRecord(payload)) return payload;

	const cardsRaw = Array.isArray(payload.cards)
		? payload.cards
		: Array.isArray(payload.cardDeck)
			? payload.cardDeck
			: [];

	const normalizedCards = cardsRaw.map((card, index) => {
		if (!isRecord(card)) return card;
		const tagsRaw = card.tags;
		const tags = Array.isArray(tagsRaw)
			? tagsRaw.filter((tag): tag is string => typeof tag === "string")
			: [];

		return {
			id: pickString(card, ["id", "cardId", "card_id"]) ?? `card_${index + 1}`,
			label:
				pickString(card, ["label", "name", "title"]) ?? `Card ${index + 1}`,
			category: pickString(card, ["category", "group", "type"]) ?? "general",
			tags,
			baseScore: Math.trunc(
				pickNumber(card, ["baseScore", "base_score", "score"]) ?? 0,
			),
		};
	});

	const constraintsRaw = Array.isArray(payload.constraints)
		? payload.constraints
		: Array.isArray(payload.rules)
			? payload.rules
			: [];

	const normalizedConstraints = constraintsRaw.map((constraint, index) => {
		if (!isRecord(constraint)) return constraint;
		const type = normalizeType(constraint.type);
		const message =
			pickString(constraint, ["message", "reason", "text", "description"]) ??
			`Constraint ${index + 1}`;

		switch (type) {
			case "before":
				return {
					type: "before",
					firstCardId:
						pickString(constraint, [
							"firstCardId",
							"cardAId",
							"card1Id",
							"first",
						]) ?? "",
					secondCardId:
						pickString(constraint, [
							"secondCardId",
							"cardBId",
							"card2Id",
							"second",
						]) ?? "",
					message,
				};
			case "not_adjacent":
				return {
					type: "not_adjacent",
					cardAId:
						pickString(constraint, [
							"cardAId",
							"firstCardId",
							"card1Id",
							"first",
						]) ?? "",
					cardBId:
						pickString(constraint, [
							"cardBId",
							"secondCardId",
							"card2Id",
							"second",
						]) ?? "",
					message,
				};
			case "at_least_one_category":
				return {
					type: "at_least_one_category",
					category:
						pickString(constraint, ["category", "group", "targetCategory"]) ??
						"",
					minCount: Math.max(
						1,
						Math.trunc(pickNumber(constraint, ["minCount", "min_count"]) ?? 1),
					),
					message,
				};
			case "exactly_one_category":
				return {
					type: "exactly_one_category",
					category:
						pickString(constraint, ["category", "group", "targetCategory"]) ??
						"",
					message,
				};
			case "max_category_count":
				return {
					type: "max_category_count",
					category:
						pickString(constraint, ["category", "group", "targetCategory"]) ??
						"",
					maxCount: Math.max(
						0,
						Math.trunc(pickNumber(constraint, ["maxCount", "max_count"]) ?? 0),
					),
					message,
				};
			case "not_first":
				return {
					type: "not_first",
					cardId:
						pickString(constraint, ["cardId", "firstCardId", "targetCardId"]) ??
						"",
					message,
				};
			case "if_then_in_sequence":
				return {
					type: "if_then_in_sequence",
					ifCardId:
						pickString(constraint, ["ifCardId", "firstCardId", "cardAId"]) ??
						"",
					thenCardId:
						pickString(constraint, ["thenCardId", "secondCardId", "cardBId"]) ??
						"",
					message,
				};
			default:
				return constraint;
		}
	});

	const scoringRaw = isRecord(payload.scoring)
		? payload.scoring
		: isRecord(payload.score)
			? payload.score
			: {};

	const pairBonusesRaw = Array.isArray(scoringRaw.pairBonuses)
		? scoringRaw.pairBonuses
		: Array.isArray(scoringRaw.pairs)
			? scoringRaw.pairs
			: [];

	const penaltiesRaw = Array.isArray(scoringRaw.penalties)
		? scoringRaw.penalties
		: Array.isArray(scoringRaw.penaltyRules)
			? scoringRaw.penaltyRules
			: [];

	return {
		objectName:
			pickString(payload, ["objectName", "object_name", "name"]) ??
			"Unknown object",
		objectPersona:
			pickString(payload, ["objectPersona", "object_persona", "persona"]) ??
			"Mysterious object crush",
		introText:
			pickString(payload, [
				"introText",
				"intro_text",
				"intro",
				"description",
			]) ?? "This object has complicated feelings.",
		chainLength: Math.max(
			3,
			Math.min(
				8,
				Math.trunc(pickNumber(payload, ["chainLength", "chain_length"]) ?? 4),
			),
		),
		allowRepeatedCards:
			pickBoolean(payload, ["allowRepeatedCards", "allow_repeated_cards"]) ??
			false,
		cards: normalizedCards,
		constraints: normalizedConstraints,
		scoring: {
			preferredCardIds: Array.isArray(scoringRaw.preferredCardIds)
				? scoringRaw.preferredCardIds.filter(
						(value): value is string => typeof value === "string",
					)
				: [],
			preferredCategories: Array.isArray(scoringRaw.preferredCategories)
				? scoringRaw.preferredCategories.filter(
						(value): value is string => typeof value === "string",
					)
				: [],
			pairBonuses: pairBonusesRaw.map((pair) => {
				if (!isRecord(pair)) return pair;
				return {
					firstCardId:
						pickString(pair, ["firstCardId", "cardAId", "card1Id", "first"]) ??
						"",
					secondCardId:
						pickString(pair, [
							"secondCardId",
							"cardBId",
							"card2Id",
							"second",
						]) ?? "",
					bonus: Math.trunc(
						pickNumber(pair, ["bonus", "score", "weight"]) ?? 1,
					),
				};
			}),
			penalties: penaltiesRaw.map((penalty) => {
				if (!isRecord(penalty)) return penalty;
				return {
					cardId: pickString(penalty, ["cardId", "targetCardId", "id"]) ?? "",
					penalty: Math.max(
						0,
						Math.trunc(
							pickNumber(penalty, ["penalty", "value", "score", "amount"]) ?? 1,
						),
					),
					reason:
						pickString(penalty, ["reason", "message", "text", "description"]) ??
						"Penalty condition",
				};
			}),
		},
		difficulty:
			pickString(payload, ["difficulty", "level"])
				?.toLowerCase()
				.replaceAll(" ", "") ?? "medium",
	};
};

const validateReferences = (
	puzzle: ReturnType<typeof puzzleDefinitionSchema.parse>,
) => {
	const ids = new Set(puzzle.cards.map((card) => card.id));
	const categories = new Set(puzzle.cards.map((card) => card.category));

	for (const constraint of puzzle.constraints) {
		switch (constraint.type) {
			case "before":
				if (
					!ids.has(constraint.firstCardId) ||
					!ids.has(constraint.secondCardId)
				) {
					throw new Error("Constraint references unknown card ID (before).\n");
				}
				break;
			case "not_adjacent":
				if (!ids.has(constraint.cardAId) || !ids.has(constraint.cardBId)) {
					throw new Error(
						"Constraint references unknown card ID (not_adjacent).\n",
					);
				}
				break;
			case "at_least_one_category":
			case "exactly_one_category":
			case "max_category_count":
				if (!categories.has(constraint.category)) {
					throw new Error("Constraint references unknown category.");
				}
				break;
			case "not_first":
				if (!ids.has(constraint.cardId)) {
					throw new Error("Constraint references unknown card ID (not_first).");
				}
				break;
			case "if_then_in_sequence":
				if (!ids.has(constraint.ifCardId) || !ids.has(constraint.thenCardId)) {
					throw new Error(
						"Constraint references unknown card ID (if_then_in_sequence).",
					);
				}
				break;
		}
	}

	for (const id of puzzle.scoring.preferredCardIds) {
		if (!ids.has(id))
			throw new Error("Preferred card references unknown card ID.");
	}

	for (const category of puzzle.scoring.preferredCategories) {
		if (!categories.has(category)) {
			throw new Error("Preferred category is not present in cards.");
		}
	}

	for (const pair of puzzle.scoring.pairBonuses) {
		if (!ids.has(pair.firstCardId) || !ids.has(pair.secondCardId)) {
			throw new Error("Pair bonus references unknown card ID.");
		}
	}

	for (const penalty of puzzle.scoring.penalties) {
		if (!ids.has(penalty.cardId)) {
			throw new Error("Penalty references unknown card ID.");
		}
	}
};

export const generatePuzzleFromImage = async (
	imageUrl: string,
): Promise<LlmStructuredResult> => {
	const provider = createLlmProvider();

	if (!provider) {
		return {
			puzzle: createFallbackPuzzle(),
			rawText: "FALLBACK_PUZZLE_NO_API_KEY",
			provider: "fallback",
			model: "local-deterministic",
			usedFallback: true,
			errorMessage: "OPENAI_API_KEY missing. Generated local fallback puzzle.",
		};
	}

	let lastError: string | null = null;
	for (let attempt = 0; attempt < 2; attempt += 1) {
		try {
			const raw = await provider.generatePuzzleJson({ imageUrl });
			const parsedJson = JSON.parse(raw.rawText) as unknown;
			const normalizedPayload = normalizeLlmPuzzlePayload(parsedJson);
			// Zod parse plus referential checks enforce a strict machine-valid contract.
			const puzzle = puzzleDefinitionSchema.parse(normalizedPayload);
			validateReferences(puzzle);
			return {
				puzzle,
				rawText: raw.rawText,
				provider: raw.provider,
				model: raw.model,
				usedFallback: false,
				errorMessage: null,
			};
		} catch (error) {
			lastError = error instanceof Error ? error.message : "Unknown LLM error";
		}
	}

	// Deterministic fallback keeps the class demo runnable even when LLM output fails.
	console.warn("LLM generation fell back to deterministic puzzle:", lastError);
	return {
		puzzle: createFallbackPuzzle(),
		rawText: `FALLBACK_PUZZLE_AFTER_ERROR: ${lastError ?? "unknown"}`,
		provider: "fallback",
		model: "local-deterministic",
		usedFallback: true,
		errorMessage: lastError,
	};
};
