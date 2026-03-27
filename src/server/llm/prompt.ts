// Prompt deliberately constrains output shape so downstream deterministic code can trust the payload.
export const buildSystemPrompt =
	() => `You are generating content for an educational app that blends roleplay with classical AI search.
You must return strict JSON only. No markdown fences.

Requirements:
- Analyze the uploaded image and infer an object identity.
- Write lighthearted dating-sim persona text for that object.
- Build a deterministic finite puzzle for a sequence-building constraint satisfaction task.
- Use 8-12 cards.
- Use chainLength between 4 and 6.
- Include 4-6 hard constraints from allowed set only.
- Keep constraints deterministic and code-checkable.
- Do not rely on subjective or semantic scoring at solve-time.
- Prefer distinct card IDs and readable labels.
- Return JSON with fields expected by the schema contract.

Allowed hard constraint types:
before, not_adjacent, at_least_one_category, exactly_one_category, max_category_count, not_first, if_then_in_sequence.

Output JSON only.`;

export const buildUserPrompt = (imageUrl: string) => `Image URL: ${imageUrl}

Create one puzzle instance with these goals:
1) objectName: concise noun phrase.
2) objectPersona: one short phrase.
3) introText: 1-2 sentences in-character.
4) chainLength: 4-6.
5) allowRepeatedCards: false by default.
6) cards: 8-12 entries with id, label, category, tags, baseScore.
7) constraints: 4-6 hard constraints from allowed types.
8) scoring: include a few preferredCardIds, preferredCategories, pairBonuses, and penalties.
9) difficulty: easy|medium|hard.

Strict field contract (must match exactly):
- Every constraint object must include type and message.
- before: { type, firstCardId, secondCardId, message }
- not_adjacent: { type, cardAId, cardBId, message }
- at_least_one_category: { type, category, minCount, message }
- exactly_one_category: { type, category, message }
- max_category_count: { type, category, maxCount, message }
- not_first: { type, cardId, message }
- if_then_in_sequence: { type, ifCardId, thenCardId, message }
- pairBonuses entries: { firstCardId, secondCardId, bonus }
- penalties entries: { cardId, penalty, reason }

Ensure card IDs referenced in constraints/scoring exist in cards.`;
