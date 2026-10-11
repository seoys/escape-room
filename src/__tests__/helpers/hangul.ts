const INITIALS = [
	'ㄱ',
	'ㄲ',
	'ㄴ',
	'ㄷ',
	'ㄸ',
	'ㄹ',
	'ㅁ',
	'ㅂ',
	'ㅃ',
	'ㅅ',
	'ㅆ',
	'ㅇ',
	'ㅈ',
	'ㅉ',
	'ㅊ',
	'ㅋ',
	'ㅌ',
	'ㅍ',
	'ㅎ',
];
const FINALS = [
	'',
	'ㄱ',
	'ㄲ',
	'ㄳ',
	'ㄴ',
	'ㄵ',
	'ㄶ',
	'ㄷ',
	'ㄹ',
	'ㄺ',
	'ㄻ',
	'ㄼ',
	'ㄽ',
	'ㄾ',
	'ㄿ',
	'ㅀ',
	'ㅁ',
	'ㅂ',
	'ㅄ',
	'ㅅ',
	'ㅆ',
	'ㅇ',
	'ㅈ',
	'ㅊ',
	'ㅋ',
	'ㅌ',
	'ㅍ',
	'ㅎ',
];

const decompose = (syllable: string) => {
	const code = syllable.charCodeAt(0) - 0xac00;
	if (code < 0 || code > 11171) return null;
	return {
		initial: INITIALS[Math.floor(code / 588)],
		final: FINALS[code % 28],
	};
};

export const initialOf = (syllable: string): string =>
	decompose(syllable)?.initial ?? '';

export const countJamo = (word: string, jamo: string): number =>
	[...word].reduce((total, syllable) => {
		const parts = decompose(syllable);
		if (!parts) return total;
		return (
			total +
			(parts.initial === jamo ? 1 : 0) +
			(parts.final === jamo ? 1 : 0)
		);
	}, 0);

const MEDIALS = [
	'ㅏ',
	'ㅐ',
	'ㅑ',
	'ㅒ',
	'ㅓ',
	'ㅔ',
	'ㅕ',
	'ㅖ',
	'ㅗ',
	'ㅘ',
	'ㅙ',
	'ㅚ',
	'ㅛ',
	'ㅜ',
	'ㅝ',
	'ㅞ',
	'ㅟ',
	'ㅠ',
	'ㅡ',
	'ㅢ',
	'ㅣ',
];

export const composeSyllable = (
	initial: string,
	medial: string,
	final = '',
): string => {
	const i = INITIALS.indexOf(initial);
	const m = MEDIALS.indexOf(medial);
	const f = FINALS.indexOf(final);
	if (i < 0 || m < 0 || f < 0)
		throw new Error(`cannot compose ${initial}${medial}${final}`);
	return String.fromCharCode(0xac00 + (i * 21 + m) * 28 + f);
};
