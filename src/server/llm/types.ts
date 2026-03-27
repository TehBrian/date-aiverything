import type { PuzzleDefinition } from "~/server/puzzle/schema";

export type LlmGenerateInput = {
	imageUrl: string;
};

export type LlmRawResult = {
	rawText: string;
	provider: string;
	model: string;
};

export type LlmStructuredResult = {
	puzzle: PuzzleDefinition;
	rawText: string;
	provider: string;
	model: string;
	usedFallback: boolean;
	errorMessage: string | null;
};

export interface LlmProvider {
	name: string;
	model: string;
	generatePuzzleJson(input: LlmGenerateInput): Promise<LlmRawResult>;
}
