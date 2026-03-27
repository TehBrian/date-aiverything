import "~/styles/globals.css";

import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "Date Aiverything",
	description:
		"A playful AI dating-sim parody with a deterministic recursive backtracking constraint solver.",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const displayFont = Space_Grotesk({
	subsets: ["latin"],
	variable: "--font-display",
});

const monoFont = IBM_Plex_Mono({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	variable: "--font-mono",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={`${displayFont.variable} ${monoFont.variable}`} lang="en">
			<body>
				<TRPCReactProvider>{children}</TRPCReactProvider>
			</body>
		</html>
	);
}
