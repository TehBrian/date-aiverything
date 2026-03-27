-- CreateTable
CREATE TABLE "Puzzle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "objectName" TEXT NOT NULL,
    "objectPersona" TEXT NOT NULL,
    "introText" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "chainLength" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "rawLlmResponse" TEXT,
    "parsedPuzzleJson" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "puzzleId" TEXT NOT NULL,
    "submittedChainJson" JSONB NOT NULL,
    "valid" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL,
    "wooMeter" INTEGER NOT NULL,
    "feedbackJson" JSONB NOT NULL,
    CONSTRAINT "Attempt_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Attempt_puzzleId_createdAt_idx" ON "Attempt"("puzzleId", "createdAt");
