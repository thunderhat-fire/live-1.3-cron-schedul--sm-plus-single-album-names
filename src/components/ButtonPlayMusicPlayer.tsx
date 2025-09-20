"use client";

// ** Tat ca cac component nao goi truc tiep ButtonPlayMusicPlayer thi can phai co use client

/**
 * ButtonPlayMusicPlayer - Music player button with analytics tracking
 * 
 * Usage example:
 * <ButtonPlayMusicPlayer
 *   url={nft.previewAudioUrl}
 *   trackName={nft.name}
 *   imageUrl={nft.sideAImage}
 *   nftId={nft.id} // Required for player analytics tracking
 * />
 */

import React, { FC, ReactNode } from "react";
import iconPlaying from "@/images/icon-playing.gif";
import PostTypeFeaturedIcon from "@/components/PostTypeFeaturedIcon";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
import Image from "next/image";

export interface ButtonPlayMusicPlayerProps {
  className?: string;
  url: string;
  trackName?: string;
  imageUrl?: string;
  nftId?: string; // Add NFT ID for analytics tracking
  renderChildren?: (playing: boolean) => ReactNode;
  renderDefaultBtn?: () => ReactNode;
  renderPlayingBtn?: () => ReactNode;
}

// ** Tat ca cac component nao goi truc tiep ButtonPlayMusicPlayer thi can phai co use client **

const ButtonPlayMusicPlayer: FC<ButtonPlayMusicPlayerProps> = ({
  className = "",
  url,
  trackName = "",
  imageUrl = "",
  nftId = "",
  renderChildren,
  renderDefaultBtn,
  renderPlayingBtn,
}) => {
  const {
    url: currentUrl,
    setUrl,
    setPlaying,
    playing,
    setLoaded,
    setPlayed,
    setLoadedSeconds,
    setPlayedSeconds,
    setTrackName,
    setImageUrl,
    setNftId,
  } = useMusicPlayer();

  const isCurrentTrack = currentUrl === url;

  const handleClickNewAudio = () => {
    console.log("Starting new track:", url);
    setLoaded(0);
    setPlayed(0);
    setLoadedSeconds(0);
    setPlayedSeconds(0);
    setUrl(url);
    setTrackName(trackName);
    setImageUrl(imageUrl);
    setNftId(nftId); // Set NFT ID for tracking
    setPlaying(true);
  };

  const handleClickButton = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Button clicked, current track:", isCurrentTrack ? "yes" : "no");
    if (!isCurrentTrack) {
      handleClickNewAudio();
    } else {
      setPlaying(!playing);
    }
  };

  const _renderDefaultBtn = () => {
    if (renderDefaultBtn) {
      return renderDefaultBtn();
    }
    return (
      <PostTypeFeaturedIcon
        className="z-20 hover:scale-105 transform cursor-pointer transition-transform"
        postType="audio"
      />
    );
  };

  const _renderPlayingBtn = () => {
    // RENDER DEFAULT IF IT NOT CURRENT
    if (!isCurrentTrack) {
      return _renderDefaultBtn();
    }

    // RENDER WHEN IS CURRENT
    if (renderPlayingBtn) {
      return renderPlayingBtn();
    }

    return (
      <span className="z-10 bg-neutral-900 bg-opacity-60 rounded-full flex items-center justify-center text-xl text-white border border-white w-11 h-11 cursor-pointer">
        <Image className="w-5" src={iconPlaying} alt="paused" />
      </span>
    );
  };

  return (
    <div
      className={`nc-ButtonPlayMusicPlayer select-none ${className}`}
      onClick={handleClickButton}
      data-nc-id="ButtonPlayMusicPlayer"
    >
      {renderChildren ? (
        renderChildren(isCurrentTrack && playing)
      ) : (
        <>{isCurrentTrack && playing ? _renderPlayingBtn() : _renderDefaultBtn()}</>
      )}
    </div>
  );
};

export default ButtonPlayMusicPlayer;
