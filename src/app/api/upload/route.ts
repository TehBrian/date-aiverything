import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { env } from "~/env";

export const runtime = "nodejs";

const allowedMimeTypes = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
]);

const extFromMime = (mime: string): string => {
	switch (mime) {
		case "image/png":
			return "png";
		case "image/jpeg":
			return "jpg";
		case "image/webp":
			return "webp";
		case "image/gif":
			return "gif";
		default:
			return "bin";
	}
};

const toDataUrl = (mimeType: string, fileBuffer: Buffer): string =>
	`data:${mimeType};base64,${fileBuffer.toString("base64")}`;

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const file = formData.get("file");
		if (!(file instanceof File)) {
			return NextResponse.json(
				{ error: "Expected a file field named 'file'." },
				{ status: 400 },
			);
		}

		if (!allowedMimeTypes.has(file.type)) {
			return NextResponse.json(
				{ error: "Unsupported image type. Use PNG, JPEG, WEBP, or GIF." },
				{ status: 400 },
			);
		}

		const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
		if (file.size > maxBytes) {
			return NextResponse.json(
				{ error: `File too large. Max size is ${env.MAX_UPLOAD_MB}MB.` },
				{ status: 400 },
			);
		}

		const bytes = await file.arrayBuffer();
		const fileBuffer = Buffer.from(bytes);

		const uploadsDir = path.join(process.cwd(), "public", "uploads");
		const fileName = `${Date.now()}-${crypto.randomUUID()}.${extFromMime(file.type)}`;

		try {
			await mkdir(uploadsDir, { recursive: true });
			const destination = path.join(uploadsDir, fileName);
			await writeFile(destination, fileBuffer);
			return NextResponse.json({ imageUrl: `/uploads/${fileName}` });
		} catch (filesystemError) {
			console.warn(
				"Upload storage fallback to data URL due to filesystem write failure",
				filesystemError,
			);
			return NextResponse.json({ imageUrl: toDataUrl(file.type, fileBuffer) });
		}
	} catch (error) {
		console.error("Upload failed", error);
		return NextResponse.json({ error: "Upload failed." }, { status: 500 });
	}
}
