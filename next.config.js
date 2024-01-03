/** @type {import('next').NextConfig} */
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

module.exports = (phase, { defaultConfig }) => {
    if (phase === PHASE_DEVELOPMENT_SERVER) {
        return {
            env: {
                SPOTIFY_CLIENT_ID: '775e8b1bd8f341fe97593357e4cdf480',
                REDIRECT_TARGET: 'http://localhost:3000'
            },
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
    }

    return {
        env: {
            SPOTIFY_CLIENT_ID: '775e8b1bd8f341fe97593357e4cdf480',
            REDIRECT_TARGET: 'https://rooday.com/Im-Not-Like-Other-Playlists/'
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
}
