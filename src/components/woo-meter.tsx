type WooMeterProps = {
	score: number;
	value: number;
};

export function WooMeter({ score, value }: WooMeterProps) {
	const hue =
		value > 70
			? "from-emerald-400 to-lime-300"
			: value > 40
				? "from-amber-300 to-orange-400"
				: "from-rose-400 to-red-500";

	return (
		<div className="space-y-2 rounded-2xl border border-white/15 bg-black/20 p-4">
			<div className="flex items-center justify-between text-slate-200 text-sm">
				<span>Woo Meter</span>
				<span className="font-semibold">{value}%</span>
			</div>
			<div className="h-3 w-full overflow-hidden rounded-full bg-slate-900/70">
				<div
					className={`h-full rounded-full bg-gradient-to-r ${hue} transition-all duration-500`}
					style={{ width: `${value}%` }}
				/>
			</div>
			<p className="text-slate-300 text-xs">Raw score: {score}</p>
		</div>
	);
}
