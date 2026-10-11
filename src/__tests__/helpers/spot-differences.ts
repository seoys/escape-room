// Every element that differs between the two panels of public/puzzles/room-33-spot.svg,
// mapped to the difference it belongs to. It lives in the tests only: the shipped SVG
// must not label the differences, or the count (the answer) could be read from it.
export const SPOT_DIFFERENCES: Record<string, number> = {
	// left panel only
	'<line x1="125" y1="60" x2="134" y2="60" stroke="#2a2418" stroke-width="2"/>': 2,
	'<circle cx="122" cy="116" r="10" fill="#7a2f2f"/>': 3,
	'<circle cx="36" cy="88" r="2.5" fill="#f6e6a0"/>': 4,
	'<rect x="70" y="205" width="4" height="30" fill="#e0a030"/>': 5,
	'<rect x="100" y="205" width="4" height="30" fill="#e0a030"/>': 5,
	'<rect x="130" y="205" width="4" height="30" fill="#e0a030"/>': 5,
	// right panel only
	'<use href="#candle" x="94" y="150"/>': 1,
	'<line x1="125" y1="60" x2="116" y2="60" stroke="#2a2418" stroke-width="2"/>': 2,
	'<rect x="112" y="106" width="20" height="20" fill="#7a2f2f"/>': 3,
	'<rect x="62" y="205" width="4" height="30" fill="#e0a030"/>': 5,
	'<rect x="86" y="205" width="4" height="30" fill="#e0a030"/>': 5,
	'<rect x="110" y="205" width="4" height="30" fill="#e0a030"/>': 5,
	'<rect x="134" y="205" width="4" height="30" fill="#e0a030"/>': 5,
};

export const SPOT_DIFFERENCE_COUNT = new Set(Object.values(SPOT_DIFFERENCES))
	.size;
