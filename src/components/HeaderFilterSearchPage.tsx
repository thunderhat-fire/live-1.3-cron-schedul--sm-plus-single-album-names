'use client'

import React, { FC, useState, useEffect } from 'react'
import Nav from '@/shared/Nav/Nav'
import NavItem from '@/shared/NavItem/NavItem'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import ButtonPrimary from '@/shared/Button/ButtonPrimary'
import TabFilters from '@/components/TabFilters'
import { Transition } from '@/app/headlessui'

const GENRES = [
	'Ambient',
	'Classical',
	'Country',
	'Dub',
	'Drum & Bass',
	'Folk',
	'Hip Hop',
	'House',
	'Jazz',
	'Metal',
	'Pop',
	'Punk',
	'R&B',
	'Reggae',
	'Rock',
	'Soul',
	'Techno'
].sort();

export interface HeaderFilterSearchPageProps {
	className?: string;
	onGenreChange?: (genre: string) => void;
	onRecordSizeChange?: (recordSize: string) => void;
	onSaleTypeChange?: (saleType: string) => void;
	onSortOrderChange?: (sortOrder: string) => void;
	onVerifiedCreatorChange?: (isVerified: boolean) => void;
	initialGenre?: string;
	initialSortOrder?: string;
	initialRecordSize?: string;
}

const HeaderFilterSearchPage: FC<HeaderFilterSearchPageProps> = ({
	className = 'mb-12',
	onGenreChange,
	onRecordSizeChange,
	onSaleTypeChange,
	onSortOrderChange,
	onVerifiedCreatorChange,
	initialGenre = 'All Genres',
	initialSortOrder = 'Recently-listed',
	initialRecordSize = ''
}) => {
	const [isOpen, setIsOpen] = useState(true)
	const [selectedGenre, setSelectedGenre] = useState(initialGenre)

	useEffect(() => {
		if (initialGenre !== selectedGenre) {
			setSelectedGenre(initialGenre);
		}
	}, [initialGenre, selectedGenre]);

	const handleGenreSelect = (genre: string) => {
		console.log('Genre selected:', genre);
		setSelectedGenre(genre);
		if (onGenreChange) {
			const genreValue = genre === 'All Genres' ? '' : genre;
			console.log('Calling onGenreChange with:', genreValue);
			onGenreChange(genreValue);
		}
	};

	return (
		<div className={`relative flex flex-col ${className}`}>
			<div className="flex flex-col justify-between space-y-6 lg:flex-row lg:items-center lg:space-x-2 lg:space-y-0">
				<div className="w-full">
					<div className="grid grid-cols-6 gap-2">
						<button
							onClick={() => handleGenreSelect('All Genres')}
							className={`col-span-6 mb-4 flex items-center justify-center rounded-full border px-4 py-2 text-sm focus:outline-none ${
								selectedGenre === 'All Genres'
									? 'border-primary-500 bg-primary-50 text-primary-900'
									: 'border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500'
							}`}
						>
							All Genres
						</button>
						{GENRES.map((genre, index) => (
							<button
								key={index}
								onClick={() => handleGenreSelect(genre)}
								className={`flex items-center justify-center rounded-full border px-4 py-2 text-sm focus:outline-none ${
									selectedGenre === genre
										? 'border-primary-500 bg-primary-50 text-primary-900'
										: 'border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500'
								}`}
							>
								{genre}
							</button>
						))}
					</div>
				</div>
			</div>
			<div className="w-full border-b border-neutral-200 dark:border-neutral-700 mt-4" />
			<div className="flex items-center justify-between py-4">
				<div className="flex items-center space-x-4">
					<Transition
						show={isOpen}
						enter="transition-opacity duration-150"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="transition-opacity duration-150"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
						as="div"
					>
						<TabFilters 
							onRecordSizeChange={onRecordSizeChange}
							onSaleTypeChange={onSaleTypeChange}
							onSortOrderChange={onSortOrderChange}
							onVerifiedCreatorChange={onVerifiedCreatorChange}
							initialSortOrder={initialSortOrder}
							initialRecordSize={initialRecordSize}
						/>
					</Transition>
					<ButtonPrimary 
						className="ml-4"
						onClick={() => setIsOpen(!isOpen)}
					>
						<span>Filter</span>
						<ChevronDownIcon className={`w-4 h-4 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
					</ButtonPrimary>
				</div>
			</div>
		</div>
	)
}

export default HeaderFilterSearchPage
