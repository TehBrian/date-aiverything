import OpenAI from "openai";

import { env } from "~/env";
import { buildSystemPrompt, buildUserPrompt } from "~/server/llm/prompt";
import type {
	LlmGenerateInput,
	LlmProvider,
	LlmRawResult,
} from "~/server/llm/types";

const asText = (content: unknown): string | null => {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return null;

	const textParts = content
		.map((part) => {
			if (!part || typeof part !== "object") return "";
			if (!("type" in part)) return "";
			if ((part as { type?: string }).type !== "text") return "";
			return (part as { text?: string }).text ?? "";
		})
		.filter(Boolean);

	return textParts.join("\n").trim() || null;
};

export class OpenAiPuzzleProvider implements LlmProvider {
	public readonly name = "openai";
	public readonly model = env.OPENAI_MODEL;
	private readonly client: OpenAI;

	constructor(apiKey: string) {
		this.client = new OpenAI({ apiKey });
	}

	async generatePuzzleJson(input: LlmGenerateInput): Promise<LlmRawResult> {
		const completion = await this.client.chat.completions.create({
			model: this.model,
			temperature: 0.4,
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content: buildSystemPrompt(),
				},
				{
					role: "user",
					content: [
						{ type: "text", text: buildUserPrompt(input.imageUrl) },
						{ type: "image_url", image_url: { url: input.imageUrl } },
					],
				},
			],
		});

		const firstChoice = completion.choices[0];
		const content = firstChoice?.message?.content;
		const rawText = asText(content);

		if (!rawText) {
			throw new Error("OpenAI returned an empty structured payload.");
		}

		return {
			rawText,
			provider: this.name,
			model: this.model,
		};
	}
}
