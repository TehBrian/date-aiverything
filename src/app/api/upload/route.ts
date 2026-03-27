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
		await mkdir(uploadsDir, { recursive: true });
		const fileName = `${Date.now()}-${crypto.randomUUID()}.${extFromMime(file.type)}`;
		const destination = path.join(uploadsDir, fileName);
		await writeFile(destination, fileBuffer);

		const imageUrl = `/uploads/${fileName}`;
		return NextResponse.json({ imageUrl });
	} catch (error) {
		console.error("Upload failed", error);
		return NextResponse.json({ error: "Upload failed." }, { status: 500 });
	}
}
