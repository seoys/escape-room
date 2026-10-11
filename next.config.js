const nextConfig = {
	images: { domains: ['localhost'] },
	// The Docker image sets BUILD_STANDALONE=true; the PM2 setup (`next start`) is unchanged.
	output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
};
module.exports = nextConfig;
