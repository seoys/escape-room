import type { Metadata } from 'next';
import { Gaegu } from 'next/font/google';
import './globals.css';

const gaegu = Gaegu({
	weight: ['300', '400', '700'],
	subsets: ['latin'],
	display: 'swap',
});

export const metadata: Metadata = {
	title: '방탈출 게임',
	description: '10개의 방을 탈출하여 최종 목적지에 도달하세요!',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ko" suppressHydrationWarning>
			<body
				className={`${gaegu.className} text-base`}
				suppressHydrationWarning
			>
				{children}
			</body>
		</html>
	);
}
