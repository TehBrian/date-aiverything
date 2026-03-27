import Image from "next/image";

type UploadPanelProps = {
	previewUrl: string | null;
	errorMessage: string | null;
	isGenerating: boolean;
	onFileChange: (file: File | null) => void;
	onGenerate: () => void;
	hasFile: boolean;
};

export function UploadPanel({
	previewUrl,
	errorMessage,
	isGenerating,
	onFileChange,
	onGenerate,
	hasFile,
}: UploadPanelProps) {
	return (
		<section className="rounded-3xl border border-white/15 bg-black/30 p-5">
			<h2 className="font-semibold text-white text-xl">1) Upload Your Crush</h2>
			<p className="mt-2 text-slate-300 text-sm">
				Drop in any object photo and let the app generate a dating-sim persona
				plus a CSP puzzle.
			</p>
			<div className="mt-4 space-y-3">
				<input
					accept="image/png,image/jpeg,image/webp,image/gif"
					className="block w-full text-slate-200 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:font-semibold file:text-slate-900"
					onChange={(event) => {
						const file = event.target.files?.[0] ?? null;
						onFileChange(file);
					}}
					type="file"
				/>
				<button
					className="w-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-4 py-2 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
					disabled={!hasFile || isGenerating}
					onClick={onGenerate}
					type="button"
				>
					{isGenerating
						? "Generating puzzle..."
						: "Generate Object Date Puzzle"}
				</button>
			</div>
			{previewUrl ? (
				<div className="mt-4 overflow-hidden rounded-2xl border border-white/20">
					<Image
						alt="Uploaded object preview"
						className="h-52 w-full object-cover"
						height={320}
						src={previewUrl}
						unoptimized
						width={640}
					/>
				</div>
			) : null}
			{errorMessage ? (
				<p className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-red-200 text-sm">
					{errorMessage}
				</p>
			) : null}
		</section>
	);
}
