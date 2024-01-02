'use client';

import Image from 'next/image'
import styles from './page.module.css'
import { Playlist, SpotifyApi, UserProfile } from '@spotify/web-api-ts-sdk';
import { useEffect, useState } from 'react';

// Choose one of the following:
const sdk = SpotifyApi.withUserAuthorization(process.env.SPOTIFY_CLIENT_ID || "", process.env.REDIRECT_TARGET || "", ["playlist-read-private", "playlist-read-collaborative"]);

/* stuff to do
- make login button/flow so its not automatic
- have playlists show name beneath image
- have search for playlists
- be able to select target playlist
- be able to select
*/

export default function Home() {

  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    const test = async () => {
      const user = await sdk.currentUser.profile()
      setUser(user);
      console.log(user)

      const resPlaylists = [];
      let res = await sdk.playlists.getUsersPlaylists(user.id, 50);
      resPlaylists.push(...res.items);
      while (res.next) {
        res = await sdk.playlists.getUsersPlaylists(user.id, 50, res.offset + res.limit);
        resPlaylists.push(...res.items);
      }
      console.log("last res:", res)
      console.log(resPlaylists.map(p => p.name))
      setPlaylists(resPlaylists);
    }

    test()
  }, [])

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>
          Hello {user?.display_name}!
        </p>
        <div>
          <a
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{' '}
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              className={styles.vercelLogo}
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div>

      <div className={styles.center} id={styles.playlists}>
        {playlists.map(playlist => (
          <div>
            <Image
              className={styles.logo}
              src={playlist.images[0].url}
              alt={`${playlist.name} cover image`}
              width={300}
              height={300}
              priority
            />
            <p>{playlist.name}</p>
          </div>

        ))}
      </div>

      <div className={styles.grid}>
        <a
          href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>
            Docs <span>-&gt;</span>
          </h2>
          <p>Find in-depth information about Next.js features and API.</p>
        </a>

        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>
            Learn <span>-&gt;</span>
          </h2>
          <p>Learn about Next.js in an interactive course with&nbsp;quizzes!</p>
        </a>

        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>
            Templates <span>-&gt;</span>
          </h2>
          <p>Explore starter templates for Next.js.</p>
        </a>

        <a
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>
            Deploy <span>-&gt;</span>
          </h2>
          <p>
            Instantly deploy your Next.js site to a shareable URL with Vercel.
          </p>
        </a>
      </div>
    </main>
  )
}
