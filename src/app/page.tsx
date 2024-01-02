'use client';

import Image from 'next/image'
import styles from './page.module.css'
import { Playlist, PlaylistedTrack, SpotifyApi, UserProfile } from '@spotify/web-api-ts-sdk';
import { useEffect, useState } from 'react';
import Fuse, { FuseResult } from 'fuse.js'

// Choose one of the following:
const sdk = SpotifyApi.withUserAuthorization(process.env.SPOTIFY_CLIENT_ID || "", process.env.REDIRECT_TARGET || "", ["playlist-read-private", "playlist-read-collaborative"]);

/* stuff to do
- pass full playlist object through to comparison so that we can pull name as needed
- display result cleanly
- clean up code
*/

export default function Home() {

  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState<Playlist[]>([]);
  const [filterText, setFilterText] = useState("");

  const [targetPlaylistId, setTargetPlaylistId] = useState("");
  const [playlistsToCheck, setPlaylistsToCheck] = useState<string[]>([]);
  const [phase, setPhase] = useState("target");


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

  useEffect(() => {
    const search = (term: string): FuseResult<Playlist>[] => {
      if (!term) {
        // Just mimic the return type of `Fuse.FuseResult`
        return playlists.map((item, refIndex) => ({
          item,
          refIndex,
          matches: [],
          score: 0,
        }))
      }

      return fuse.search(term);
    }


    const fuse = new Fuse(playlists, { keys: ["name"] });
    setFilteredPlaylists(search(filterText).map(fuseresult => fuseresult.item))
  }, [playlists, filterText])

  const handlePlaylistClick = (playlistId: string) => {
    switch (phase) {
      case "target":
        setTargetPlaylistId(playlistId);
        setPhase("check");
        break;
      case "check":
        if (playlistsToCheck.includes(playlistId)) {
          setPlaylistsToCheck(playlistsToCheck.filter(id => id !== playlistId));
        } else {
          setPlaylistsToCheck([...playlistsToCheck, playlistId]);
        }
        break;
      default:
        alert("how did u get here?");
    }
  }

  const getPlaylistTracks = async (playlistId: string) => {
    const tracks: PlaylistedTrack[] = [];
    let res = await sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, 50);
    tracks.push(...res.items);
    while (res.next) {
      res = await sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, 50, 50 + res.offset);
      tracks.push(...res.items);
    }
    return tracks;
  }

  const comparePlaylists = async () => {
    if (targetPlaylistId === "") {
      alert("no target!")
      return;
    }

    if (playlistsToCheck.length === 0) {
      alert("no playlists to check!");
      return;
    }

    // final datastructure should be {id, playlists: []}, if playlists is 1, we good
    type ResultValue = {
      track: PlaylistedTrack,
      playlists: string[]
    }
    interface Map {
      [key: string]: ResultValue | undefined
    }

    console.log("getting target tracks")
    const targetTracks = await getPlaylistTracks(targetPlaylistId);
    console.log(`got ${targetTracks.length} tracks`)
    const result: Map = {}
    targetTracks.forEach(track => {
      result[track.track.id] = {
        track: track,
        playlists: [targetPlaylistId]
      }
    })
    console.log("checking against playlists")
    for (const playlist of playlistsToCheck) {
      console.log(`getting tracks for ${playlist}`)
      const tracksToCheck = await getPlaylistTracks(playlist);
      console.log(`got ${tracksToCheck.length} tracks to check`)
      for (const track of tracksToCheck) {
        if (result[track.track.id] !== undefined) {
          console.log("got a hit, adding playlist to result")
          result[track.track.id]?.playlists.push(playlist);
        }
      }
    }

    console.log(result)
  }

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>
          Hello {user?.display_name}!
        </p>
      </div>


      <div className={styles.grid}>
        <h2
          className={styles.card + " " + (phase === "target" ? styles.selected_phase : "")}
          onClick={() => setPhase("target")}
        >
          Select Target <span>-&gt;</span>
        </h2>

        <h2
          className={styles.card + " " + (phase === "check" ? styles.selected_phase : "")}
          onClick={() => setPhase("check")}
        >
          Select Playlists to Check <span>-&gt;</span>
        </h2>

        <h2
          className={styles.card}
          onClick={comparePlaylists}
        >
          Run <span>-&gt;</span>
        </h2>
      </div>

      <div>
        Search: <input type="text" value={filterText} onChange={(e => setFilterText(e.target.value))} />
      </div>

      <div className={styles.center} id={styles.playlists}>
        {filteredPlaylists
          .sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0))
          .map(playlist => (
            <div key={playlist.id} onClick={() => handlePlaylistClick(playlist.id)}
              className={(targetPlaylistId === playlist.id ? styles.target : "") + " " + (playlistsToCheck.includes(playlist.id) ? styles.check : "")}>
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
    </main>
  )
}
