/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        SPOTIFY_CLIENT_ID: '775e8b1bd8f341fe97593357e4cdf480',
        REDIRECT_TARGET: 'http://localhost:3000'
    },
    output: "export",
    basePath: "/Im-Not-Like-Other-Playlists",
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
}

module.exports = nextConfig
