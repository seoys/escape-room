export const getBrowserInfo = () => {
	// 서버사이드에서 실행되는지 체크
	if (typeof window === 'undefined') {
		return {
			userAgent: '',
			language: '',
			platform: '',
			vendor: '',
			screenResolution: { width: 0, height: 0 },
			viewport: { width: 0, height: 0 },
		};
	}

	return {
		userAgent: navigator.userAgent,
		language: navigator.language,
		platform: navigator.platform,
		vendor: navigator.vendor,
		screenResolution: {
			width: window.screen.width,
			height: window.screen.height,
		},
		viewport: {
			width: window.innerWidth,
			height: window.innerHeight,
		},
	};
};

export const getIpAddress = async () => {
	const response = await fetch('https://api.ipify.org?format=json');
	const data = await response.json();
	return data.ip;
};
