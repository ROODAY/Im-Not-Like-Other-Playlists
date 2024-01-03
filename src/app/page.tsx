'use client';

import Image from 'next/image'
import styles from './page.module.css'
import { Playlist, PlaylistedTrack, SpotifyApi, Track, UserProfile } from '@spotify/web-api-ts-sdk';
import { useEffect, useState } from 'react';
import Fuse, { FuseResult } from 'fuse.js'

// Choose one of the following:
const sdk = SpotifyApi.withUserAuthorization(process.env.SPOTIFY_CLIENT_ID || "", process.env.REDIRECT_TARGET || "", ["playlist-read-private", "playlist-read-collaborative"]);

/* stuff to do
- pass full playlist object through to comparison so that we can pull name as needed
- display result cleanly
- clean up code
*/

type ResultModalProps = {
  show: boolean;
  children?: React.ReactNode
}

const ResultModal: React.FC<ResultModalProps> = ({ show, children }) => {

  if (!show) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        {children}
      </div>
    </div>
  )
}

type ResultValue = {
  track: PlaylistedTrack,
  playlists: Playlist[]
}
interface ResultMap {
  [key: string]: ResultValue | undefined
}

type Phase = "target" | "check" | "run";

export default function Home() {

  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState<Playlist[]>([]);
  const [filterText, setFilterText] = useState("");

  const [targetPlaylist, setTargetPlaylist] = useState<Playlist | undefined>(undefined);
  const [playlistsToCheck, setPlaylistsToCheck] = useState<Playlist[]>([]);


  const [phase, setPhase] = useState<Phase>("target");

  const [statusMessage, setStatusMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [results, setResults] = useState<ResultMap>({});
  const [resultToInspect, setResultToInspect] = useState<ResultValue | undefined>(undefined);


  useEffect(() => {
    const test = async () => {
      const user = await sdk.currentUser.profile()
      setUser(user);

      const resPlaylists = [];
      let res = await sdk.playlists.getUsersPlaylists(user.id, 50);
      resPlaylists.push(...res.items);
      while (res.next) {
        res = await sdk.playlists.getUsersPlaylists(user.id, 50, res.offset + res.limit);
        resPlaylists.push(...res.items);
      }
      setPlaylists(resPlaylists);
    }

    test()
  }, [])

  useEffect(() => {
    const search = (term: string): FuseResult<Playlist>[] => {
      if (!term) {
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

  const handlePlaylistClick = (playlist: Playlist) => {
    switch (phase) {
      case "target":
        setTargetPlaylist(playlist);
        setPhase("check");
        break;
      case "check":
        if (playlistsToCheck.some(p => p.id === playlist.id)) {
          setPlaylistsToCheck(playlistsToCheck.filter(p => p.id !== playlist.id));
        } else {
          setPlaylistsToCheck([...playlistsToCheck, playlist]);
        }
        break;
      default:
        alert("How did you get here? You should probably refresh the page...");
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
    if (targetPlaylist === undefined) {
      alert("No target playlist set!")
      return;
    }

    if (playlistsToCheck.length === 0) {
      alert("No playlists to check are set!");
      return;
    }

    setShowModal(true);

    setStatusMessage(`Getting tracks from target playlist: ${targetPlaylist.name}...`)
    const targetTracks = await getPlaylistTracks(targetPlaylist.id);
    setStatusMessage(`Got ${targetTracks.length} tracks!`)
    const results: ResultMap = {}
    targetTracks.forEach(track => {
      results[track.track.id] = {
        track: track,
        playlists: [targetPlaylist]
      }
    })
    setStatusMessage("Comparing against playlists to check...")
    for (const playlist of playlistsToCheck) {
      setStatusMessage(`Getting tracks for playlist: ${playlist.name}...`);
      const tracksToCheck = await getPlaylistTracks(playlist.id);
      setStatusMessage(`Got ${tracksToCheck.length} tracks to check!`)
      setStatusMessage(`Checking for hits in ${playlist.name}...`);
      for (const track of tracksToCheck) {
        if (results[track.track.id] !== undefined) {
          results[track.track.id]?.playlists.push(playlist);
        }
      }
    }

    setStatusMessage("Results:")
    setResults(results);
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
          .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0))
          .map(playlist => (
            <div key={playlist.id} onClick={() => handlePlaylistClick(playlist)}
              className={(targetPlaylist?.id === playlist.id ? styles.target : "") + " " + (playlistsToCheck.some(p => p.id === playlist.id) ? styles.check : "")}>
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

      <ResultModal
        show={showModal}
      >
        <div className={styles.modalHeader}>
          <h1>{statusMessage}</h1>
          <button onClick={() => setShowModal(false)}>Close</button>
        </div>

        <div className={styles.resultsContainer}>
          <div>
            {Object.values(results).map(result => {
              const track = result!.track.track as Track;

              return (
                <div key={track.id} className={styles.resultTrack
                  + " " + (result!.playlists.length > 1 ? styles.duped : "")
                  + " " + (resultToInspect?.track.track.id === track.id ? styles.trackToInspect : "")}
                  onClick={() => setResultToInspect(result)}>
                  <Image
                    className={styles.logo}
                    src={track.album.images[0].url}
                    alt={`${track.album.name} cover image`}
                    width={64}
                    height={64}
                    priority
                  />
                  {track.name}
                </div>
              )
            })}
          </div>
          <div>
            {resultToInspect && resultToInspect.playlists.map(playlist => (
              <div key={playlist.id} className={styles.resultTrack}>
                <Image
                  className={styles.logo}
                  src={playlist.images[0].url}
                  alt={`${playlist.name} cover image`}
                  width={64}
                  height={64}
                  priority
                />
                {playlist.name}
              </div>
            ))}
          </div>
        </div>
      </ResultModal>
    </main>
  )
}
