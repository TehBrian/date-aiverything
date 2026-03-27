import { readFile } from "node:fs/promises";
import path from "node:path";

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generatePuzzleFromImage as generatePuzzleFromImageWithLlm } from "~/server/llm/service";
import {
	puzzleDefinitionSchema,
	solvePuzzleWithBacktracking,
	validateChain,
} from "~/server/puzzle";

const mimeFromExt = (inputPath: string): string => {
	const lower = inputPath.toLowerCase();
	if (lower.endsWith(".png")) return "image/png";
	if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
	if (lower.endsWith(".webp")) return "image/webp";
	if (lower.endsWith(".gif")) return "image/gif";
	return "application/octet-stream";
};

const toModelImageUrl = async (imageUrl: string): Promise<string> => {
	if (
		imageUrl.startsWith("http://") ||
		imageUrl.startsWith("https://") ||
		imageUrl.startsWith("data:")
	) {
		return imageUrl;
	}

	if (!imageUrl.startsWith("/")) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid image URL format.",
		});
	}

	const relativePath = imageUrl.replace(/^\/+/, "");
	const publicRoot = path.resolve(process.cwd(), "public");
	const localPath = path.resolve(publicRoot, relativePath);
	if (!localPath.startsWith(`${publicRoot}${path.sep}`)) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Unsafe image path." });
	}
	const fileBytes = await readFile(localPath);
	const mimeType = mimeFromExt(localPath);
	return `data:${mimeType};base64,${fileBytes.toString("base64")}`;
};

export const puzzleRouter = createTRPCRouter({
	generatePuzzleFromImage: publicProcedure
		.input(
			z.object({
				imageUrl: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const modelImageUrl = await toModelImageUrl(input.imageUrl);
			const generated = await generatePuzzleFromImageWithLlm(modelImageUrl);

			const created = await ctx.db.puzzle.create({
				data: {
					objectName: generated.puzzle.objectName,
					objectPersona: generated.puzzle.objectPersona,
					introText: generated.puzzle.introText,
					imageUrl: input.imageUrl,
					chainLength: generated.puzzle.chainLength,
					difficulty: generated.puzzle.difficulty,
					rawLlmResponse: generated.rawText,
					parsedPuzzleJson: generated.puzzle,
				},
			});

			return {
				puzzleId: created.id,
				createdAt: created.createdAt,
				imageUrl: created.imageUrl,
				puzzle: generated.puzzle,
				providerMeta: {
					provider: generated.provider,
					model: generated.model,
					usedFallback: generated.usedFallback,
					errorMessage: generated.errorMessage,
				},
			};
		}),

	validateChain: publicProcedure
		.input(
			z.object({
				puzzleId: z.string().cuid(),
				chain: z.array(z.string()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const puzzleRow = await ctx.db.puzzle.findUnique({
				where: { id: input.puzzleId },
			});
			if (!puzzleRow) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Puzzle not found.",
				});
			}
			const parsedPuzzle = puzzleDefinitionSchema.parse(
				puzzleRow.parsedPuzzleJson,
			);
			const result = validateChain(parsedPuzzle, input.chain);

			await ctx.db.attempt.create({
				data: {
					puzzleId: input.puzzleId,
					submittedChainJson: input.chain,
					valid: result.valid,
					score: result.score,
					wooMeter: result.wooMeter,
					feedbackJson: result,
				},
			});

			return result;
		}),

	solvePuzzle: publicProcedure
		.input(
			z.object({
				puzzleId: z.string().cuid(),
				includeAllValidSolutions: z.boolean().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const puzzleRow = await ctx.db.puzzle.findUnique({
				where: { id: input.puzzleId },
			});
			if (!puzzleRow) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Puzzle not found.",
				});
			}
			const parsedPuzzle = puzzleDefinitionSchema.parse(
				puzzleRow.parsedPuzzleJson,
			);
			const solved = solvePuzzleWithBacktracking(parsedPuzzle, {
				includeAllValidSolutions: input.includeAllValidSolutions ?? true,
				maxStoredSolutions: 300,
			});

			return {
				...solved,
				hasSolution: solved.bestChain !== null,
				summary:
					solved.bestChain !== null
						? "Optimal valid chain found with recursive backtracking."
						: "No valid chain exists for this puzzle instance.",
			};
		}),

	getPuzzle: publicProcedure
		.input(
			z.object({
				puzzleId: z.string().cuid(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const puzzleRow = await ctx.db.puzzle.findUnique({
				where: { id: input.puzzleId },
				include: {
					attempts: {
						orderBy: { createdAt: "desc" },
						take: 10,
					},
				},
			});

			if (!puzzleRow) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Puzzle not found.",
				});
			}

			const parsedPuzzle = puzzleDefinitionSchema.parse(
				puzzleRow.parsedPuzzleJson,
			);
			return {
				id: puzzleRow.id,
				createdAt: puzzleRow.createdAt,
				imageUrl: puzzleRow.imageUrl,
				objectName: puzzleRow.objectName,
				objectPersona: puzzleRow.objectPersona,
				introText: puzzleRow.introText,
				chainLength: puzzleRow.chainLength,
				difficulty: puzzleRow.difficulty,
				puzzle: parsedPuzzle,
				attempts: puzzleRow.attempts.map(
					(attempt: {
						id: string;
						createdAt: Date;
						valid: boolean;
						score: number;
						wooMeter: number;
						submittedChainJson: unknown;
						feedbackJson: unknown;
					}) => ({
						id: attempt.id,
						createdAt: attempt.createdAt,
						valid: attempt.valid,
						score: attempt.score,
						wooMeter: attempt.wooMeter,
						submittedChain: attempt.submittedChainJson,
						feedback: attempt.feedbackJson,
					}),
				),
			};
		}),
});
