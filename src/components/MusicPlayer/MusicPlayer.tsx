"use client";

import React, {
  FC,
  LegacyRef,
  useRef,
  useState,
  ChangeEvent,
  useEffect,
} from "react";
import PlayerContent from "./PlayerContent";
import _ from "lodash";
import ReactFilePlayer, { FilePlayerProps } from "react-player/file";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
import { createPlayerTracker } from "@/lib/playerTracking";

export interface MusicPlayerProps {}

const MusicPlayer: FC<MusicPlayerProps> = ({}) => {
  const playerRef: LegacyRef<ReactFilePlayer> | undefined = useRef(null);
  const trackerRef = useRef<any>(null);

  const {
    muted,
    playbackRate,
    playing,
    setDuration,
    setLoaded,
    setMuted,
    setPlayed,
    setPlaying,
    setVolume,
    setplaybackRate,
    volume,
    playedSeconds,
    setPlayedSeconds,
    setLoadedSeconds,
    url,
    nftId,
    duration,
    playNextTrack,
    playPreviousTrack,
  } = useMusicPlayer();

  // STATE
  const [seeking, setSeeking] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isRender, setIsRender] = useState(false);
  const [lastPlayState, setLastPlayState] = useState(false);

  useEffect(() => {
    setIsRender(true);
  }, []);

  // Initialize tracker when NFT changes
  useEffect(() => {
    if (nftId && duration > 0) {
      console.log('🎵 Initializing player tracker for NFT:', nftId, 'duration:', duration);
      trackerRef.current = createPlayerTracker(nftId, duration);
      console.log('🎵 Tracker created successfully:', trackerRef.current);
    } else {
      console.log('🎵 Not initializing tracker - nftId:', nftId, 'duration:', duration);
    }
  }, [nftId, duration]);

  // Track play/pause events
  useEffect(() => {
    console.log('🎵 Play state effect - tracker:', !!trackerRef.current, 'nftId:', nftId, 'playing:', playing, 'lastPlayState:', lastPlayState);
    
    if (!trackerRef.current || !nftId) {
      console.log('🎵 Skipping tracking - no tracker or NFT ID');
      return;
    }

    if (playing && !lastPlayState) {
      // Started playing
      console.log('🎵 Tracking play start at position:', playedSeconds);
      trackerRef.current.trackPlayStart(playedSeconds);
    } else if (!playing && lastPlayState) {
      // Paused
      console.log('🎵 Tracking pause at position:', playedSeconds);
      trackerRef.current.trackPause(playedSeconds);
    }

    setLastPlayState(playing);
  }, [playing, playedSeconds, nftId, lastPlayState]);

  // Track progress during playback
  useEffect(() => {
    if (!trackerRef.current || !playing || !nftId) return;

    // Track progress every few seconds
    trackerRef.current.trackProgress(playedSeconds);
  }, [playedSeconds, playing, nftId]);

  const handleSeekMouseUp = (
    e:
      | React.MouseEvent<HTMLInputElement, MouseEvent>
      | React.TouchEvent<HTMLInputElement>
  ) => {
    setSeeking(false);
    playerRef?.current?.seekTo(parseFloat(e.currentTarget.value));
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: number) => {
    setVolume(e);
  };

  const handleSetPlaybackRate = (e: number) => {
    setplaybackRate(e);
  };

  const onClickBackwards10Sec = () => {
    playerRef?.current?.seekTo(playedSeconds - 10, "seconds");
  };

  const onClickForwarkds15Sec = () => {
    playerRef?.current?.seekTo(playedSeconds + 15, "seconds");
  };

  const handlePlay = () => {
    setPlaying(true);
  };

  const handlePause = () => {
    setPlaying(false);
  };

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleEnded = () => {
    console.log('🎵 Track ended at position:', playedSeconds);
    if (trackerRef.current && nftId) {
      trackerRef.current.trackPlayEnd(playedSeconds);
    }
    
    // Auto-advance to next track when current track ends
    console.log('🎵 Auto-advancing to next track...');
    playNextTrack();
  };

  const handleProgress: FilePlayerProps["onProgress"] = (state) => {
    // We only want to update time slider if we are not currently seeking
    if (!seeking) {
      setLoaded(state.loaded);
      setPlayed(state.played);
      setPlayedSeconds(state.playedSeconds);
      setLoadedSeconds(state.loadedSeconds);
    }
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  return (
    <div className={`nc-MusicPlayer fixed bottom-0 inset-x-0 flex z-30`}>
      {/* ---- PLAYER CONTROL ---- */}
      <PlayerContent
        isError={isError}
        handleSetMuted={(isMuted) => setMuted(isMuted)}
        handleSeekMouseUp={handleSeekMouseUp}
        handleSeekMouseDown={handleSeekMouseDown}
        handleSeekChange={handleSeekChange}
        handleVolumeChange={handleVolumeChange}
        handleSetPlaybackRate={handleSetPlaybackRate}
        handleClickBackwards10Sec={playPreviousTrack}
        handleClickForwards15Sec={playNextTrack}
      />

      {/* ---- PLAYER ---- */}
      <div className="fixed top-0 left-0 w-1 h-1 -z-50 opacity-0 overflow-hidden invisible">
        {isRender ? (
          <ReactFilePlayer
            ref={playerRef}
            className="react-player"
            width="100%"
            height="100%"
            url={url || ""}
            playing={playing}
            controls
            playbackRate={playbackRate}
            volume={volume}
            muted={muted}
            onReady={() => {
              console.log("onReady");
              setIsError(false);
            }}
            onStart={() => setIsError(false)}
            onPlay={handlePlay}
            onPause={handlePause}
            onBuffer={() => console.log("onBuffer")}
            onSeek={(e) => console.log("onSeek", e)}
            onEnded={handleEnded}
            onError={(e) => {
              console.error("Player error:", e);
              setIsError(true);
            }}
            onProgress={handleProgress}
            onDuration={handleDuration}
          />
        ) : null}
      </div>
    </div>
  );
};

export default MusicPlayer;
