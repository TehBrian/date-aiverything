import type { PuzzleDefinition } from "~/server/puzzle/schema";

export const createFallbackPuzzle = (): PuzzleDefinition => {
	return {
		objectName: "Vintage Toaster",
		objectPersona: "Warm, dramatic, and a little crunchy around the edges",
		introText:
			"You approach a gleaming retro toaster. It clicks softly and says, 'If you want my heart, prove you can handle heat with style.'",
		chainLength: 5,
		allowRepeatedCards: false,
		difficulty: "medium",
		cards: [
			{
				id: "compliment_craft",
				label: "Compliment craftsmanship",
				category: "compliment",
				tags: ["warm"],
				baseScore: 2,
			},
			{
				id: "ask_origin",
				label: "Ask about origin",
				category: "question",
				tags: ["curious"],
				baseScore: 1,
			},
			{
				id: "mention_adventure",
				label: "Mention adventure",
				category: "story",
				tags: ["bold"],
				baseScore: 2,
			},
			{
				id: "discuss_art",
				label: "Discuss design aesthetics",
				category: "art",
				tags: ["refined"],
				baseScore: 2,
			},
			{
				id: "talk_food",
				label: "Talk about breakfast food",
				category: "food",
				tags: ["comfort"],
				baseScore: 1,
			},
			{
				id: "share_joke",
				label: "Share a silly joke",
				category: "humor",
				tags: ["playful"],
				baseScore: 1,
			},
			{
				id: "admire_durability",
				label: "Admire durability",
				category: "practical",
				tags: ["stable"],
				baseScore: 1,
			},
			{
				id: "ask_dreams",
				label: "Ask about dreams",
				category: "question",
				tags: ["intimate"],
				baseScore: 2,
			},
			{
				id: "mention_travel",
				label: "Mention future travel plans",
				category: "story",
				tags: ["future"],
				baseScore: 2,
			},
			{
				id: "praise_unique",
				label: "Praise uniqueness",
				category: "compliment",
				tags: ["special"],
				baseScore: 2,
			},
		],
		constraints: [
			{
				type: "before",
				firstCardId: "mention_adventure",
				secondCardId: "mention_travel",
				message: "Travel can only come after adventure.",
			},
			{
				type: "not_adjacent",
				cardAId: "talk_food",
				cardBId: "admire_durability",
				message: "Food and durability cannot be adjacent.",
			},
			{
				type: "at_least_one_category",
				category: "compliment",
				minCount: 1,
				message: "Include at least one compliment.",
			},
			{
				type: "exactly_one_category",
				category: "question",
				message: "Use exactly one question card.",
			},
			{
				type: "max_category_count",
				category: "story",
				maxCount: 2,
				message: "Use story cards at most twice.",
			},
			{
				type: "not_first",
				cardId: "share_joke",
				message: "A joke cannot be your first move.",
			},
			{
				type: "if_then_in_sequence",
				ifCardId: "ask_dreams",
				thenCardId: "praise_unique",
				message: "If you ask about dreams, praise uniqueness later.",
			},
		],
		scoring: {
			preferredCardIds: ["mention_adventure", "praise_unique"],
			preferredCategories: ["compliment", "art"],
			pairBonuses: [
				{
					firstCardId: "compliment_craft",
					secondCardId: "ask_origin",
					bonus: 3,
				},
				{
					firstCardId: "mention_adventure",
					secondCardId: "mention_travel",
					bonus: 3,
				},
			],
			penalties: [
				{
					cardId: "talk_food",
					penalty: 2,
					reason: "The toaster fears being reduced to snacks.",
				},
			],
		},
	};
};
