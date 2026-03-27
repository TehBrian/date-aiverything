import { env } from "~/env";
import { OpenAiPuzzleProvider } from "~/server/llm/openai-provider";
import type { LlmProvider } from "~/server/llm/types";

export const createLlmProvider = (): LlmProvider | null => {
	const apiKey = env.OPENAI_API_KEY?.trim();
	if (!apiKey) {
		return null;
	}

	return new OpenAiPuzzleProvider(apiKey);
};
