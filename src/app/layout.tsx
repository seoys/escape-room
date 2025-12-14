import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const notoSans = Noto_Sans_KR({
	weight: ['400', '500', '700'],
	subsets: ['latin'],
	display: 'swap',
});

export const metadata: Metadata = {
	title: '방탈출 게임',
	description: '20개의 방을 탈출하여 최종 목적지에 도달하세요!',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ko" suppressHydrationWarning>
			<body
				className={`${notoSans.className} text-base`}
				suppressHydrationWarning
			>
				{children}
			</body>
		</html>
	);
}
