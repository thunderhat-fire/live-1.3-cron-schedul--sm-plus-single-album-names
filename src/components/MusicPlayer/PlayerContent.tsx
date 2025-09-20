import React, { FC, useState, useEffect } from 'react'
import NcImage from '@/shared/NcImage/NcImage'
import { Transition } from '@/app/headlessui'
import { useMusicPlayer } from '@/hooks/useMusicPlayer'
import { useRadio } from '@/contexts/RadioContext'
import Link from 'next/link'
import { PauseIcon, PlayIcon } from '@heroicons/react/24/solid'
import { ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline'

export interface PlayerContentProps {
	isError: boolean
	handleSeekMouseUp: (
		e:
			| React.MouseEvent<HTMLInputElement, MouseEvent>
			| React.TouchEvent<HTMLInputElement>,
	) => void
	handleSeekMouseDown: (
		e:
			| React.MouseEvent<HTMLInputElement, MouseEvent>
			| React.TouchEvent<HTMLInputElement>,
	) => void
	handleSeekChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	handleVolumeChange: (e: number) => void
	handleSetPlaybackRate: (e: 1 | 1.5 | 2) => void
	handleSetMuted: (e: boolean) => void
	handleClickBackwards10Sec: () => void
	handleClickForwards15Sec: () => void
}

const PlayerContent: FC<PlayerContentProps> = ({
	isError,
	handleSeekMouseUp,
	handleSeekMouseDown,
	handleSeekChange,
	handleVolumeChange,
	handleSetPlaybackRate,
	handleSetMuted,
	handleClickBackwards10Sec,
	handleClickForwards15Sec,
}) => {
	// Use RadioContext for the actual playback control
	const { radioState, advanceToNextTrack, goToPreviousTrack, togglePlayPause } = useRadio()
	
	// Keep music player for some UI state, but use radio for navigation
	const {
		duration,
		loaded,
		muted,
		playbackRate,
		played,
		playing,
		setPlaying,
		volume,
		playedSeconds,
		url,
		setUrl,
		trackName,
		imageUrl,
		setTrackName,
		setImageUrl,
		setNftId,
		playlist,
		setPlaylist,
	} = useMusicPlayer()

	const [isShowContentOnMobile, setIsShowContentOnMobile] = useState(false)
	const [search, setSearch] = useState("");
	const [filteredTracks, setFilteredTracks] = useState<any[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);

	useEffect(() => {
		const fetchPlaylistData = async () => {
			try {
				console.log('🎵 PlayerContent: Fetching radio status to sync with active playlist...');
				
				// Try radio status first
				const statusResponse = await fetch('/api/radio/status');
				const statusData = await statusResponse.json();
				
				console.log('🎵 PlayerContent: Radio status response:', statusData);
				
				if (statusData.success && statusData.playlist && statusData.playlist.length > 0) {
					console.log('🎵 PlayerContent: Setting playlist from radio status:', statusData.playlist.length, 'tracks');
					setPlaylist(statusData.playlist);
					return;
				}
				
				// Fallback to playlist API if radio status doesn't have playlist
				console.warn('🎵 PlayerContent: Radio status has no playlist, trying playlist API...');
				const playlistResponse = await fetch('/api/radio/playlist');
				const playlistData = await playlistResponse.json();
				
				console.log('🎵 PlayerContent: Playlist API response:', playlistData);
				
				if (playlistData && playlistData.tracks && playlistData.tracks.length > 0) {
					console.log('🎵 PlayerContent: Setting playlist from playlist API:', playlistData.tracks.length, 'tracks');
					// Transform playlist API data to match radio status format
					const transformedTracks = playlistData.tracks.map((track: any) => ({
						id: track.id || track.nftId,
						name: track.nft?.name || track.trackTitle || 'Unknown Track',
						artist: track.nft?.user?.name || 'Unknown Artist',
						albumArt: track.nft?.sideAImage || '/images/default-track-image.jpg',
						duration: track.duration || 0,
						genre: track.nft?.genre || 'Unknown',
						recordLabel: track.nft?.recordLabel || 'Independent',
						isAd: track.isAd || false,
						isIntro: track.isIntro || false,
						nftId: track.nftId // Keep NFT ID for tracking
					}));
					setPlaylist(transformedTracks);
				} else {
					console.error('🎵 PlayerContent: No valid playlist data found from either API');
				}
				
			} catch (error) {
				console.error('🎵 PlayerContent: Error fetching radio data:', error);
			}
		};
		
		fetchPlaylistData();
	}, [setPlaylist]);

	useEffect(() => {
		if (search.length > 0) {
			const lower = search.toLowerCase();
			setFilteredTracks(
				playlist.filter(track =>
					(track.name && track.name.toLowerCase().includes(lower)) ||
					(track.genre && track.genre.toLowerCase().includes(lower))
				)
			);
			setShowDropdown(true);
		} else {
			setFilteredTracks([]);
			setShowDropdown(false);
		}
	}, [search, playlist]);

	const handleSelectTrack = (track: any) => {
		console.log('🎵 PlayerContent handleSelectTrack called with:', track);
		console.log('🎵 Track structure - id:', track.id, 'name:', track.name, 'artist:', track.artist);
		console.log('🎵 Track albumArt:', track.albumArt);
		
		// Handle tracks from radio status API - these have a different structure
		if (track && track.name) {
			console.log('🎵 Setting track in music player:', track.name);
			
			// Use the radio audio stream endpoint to get current audio
			setUrl('/api/radio/audio-stream');
			setTrackName(track.name);
			setImageUrl(track.albumArt || '/images/default-track-image.jpg');
			
			// For radio tracks, we need to extract the NFT ID properly
			// Radio status tracks might have different ID structure
			let nftIdToUse = '';
			if (track.nftId) {
				nftIdToUse = track.nftId;
			} else if (track.id && track.id.length > 20) {
				// If the ID looks like an NFT ID (longer), use it
				nftIdToUse = track.id;
			}
			
			setNftId(nftIdToUse);
			console.log('🎵 Music player track set with NFT ID:', nftIdToUse);
		} else {
			console.error('🎵 Invalid track data for music player:', track);
		}
		
		setSearch('');
		setShowDropdown(false);
	};

	const getConvertTime = (sec: number) => {
		let minutes = Math.floor(sec / 60)
		let seconds = `${Math.floor(sec - minutes * 60)}`

		if (Number(seconds) < 10) {
			seconds = '0' + seconds
		}
		return minutes + ':' + seconds
	}

	const handleClickToggle = () => {
		// Use RadioContext for play/pause instead of local state
		togglePlayPause()
	}

	const handleClickClose = () => {
		setPlaying(false)
		setUrl('')
	}

	const renderLeft = () => {
		return (
			<div className="mr-2 flex flex-grow items-center overflow-hidden lg:flex-shrink-0 lg:basis-52">
				<Link
					href={'/'}
					className="relative flex h-14 items-center space-x-2 overflow-hidden pl-12 sm:h-16 sm:space-x-3"
				>
					<NcImage
						fill
						sizes="3rem"
						containerClassName={`absolute left-0 w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 transition-transform nc-animation-spin rounded-full ${
							playing ? 'playing' : ''
						}`}
						src={imageUrl || '/images/default-track-image.jpg'}
						className="h-full w-full rounded-full object-cover shadow-md"
						alt={trackName || "Album cover"}
					/>
					<div className="flex-grow overflow-hidden">
						<h3 className="truncate text-sm font-medium sm:text-base">
							{trackName || (url ? url.split('/').pop() : 'No track selected')}
						</h3>
						<span className="block text-xs text-neutral-500 dark:text-neutral-400">
							NFT Music
						</span>
					</div>
				</Link>
			</div>
		)
	}

	const renderDurationTime = () => {
		return (
			<div className="absolute left-0 top-0 w-full h-1 flex flex-col justify-end">
				<div className="h-1 relative">
					<input
						className="slider absolute z-10 opacity-0 inset-0 h-1 w-full cursor-pointer"
						type="range"
						min={0}
						max={0.999999}
						step="any"
						value={played}
						onMouseDown={handleSeekMouseDown}
						onTouchStart={handleSeekMouseDown}
						onChange={handleSeekChange}
						onMouseUp={handleSeekMouseUp}
						onTouchEnd={handleSeekMouseUp}
					/>
					<div className="absolute h-full left-0 top-0 bg-neutral-200 dark:bg-neutral-600" style={{ width: `${loaded * 100}%` }}></div>
					<div className="absolute h-full left-0 top-0 bg-primary-500" style={{ width: `${played * 100}%` }}>
						<span className="absolute -right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary-500 z-20"></span>
					</div>
				</div>
			</div>
		)
	}

	const renderButtonControl = () => {
		return (
			<div className="flex items-center justify-center space-x-3">
				<button
					className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700"
					onClick={goToPreviousTrack}
					title="Previous track"
				>
					<svg width="24" height="24" fill="none" viewBox="0 0 24 24">
						<path
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
							d="M6 6L6 18"
						></path>
						<path
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
							d="M8 12L18 6L18 18L8 12Z"
						></path>
					</svg>
				</button>
				<button
					className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700"
					onClick={handleClickToggle}
				>
					{radioState.isPlaying ? (
						<PauseIcon className="w-8 h-8" />
					) : (
						<PlayIcon className="w-8 h-8" />
					)}
				</button>
				<button
					className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700"
					onClick={advanceToNextTrack}
					title="Next track"
				>
					<svg width="24" height="24" fill="none" viewBox="0 0 24 24">
						<path
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
							d="M18 6L18 18"
						></path>
						<path
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
							d="M16 12L6 18L6 6L16 12Z"
						></path>
					</svg>
				</button>
			</div>
		)
	}

	const renderContentCenter = () => {
		return (
			<div className="flex flex-col items-center justify-center relative">
				<div className="flex items-center justify-center space-x-3">
					{renderButtonControl()}
					{/* Desktop-only search input */}
					<div className="relative">
						<input
							type="text"
							className="hidden lg:block ml-4 px-3 py-1 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-500"
							placeholder="search by genre/title"
							value={search}
							onChange={e => setSearch(e.target.value)}
							onFocus={() => search && setShowDropdown(true)}
						/>
						{showDropdown && filteredTracks.length > 0 && (
							<div className="absolute left-0 mt-1 w-64 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
								{filteredTracks.map((track, idx) => (
									<div
										key={track.id}
										className="flex items-center px-3 py-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700"
										onClick={() => handleSelectTrack(track)}
									>
										<img
											src={track.nft?.sideAImage || track.nft?.imageUrl || '/images/default-track-image.jpg'}
											alt={track.name}
											className="w-8 h-8 rounded object-cover mr-3"
										/>
										<div>
											<div className="font-medium text-sm truncate">{track.name}</div>
											<div className="text-xs text-neutral-500 truncate">{track.artist} • {track.genre}</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		)
	}

	const renderVolumn = () => {
		return (
			<div className="hidden lg:flex items-center justify-center space-x-2">
				<button
					onClick={() => {
						if (!volume) {
							handleSetMuted(false)
							handleVolumeChange(0.8)
							return
						}
						handleSetMuted(!muted)
					}}
				>
					{!!volume && !muted && volume >= 0.5 && (
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
							<path
								d="M2 10V14C2 16 3 17 5 17H6.43C6.8 17 7.17 17.11 7.49 17.3L10.41 19.13C12.93 20.71 15 19.56 15 16.59V7.41003C15 4.43003 12.93 3.29003 10.41 4.87003L7.49 6.70003C7.17 6.89003 6.8 7.00003 6.43 7.00003H5C3 7.00003 2 8.00003 2 10Z"
								stroke="currentColor"
								strokeWidth="1.5"
							/>
							<path
								d="M18 8C19.78 10.37 19.78 13.63 18 16"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M19.83 5.5C22.72 9.35 22.72 14.65 19.83 18.5"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					)}
					{!!volume && !muted && volume < 0.5 && (
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
							<path
								d="M3.33 10V14C3.33 16 4.33 17 6.33 17H7.76C8.13 17 8.5 17.11 8.82 17.3L11.74 19.13C14.26 20.71 16.33 19.56 16.33 16.59V7.41003C16.33 4.43003 14.26 3.29003 11.74 4.87003L8.82 6.70003C8.5 6.89003 8.13 7.00003 7.76 7.00003H6.33C4.33 7.00003 3.33 8.00003 3.33 10Z"
								stroke="currentColor"
								strokeWidth="1.5"
							/>
							<path
								d="M19.33 8C21.11 10.37 21.11 13.63 19.33 16"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					)}
					{(!volume || muted) && (
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
							<path
								d="M15 8.37003V7.41003C15 4.43003 12.93 3.29003 10.41 4.87003L7.49 6.70003C7.17 6.89003 6.8 7.00003 6.43 7.00003H5C3 7.00003 2 8.00003 2 10V14C2 16 3 17 5 17H6.43C6.8 17 7.17 17.11 7.49 17.3L10.41 19.13C12.93 20.71 15 19.56 15 16.59V15.63"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M22 12C22 16.97 17.97 21 13 21L15.77 18.23"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M13 3C17.97 3 22 7.03 22 12L15.77 5.77002"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					)}
				</button>
				<div className="relative ml-3.5 w-24 flex-shrink-0">
					<input
						className="slider absolute inset-0 z-10 h-1 w-full cursor-pointer opacity-0"
						type="range"
						min={0}
						max={0.999999}
						step="any"
						value={volume}
						onChange={(e) => {
							handleVolumeChange(parseFloat(e.currentTarget.value))
							handleSetMuted(false)
						}}
					/>
					<div className="absolute left-0 top-1/2 h-0.5 w-full min-w-0 -translate-y-1/2 rounded-full bg-neutral-300 dark:bg-neutral-500"></div>
					<div
						className={`absolute left-0 top-1/2 h-0.5 min-w-0 -translate-y-1/2 rounded-full ${
							!volume || muted ? 'bg-neutral-400' : 'bg-primary-500'
						}`}
						style={{ width: volume * 100 + '%' }}
					>
						<span
							className={`absolute -right-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${
								!volume || muted ? 'bg-neutral-400' : 'bg-primary-500'
							}`}
						></span>
					</div>
				</div>
			</div>
		)
	}

	const renderClose = () => {
		return (
			<button
				className="focus:shadow-outline flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full hover:bg-neutral-100 focus:outline-none dark:hover:bg-neutral-700/80 md:h-12 md:w-12"
				onClick={handleClickClose}
			>
				<XMarkIcon className="h-6 w-6" />
			</button>
		)
	}

	const renderTiming = () => {
		return (
			<div className="ml-5 mr-3 hidden flex-shrink-0 items-center justify-center text-xs tracking-widest lg:flex">
				<div className="min-w-[40px] flex-shrink-0 truncate text-right">
					{getConvertTime(Math.floor(playedSeconds))}
				</div>
				/
				<div className="min-w-[40px] flex-shrink-0 truncate">
					{getConvertTime(Math.floor(duration))}
				</div>
			</div>
		)
	}

	return (
		<>
			<Transition
				as={'div'}
				className="nc-shadow relative z-0 flex w-full flex-col bg-white px-2 dark:bg-neutral-800 sm:px-3"
				show={!!url}
				enter="transition-transform duration-150"
				enterFrom="translate-y-full"
				enterTo="translate-y-0"
				leave="transition-transform duration-150"
				leaveFrom="translate-y-0"
				leaveTo="translate-y-full"
			>
				{/* BUTTON TOGGLE CONTENT ON MOBILE */}
				<button
					className="absolute -top-3 right-0 z-20 flex h-6 w-[26px] items-center justify-center lg:hidden"
					onClick={() => setIsShowContentOnMobile(!isShowContentOnMobile)}
				>
					<div className="nc-shadow flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-neutral-800">
						<ChevronUpIcon
							className={`h-4 w-4 ${isShowContentOnMobile ? 'rotate-180' : ''}`}
						/>
					</div>
				</button>

				{renderDurationTime()}

				<div className="flex h-16 w-full justify-between sm:h-20">
					{/* LEFT */}
					{renderLeft()}

					{/* CENTER */}
					<div className="hidden flex-grow items-center justify-center px-5 lg:flex">
						{isError ? (
							<span className="flex pl-2 text-xs text-red-500 lg:text-sm">
								This track not found or not supported.
							</span>
						) : (
							renderContentCenter()
						)}
					</div>

					{/* RENDER RIGHT */}
					<div className="ml-2 flex flex-shrink-0 items-center justify-end lg:flex-grow lg:basis-52">
						{renderVolumn()}
						{renderTiming()}
						{renderClose()}
					</div>
				</div>

				<Transition
					className="z-0 flex h-16 justify-center border-t border-neutral-300 transition-all dark:border-neutral-700 lg:hidden"
					enter="duration-150"
					enterFrom="-mb-16"
					enterTo="mb-0"
					leave="duration-150"
					leaveFrom="mb-0"
					leaveTo="-mb-16"
					as="div"
					show={isShowContentOnMobile}
				>
					<div className="flex max-w-xs flex-grow items-center justify-evenly text-neutral-500 dark:text-neutral-300 sm:max-w-sm md:max-w-md">
						{renderContentCenter()}
					</div>
				</Transition>
			</Transition>
		</>
	)
}

export default PlayerContent
