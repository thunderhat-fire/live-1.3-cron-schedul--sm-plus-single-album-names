'use client'

import React, { useState, FC, useEffect, Fragment, useCallback } from 'react'
import {
	Dialog,
	DialogBackdrop,
	Popover,
	PopoverButton,
	PopoverPanel,
	Transition,
	RadioGroup
} from '@headlessui/react'
import ButtonPrimary from '@/shared/Button/ButtonPrimary'
import ButtonThird from '@/shared/Button/ButtonThird'
import ButtonClose from '@/shared/ButtonClose/ButtonClose'
import Checkbox from '@/shared/Checkbox/Checkbox'
import Slider from 'rc-slider'
import Radio from '@/shared/Radio/Radio'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

// DEMO DATA
const typeOfSales = [
	{
		name: '70% Funded',
	},
	{
		name: 'New',
	},
]

const fileTypes = [
	{
		name: '12inch',
		displayName: '12 inch'
	},
	{
		name: '7inch',
		displayName: '7 inch'
	},
	{
		name: 'Digital',
		displayName: 'Digital'
	},
]

const sortOrderRadios = [
	{ name: "Recently Listed", id: "Recently-listed" },
	{ name: "Ending Soon", id: "Ending-soon" },
	{ name: "Most Favorited", id: "Most-favorited" },
]

export interface TabFiltersProps {
	onRecordSizeChange?: (recordSize: string) => void;
	onSaleTypeChange?: (saleType: string) => void;
	onSortOrderChange?: (sortOrder: string) => void;
	onVerifiedCreatorChange?: (isVerified: boolean) => void;
	initialSortOrder?: string;
	initialRecordSize?: string;
}

interface CheckboxProps {
	name: string;
	label: string;
	defaultChecked?: boolean;
	onChange: (checked: boolean) => void;
}

const TabFilters: FC<TabFiltersProps> = ({ 
	onRecordSizeChange, 
	onSaleTypeChange,
	onSortOrderChange,
	onVerifiedCreatorChange,
	initialSortOrder = 'Recently-listed',
	initialRecordSize = ''
}): JSX.Element => {
	const [isOpenMoreFilter, setisOpenMoreFilter] = useState(false)
	const [isVerifiedCreator, setIsVerifiedCreator] = useState(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('plusCreatorsFilter');
			return saved ? JSON.parse(saved) : false;
		}
		return false;
	});
	const [selectedRecordTypes, setSelectedRecordTypes] = useState<string[]>(() => {
		return initialRecordSize ? initialRecordSize.split(',').filter(Boolean) : [];
	});
	const [saleTypeStates, setSaleTypeStates] = useState<string[]>([])
	const [tempSaleTypeStates, setTempSaleTypeStates] = useState<string[]>([])
	const [sortOrderStates, setSortOrderStates] = useState(initialSortOrder)
	const [isLoading, setIsLoading] = useState(false)
	const [tempVerifiedState, setTempVerifiedState] = useState(isVerifiedCreator)

	// Initialize sort order state from prop
	useEffect(() => {
		if (sortOrderStates !== initialSortOrder) {
			setSortOrderStates(initialSortOrder);
		}
	}, [initialSortOrder, sortOrderStates]);

	// Update record types when initialRecordSize changes
	useEffect(() => {
		const newRecordTypes = initialRecordSize ? initialRecordSize.split(',').filter(Boolean) : [];
		setSelectedRecordTypes(newRecordTypes);
	}, [initialRecordSize]);

	// Load filter state from localStorage on mount and sync with parent
	useEffect(() => {
		const savedState = localStorage.getItem('plusCreatorsFilter');
		if (savedState !== null) {
			const isVerified = JSON.parse(savedState);
			setIsVerifiedCreator(isVerified);
			setTempVerifiedState(isVerified);
			if (onVerifiedCreatorChange) {
				onVerifiedCreatorChange(isVerified);
			}
		}
	}, [onVerifiedCreatorChange]);

	// Keep temp state in sync with actual state
	useEffect(() => {
		setTempVerifiedState(isVerifiedCreator);
	}, [isVerifiedCreator]);

	// Keep temp sale type state in sync with actual state
	useEffect(() => {
		setTempSaleTypeStates(saleTypeStates);
	}, [saleTypeStates]);

	const handleVerifiedCreatorChange = useCallback(async (checked: boolean) => {
		setIsLoading(true);
		try {
			setIsVerifiedCreator(checked);
			localStorage.setItem('plusCreatorsFilter', JSON.stringify(checked));
			if (onVerifiedCreatorChange) {
				await onVerifiedCreatorChange(checked);
			}
		} finally {
			setIsLoading(false);
		}
	}, [onVerifiedCreatorChange]);

	// Handle sort order changes
	const handleSortOrderChange = (value: string) => {
		setSortOrderStates(value);
		if (onSortOrderChange) {
			onSortOrderChange(value);
		}
	};

	const closeModalMoreFilter = () => setisOpenMoreFilter(false)
	const openModalMoreFilter = () => setisOpenMoreFilter(true)

	//
	const handleRecordTypeChange = (checked: boolean, recordType: string) => {
		let newTypes: string[];
		if (checked) {
			newTypes = [...selectedRecordTypes, recordType];
		} else {
			newTypes = selectedRecordTypes.filter(type => type !== recordType);
		}
		setSelectedRecordTypes(newTypes);
		
		// Immediately call parent callback with the new filter
		if (onRecordSizeChange) {
			onRecordSizeChange(newTypes.join(','));
		}
	};

	const handleApplyRecordTypes = (close: () => void) => {
		close();
	};

	const handleChangeSaleType = (checked: boolean, name: string) => {
		const newSaleTypes = checked
			? [...tempSaleTypeStates, name]
			: tempSaleTypeStates.filter((i) => i !== name)
		
		setTempSaleTypeStates(newSaleTypes);
		// Don't call the callback immediately - wait for Apply button
	}

	// OK
	const renderXClear = () => {
		return (
			<span className="ml-3 flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary-500 text-white">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-3 w-3"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fillRule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clipRule="evenodd"
					/>
				</svg>
			</span>
		)
	}

	// OK
	const renderTabsTypeOfSales = () => {
		return (
			<Popover className="relative">
				{({ open, close }) => (
					<>
						<PopoverButton
							className={`flex items-center justify-center rounded-full border px-4 py-2 text-sm focus:outline-none ${
								open
									? '!border-primary-500'
									: 'border-neutral-300 dark:border-neutral-700'
							} ${
								!!saleTypeStates.length
									? '!border-primary-500 bg-primary-50 text-primary-900'
									: 'border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500'
							} `}
						>
							<svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
								<path
									d="M10 6.575L9.10838 8.125C8.90838 8.46666 9.07505 8.75 9.46672 8.75H10.525C10.925 8.75 11.0834 9.03333 10.8834 9.375L10 10.925"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M6.91672 15.0333V14.0667C5.00005 12.9083 3.42505 10.65 3.42505 8.25C3.42505 4.125 7.21672 0.891671 11.5 1.825C13.3834 2.24167 15.0334 3.49167 15.8917 5.21667C17.6334 8.71667 15.8 12.4333 13.1084 14.0583V15.025C13.1084 15.2667 13.2 15.825 12.3084 15.825H7.71672C6.80005 15.8333 6.91672 15.475 6.91672 15.0333Z"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M7.08325 18.3333C8.99159 17.7917 11.0083 17.7917 12.9166 18.3333"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>

							<span className="ml-2">Sale Types</span>
							{!saleTypeStates.length ? (
								<ChevronDownIcon className="ml-3 h-4 w-4" />
							) : (
								<span onClick={() => setSaleTypeStates([])}>
									{renderXClear()}
								</span>
							)}
						</PopoverButton>

						<PopoverPanel
							className={`absolute left-0 mt-3 w-screen max-w-sm px-4 transition duration-200 ease-out sm:px-0 lg:max-w-md`}
							style={{ zIndex: 999 }}
						>
							<div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
								<div className="relative flex flex-col space-y-5 px-5 py-6">
									<Checkbox
										name="All Sale Types"
										label="All Sale Types"
										defaultChecked={tempSaleTypeStates.includes('All Sale Types')}
										onChange={(checked) =>
											handleChangeSaleType(checked, 'All Sale Types')
										}
									/>
									<div className="w-full border-b border-neutral-200 dark:border-neutral-700" />
									{typeOfSales.map((item) => (
										<div key={item.name} className="">
											<Checkbox
												name={item.name}
												label={item.name}
												defaultChecked={tempSaleTypeStates.includes(item.name)}
												onChange={(checked) =>
													handleChangeSaleType(checked, item.name)
												}
											/>
										</div>
									))}
								</div>
								<div className="flex items-center justify-between bg-neutral-50 p-5 dark:border-t dark:border-neutral-800 dark:bg-neutral-900">
									<ButtonThird
										onClick={() => {
											close()
											setSaleTypeStates([])
											setTempSaleTypeStates([])
										}}
										sizeClass="px-4 py-2 sm:px-5"
									>
										Clear
									</ButtonThird>
									<ButtonPrimary onClick={() => {
										setSaleTypeStates(tempSaleTypeStates);
										if (onSaleTypeChange) {
											onSaleTypeChange(tempSaleTypeStates[0] || '');
										}
										close();
									}} sizeClass="px-4 py-2 sm:px-5">
										Apply
									</ButtonPrimary>
								</div>
							</div>
						</PopoverPanel>
					</>
				)}
			</Popover>
		)
	}

	// OK
	const renderTabVerifiedCreator = () => {
		return (
			<div className="relative flex items-center justify-center">
				<Popover className="relative">
					{({ open, close }: { open: boolean; close: () => void }) => (
						<>
							<PopoverButton
								className={`flex items-center justify-center rounded-full border px-4 py-2 text-sm focus:outline-none ${
									open
										? '!border-primary-500'
										: 'border-neutral-300 dark:border-neutral-700'
								} ${
									isVerifiedCreator
										? '!border-primary-500 bg-primary-50 text-primary-900'
										: 'border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500'
								}`}
							>
								{isLoading ? (
									<span className="flex items-center">
										<svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Filtering...
									</span>
								) : (
									<>
										<svg
											className="h-4 w-4"
											viewBox="0 0 24 24"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
												stroke="currentColor"
												strokeWidth="1.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
											<path
												d="M7.75 12L10.58 14.83L16.25 9.17004"
												stroke="currentColor"
												strokeWidth="1.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
										<span className="ml-2">Plus Creators Only</span>
										{isVerifiedCreator ? (
											<span onClick={() => handleVerifiedCreatorChange(false)}>
												{renderXClear()}
											</span>
										) : (
											<ChevronDownIcon className="ml-3 h-4 w-4" />
										)}
									</>
								)}
							</PopoverButton>

							<PopoverPanel className="absolute z-40 w-screen max-w-[240px] px-4 sm:px-0">
								<div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
									<div className="flex flex-col space-y-5 p-5">
										<Checkbox
											name="Plus Creators Only"
											label="Show Plus Creators Only"
											defaultChecked={tempVerifiedState}
											onChange={(checked) => setTempVerifiedState(checked)}
										/>
										<div className="text-xs text-neutral-500">
											Only show Albums from Plus subscription creators
										</div>
									</div>
									<div className="flex items-center justify-between bg-neutral-50 p-5 dark:border-t dark:border-neutral-800 dark:bg-neutral-900">
										<ButtonThird
											onClick={() => {
												setTempVerifiedState(false);
												handleVerifiedCreatorChange(false);
												close();
											}}
											sizeClass="px-4 py-2 sm:px-5"
										>
											Clear
										</ButtonThird>
										<ButtonPrimary
											onClick={() => {
												handleVerifiedCreatorChange(tempVerifiedState);
												close();
											}}
											sizeClass="px-4 py-2 sm:px-5"
										>
											Apply
										</ButtonPrimary>
									</div>
								</div>
							</PopoverPanel>
						</>
					)}
				</Popover>
			</div>
		);
	};

	// OK
	const renderMoreFilterItem = (
		data: {
			name: string
			description?: string
			defaultChecked?: boolean
		}[],
	) => {
		const list1 = data.filter((_, i) => i < data.length / 2)
		const list2 = data.filter((_, i) => i >= data.length / 2)
		return (
			<div className="grid grid-cols-2 gap-8">
				<div className="flex flex-col space-y-5">
					{list1.map((item) => (
						<Checkbox
							key={item.name}
							name={item.name}
							subLabel={item.description}
							label={item.name}
							defaultChecked={!!item.defaultChecked}
						/>
					))}
				</div>
				<div className="flex flex-col space-y-5">
					{list2.map((item) => (
						<Checkbox
							key={item.name}
							name={item.name}
							subLabel={item.description}
							label={item.name}
							defaultChecked={!!item.defaultChecked}
						/>
					))}
				</div>
			</div>
		)
	}

	// FOR RESPONSIVE MOBILE
	const renderTabMobileFilter = () => {
		return (
			<div>
				<div
					className={`flex lg:hidden items-center justify-center px-4 py-2 text-sm rounded-full border focus:outline-none cursor-pointer ${
						isOpenMoreFilter
							? 'border-2 border-primary-500 bg-primary-50 text-primary-900'
							: 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
					}`}
					onClick={openModalMoreFilter}
				>
					<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M22 6.5H16" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M6 6.5H2" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M10 10C11.933 10 13.5 8.433 13.5 6.5C13.5 4.567 11.933 3 10 3C8.067 3 6.5 4.567 6.5 6.5C6.5 8.433 8.067 10 10 10Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M22 17.5H18" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M8 17.5H2" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M14 21C15.933 21 17.5 19.433 17.5 17.5C17.5 15.567 15.933 14 14 14C12.067 14 10.5 15.567 10.5 17.5C10.5 19.433 12.067 21 14 21Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					<span className="ml-2">More filters</span>
				</div>

				<Dialog
					as="div"
					className="fixed inset-0 z-50 overflow-y-auto"
					open={isOpenMoreFilter}
					onClose={closeModalMoreFilter}
				>
					<div className="min-h-screen text-center">
						<div className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-40" />

						{/* This element is to trick the browser into centering the modal contents. */}
						<span
							className="inline-block h-screen align-middle"
							aria-hidden="true"
						>
							&#8203;
						</span>

						<div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl dark:bg-neutral-900 dark:border dark:border-neutral-700">
							<div className="relative flex-shrink-0 border-b border-neutral-200 px-6 py-4 text-center dark:border-neutral-800">
								<Dialog.Title
									as="h3"
									className="text-lg font-medium leading-6 text-gray-900"
								>
									Albums filters
								</Dialog.Title>
								<span className="absolute left-3 top-3">
									<ButtonClose onClick={closeModalMoreFilter} />
								</span>
							</div>

							<div className="flex-grow overflow-y-auto">
								<div className="divide-y divide-neutral-200 px-8 dark:divide-neutral-800 md:px-10">
									{/* --------- */}
									{/* ---- */}
									<div className="py-7">
										<h3 className="text-xl font-medium">Sale Types</h3>
										<div className="relative mt-6">
											{renderMoreFilterItem(typeOfSales)}
										</div>
									</div>
								</div>
							</div>

							<div className="flex flex-shrink-0 items-center justify-between bg-neutral-50 p-6 dark:border-t dark:border-neutral-800 dark:bg-neutral-900">
								<ButtonThird
									onClick={() => {
										setSaleTypeStates([])
										setTempSaleTypeStates([])
										closeModalMoreFilter()
									}}
									sizeClass="px-4 py-2 sm:px-5"
								>
									Clear
								</ButtonThird>
								<ButtonPrimary
									onClick={closeModalMoreFilter}
									sizeClass="px-4 py-2 sm:px-5"
								>
									Apply
								</ButtonPrimary>
							</div>
						</div>
					</div>
				</Dialog>
			</div>
		)
	}

	return (
		<div className="flex lg:space-x-4">
			{/* FOR DESKTOP */}
			<div className="hidden space-x-4 lg:flex">
				{renderTabsTypeOfSales()}
				{renderTabVerifiedCreator()}
			</div>

			{/* FOR RESPONSIVE MOBILE */}
			<div className="flex space-x-4 overflow-x-auto lg:hidden">
				{renderTabMobileFilter()}
			</div>
		</div>
	)
}

export default TabFilters
