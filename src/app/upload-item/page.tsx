"use client";

import React, { FC, useState, useEffect } from "react";
import Label from "@/components/Label/Label";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import Input from "@/shared/Input/Input";
import Textarea from "@/shared/Textarea/Textarea";
import FormItem from "@/components/FormItem";
import { RadioGroup } from "@headlessui/react";
import MySwitch from "@/components/MySwitch";
import ButtonSecondary from "@/shared/Button/ButtonSecondary";
import NcImage from "@/shared/NcImage/NcImage";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";


const MAX_TRACKS_12_INCH = 5; // 5 tracks per side for 12-inch vinyl
const MAX_DURATION_12_INCH = 22 * 60; // 22 minutes in seconds
const MAX_TRACKS_7_INCH = 2; // 2 tracks per side for 7-inch vinyl  
const MAX_DURATION_7_INCH = 4 * 60; // 4 minutes in seconds

interface AudioTrack {
  file: File | null;
  name: string;
  duration: number;
  isrc?: string;
  previewUrl?: string;
}

interface VinylSide {
  image: File | null;
  imagePreview: string;
  imageUrl: string;
  tracks: AudioTrack[];
  totalDuration: number;
}

interface FormData {
  name: string;
  description: string;
  externalLink: string;
  genre: string;
  recordSize: string;
  recordLabel: string;
  price: number;
  endDate: string;
  sideA: VinylSide;
  sideB: VinylSide;
  targetOrders: number;
  extendPresaleToFourWeeks: boolean; // New field for Gold tier extension
}

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

const RECORD_SIZES = [
  '12 inch',
  '7 inch'
];

const getBaseFileName = (fileName: string) => {
  return fileName.replace(/\.[^/.]+$/, '');
};

const defaultFormData: FormData = {
  name: '',
  description: '',
  externalLink: '',
  genre: '',
  recordSize: '',
  recordLabel: '',
  price: 0,
  endDate: '',
  sideA: {
    image: null,
    imagePreview: '',
    imageUrl: '',
    tracks: [],
    totalDuration: 0
  },
  sideB: {
    image: null,
    imagePreview: '',
    imageUrl: '',
    tracks: [],
    totalDuration: 0
  },
  targetOrders: 100,
  extendPresaleToFourWeeks: false
};

interface Address {
  name: string;
  street: string;
  city: string;
  postcode: string;
  country: string;
  paypal: string;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  address: Address;
  setAddress: React.Dispatch<React.SetStateAction<Address>>;
  isUploading: boolean;
}

const AddressModal: React.FC<AddressModalProps> = ({ isOpen, onClose, onSubmit, address, setAddress, isUploading }) => {
  console.log('Rendering AddressModal', { isOpen, address });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">We now need your address</h2>
        <p className="mb-4 text-neutral-700">On success of the Album PreSale you will be sent a Test Pressing - to approve for main run.</p>
        <form onSubmit={onSubmit}>
          <input
            className="input w-full mb-2 border p-2 rounded"
            placeholder="Full Name"
            value={address.name}
            onChange={e => setAddress({ ...address, name: e.target.value })}
            required
          />
          <input
            className="input w-full mb-2 border p-2 rounded"
            placeholder="Street Address"
            value={address.street}
            onChange={e => setAddress({ ...address, street: e.target.value })}
            required
          />
          <input
            className="input w-full mb-2 border p-2 rounded"
            placeholder="City"
            value={address.city}
            onChange={e => setAddress({ ...address, city: e.target.value })}
            required
          />
          <input
            className="input w-full mb-2 border p-2 rounded"
            placeholder="Postcode"
            value={address.postcode}
            onChange={e => setAddress({ ...address, postcode: e.target.value })}
            required
          />
          <input
            className="input w-full mb-2 border p-2 rounded"
            placeholder="Country"
            value={address.country}
            onChange={e => setAddress({ ...address, country: e.target.value })}
            required
          />
          <input
            className="input w-full mb-2 border p-2 rounded"
            placeholder="PayPal Email Address"
            type="email"
            value={address.paypal}
            onChange={e => setAddress({ ...address, paypal: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="text-gray-500" onClick={() => { console.log('Cancel clicked'); onClose(); }} disabled={isUploading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isUploading} onClick={() => console.log('Submit button clicked')}>Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PageUploadItem = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [showPayAsYouGoModal, setShowPayAsYouGoModal] = useState(false);
  const [isProcessingPayAsYouGo, setIsProcessingPayAsYouGo] = useState(false);
  const MAX_DESCRIPTION_WORDS = 500;
  const countWords = (str: string) => str.trim().split(/\s+/).filter(Boolean).length;

  console.log("Form Data:", formData); // Debug form data
  console.log("Record Size:", formData.recordSize, "Price:", formData.price); // Debug pricing
  console.log("Tracks Side A:", formData.sideA.tracks); // Debug Side A tracks
  console.log("Tracks Side B:", formData.sideB.tracks); // Debug Side B tracks

    useEffect(() => {
    const checkUploadPermissions = async () => {
      if (status === 'unauthenticated') {
        router.push('/login');
        return;
      } else if (status === 'authenticated') {
        try {
          console.log('🔍 Checking upload permissions from database...');
          const response = await fetch('/api/user/upload-permissions');
          const data = await response.json();
          
          if (!response.ok) {
            console.error('❌ Failed to check permissions:', data.error);
            setError('Failed to check upload permissions');
            return;
          }
          
          console.log('📊 Upload permissions result:', data);
          console.log('🔍 User credits:', data.userData?.payAsYouGoCredits);
          console.log('🔍 Can upload:', data.canUpload);
          console.log('🔍 Requires action:', data.requiresAction);
          
                     if (!data.canUpload) {
             setError(data.reason);
             
             // Show pay-as-you-go modal if that's what's needed
             if (data.requiresAction === 'pay_as_you_go') {
               console.log('🚨 Showing pay-as-you-go modal - user has', data.userData?.payAsYouGoCredits, 'credits');
               setShowPayAsYouGoModal(true);
             } else if (data.requiresAction === 'subscription') {
               router.push('/subscription');
             } else if (data.requiresAction === 'record_label') {
               router.push('/account');
             }
             return;
           }
          
          // User can upload, set the record label from session
          if (session?.user?.recordLabel) {
            setFormData(prev => ({
              ...prev,
              recordLabel: session.user.recordLabel || ''
            }));
          }
          
        } catch (error) {
          console.error('❌ Error checking upload permissions:', error);
          setError('Failed to check upload permissions');
        }
      }
    };

    checkUploadPermissions();
  }, [status, router, session]);

  // Set record label from session when available
  useEffect(() => {
    if (session?.user?.recordLabel) {
      setFormData(prev => ({
        ...prev,
        recordLabel: session.user.recordLabel || ''
      }));
    }
  }, [session?.user?.recordLabel]);

  // Handle success parameter from Stripe redirect
  useEffect(() => {
    const payAsYouGoSuccess = searchParams?.get('pay_as_you_go');
    if (payAsYouGoSuccess === 'success') {
      console.log('🎉 Pay-as-you-go payment successful! Refreshing session...');
      setSuccess('Payment successful! You now have 1 pay-as-you-go credit and can create presales.');
      
      // Refresh the session to get updated user data
      update().then(() => {
        console.log('✅ Session refreshed, checking user credits...');
        // Force a recheck of upload permissions after session refresh
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });
      
      // Remove the success parameter from URL to prevent reload loop
      const url = new URL(window.location.href);
      url.searchParams.delete('pay_as_you_go');
      window.history.replaceState({}, '', url.toString());
    } else if (payAsYouGoSuccess === 'cancelled') {
      setError('Payment was cancelled. You can try again or upgrade to a higher tier.');
      // Remove the cancelled parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('pay_as_you_go');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, update]);

  // Update price when record size changes
  useEffect(() => {
    if (formData.recordSize) {
      let newPrice: number;
      if (formData.recordSize === '7 inch') {
        newPrice = 13; // Fixed price for 7-inch
      } else {
        // 12-inch tiered pricing
        newPrice = 26;
        if (formData.targetOrders === 200) newPrice = 22;
        if (formData.targetOrders === 500) newPrice = 20;
      }
      
      console.log(`Updating price: recordSize=${formData.recordSize}, targetOrders=${formData.targetOrders}, newPrice=${newPrice}`);
      
      if (formData.price !== newPrice) {
        setFormData(prev => ({ ...prev, price: newPrice }));
      }
    }
  }, [formData.recordSize, formData.targetOrders]);

  const getTrackLimits = () => {
    // Ensure string comparison is case-insensitive and trim whitespace
    const recordSize = formData.recordSize?.trim().toLowerCase();
    
    if (recordSize === '7 inch') {
      return {
        maxTracks: MAX_TRACKS_7_INCH,
        maxDuration: MAX_DURATION_7_INCH,
        maxDurationMinutes: 4
      };
    }
    
    // Default to 12-inch limits for '12 inch' or any other value (including empty)
    return {
      maxTracks: MAX_TRACKS_12_INCH, // Should be 5 tracks
      maxDuration: MAX_DURATION_12_INCH, // Should be 22 minutes
      maxDurationMinutes: 22
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for external link
    if (name === 'externalLink') {
      let formattedLink = value.trim();
      // Remove any existing protocol
      formattedLink = formattedLink.replace(/^https?:\/\//, '');
      // Remove any trailing slashes
      formattedLink = formattedLink.replace(/\/$/, '');
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedLink
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSwitchChange = (name: string) => (enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: enabled
    }));
  };

  const handlePayAsYouGoPurchase = async () => {
    setIsProcessingPayAsYouGo(true);
    try {
      console.log('🔄 Starting pay-as-you-go purchase...');
      console.log('🔄 Session data:', session);
      
      const response = await fetch('/api/pay-as-you-go-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('🔄 Response status:', response.status);
      console.log('🔄 Response headers:', response.headers);
      
      const data = await response.json();
      console.log('🔄 Response data:', data);
      
      if (data.success && data.url) {
        console.log('🔄 Redirecting to Stripe checkout:', data.url);
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error('🔄 API error:', data.error);
        setError(data.error || 'Failed to start pay-as-you-go payment');
      }
    } catch (err) {
      console.error('🔄 Pay-as-you-go purchase error:', err);
      setError('Failed to start pay-as-you-go payment');
    } finally {
      setIsProcessingPayAsYouGo(false);
    }
  };

  const validateAudioFile = async (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        URL.revokeObjectURL(audio.src);
        resolve(duration);
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(audio.src);
        reject(new Error('Invalid audio file'));
      });
    });
  };

  const validateImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      // Create a blob URL for the file
      const objectUrl = URL.createObjectURL(file);
      
      const img = new Image();
      
      // Add error handling for both load and error events
      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
      };
      
      img.onload = () => {
        cleanup();
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = (error) => {
        cleanup();
        console.error('Image load error:', error);
        reject(new Error(`Failed to load image: ${file.name}. Please ensure it's a valid image file.`));
      };
      
      // Set crossOrigin to anonymous to handle CORS issues
      img.crossOrigin = "anonymous";
      img.src = objectUrl;
      
      // Add a timeout to prevent hanging
      setTimeout(() => {
        cleanup();
        reject(new Error('Image load timed out. Please try again.'));
      }, 10000); // 10 second timeout
    });
  };

  const handleVinylImageChange = async (side: 'sideA' | 'sideB', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        throw new Error(`Image file is too large. Maximum size is 10MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types are: ${allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`);
      }

      // Validate image dimensions
      console.log(`Validating dimensions for ${side} image:`, file.name);
      const dimensions = await validateImageDimensions(file);
      console.log(`Image dimensions for ${side}:`, dimensions);
      
      if (dimensions.width < 1500 || dimensions.height < 1500) {
        throw new Error(`Image dimensions must be at least 1500x1500 pixels. Current dimensions: ${dimensions.width}x${dimensions.height}`);
      }

      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);

      // Create FormData for upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'artwork');
      uploadFormData.append('nftId', 'temp');
      uploadFormData.append('side', side === 'sideA' ? 'a' : 'b');
      uploadFormData.append('albumTitle', formData.name);

      console.log(`Uploading ${side} image to server:`, file.name);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to upload image: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Successfully uploaded ${side} image:`, data);

      // Update form data with both preview and uploaded URL
      setFormData(prev => ({
        ...prev,
        [side]: {
          ...prev[side],
          image: file,
          imagePreview: previewUrl,
          imageUrl: data.url
        }
      }));

      setError(null);
    } catch (err: any) {
      console.error(`Error handling ${side} image upload:`, err);
      
      // Clean up any preview URL if it exists
      if (formData[side].imagePreview) {
        URL.revokeObjectURL(formData[side].imagePreview);
      }
      
      setError(err.message || 'Failed to upload image');
      
      // Clear the file input to allow retrying with the same file
      e.target.value = '';
      
      // Reset the form data for this side
      setFormData(prev => ({
        ...prev,
        [side]: {
          ...prev[side],
          image: null,
          imagePreview: '',
          imageUrl: ''
        }
      }));
    }
  };

  const handleAudioTrackChange = async (side: 'sideA' | 'sideB', index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file type
      const allowedTypes = ['audio/wav', 'audio/flac', 'audio/mpeg'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only WAV, FLAC, or MP3 files are allowed');
      }

      // Get audio duration
      const duration = await validateAudioFile(file);

      // Get current limits based on record size
      const limits = getTrackLimits();
      
      // Check if adding this track would exceed the side's track limit
      const currentSide = formData[side];
      // Count only tracks that actually have files (not empty slots)
      const tracksWithFiles = currentSide.tracks.filter(track => track.file !== null).length;
      
      // Debug logging
      console.log(`handleAudioTrackChange - Record Size: "${formData.recordSize}", maxTracks: ${limits.maxTracks}, total slots: ${currentSide.tracks.length}, tracks with files: ${tracksWithFiles}`);
      if (tracksWithFiles >= limits.maxTracks) {
        throw new Error(`Cannot add track: Side ${side === 'sideA' ? 'A' : 'B'} already has maximum number of tracks (${limits.maxTracks})`);
      }

      // Check if adding this track would exceed the side's duration limit
      const newTotalDuration = currentSide.totalDuration + duration;
      if (newTotalDuration > limits.maxDuration) {
        const remainingTime = limits.maxDuration - currentSide.totalDuration;
        const remainingMinutes = Math.floor(remainingTime / 60);
        const remainingSeconds = Math.floor(remainingTime % 60);
        throw new Error(
          `Cannot add track: Side ${side === 'sideA' ? 'A' : 'B'} would exceed ${limits.maxDurationMinutes} minutes.\n` +
          `Current duration: ${formatDuration(currentSide.totalDuration)}\n` +
          `Track duration: ${formatDuration(duration)}\n` +
          `Remaining time available: ${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`
        );
      }

      // Create preview URL for audio
      const previewUrl = URL.createObjectURL(file);

      setFormData(prev => {
        const newTracks = [...prev[side].tracks];
        newTracks[index] = {
          file,
          name: file.name,
          duration,
          previewUrl
        };

        return {
          ...prev,
          [side]: {
            ...prev[side],
            tracks: newTracks,
            totalDuration: newTotalDuration
          }
        };
      });

    } catch (error: any) {
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const removeTrack = (side: 'sideA' | 'sideB', index: number) => {
    setFormData(prev => {
      const newTracks = [...prev[side].tracks];
      const removedTrack = newTracks[index];
      newTracks.splice(index, 1);

      return {
        ...prev,
        [side]: {
          ...prev[side],
          tracks: newTracks,
          totalDuration: prev[side].totalDuration - (removedTrack?.duration || 0)
        }
      };
    });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleFinalStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    // setShowAddressModal(true); // This state was removed
    // handleAddressSubmit(); // This function was removed
    handleSubmit(); // Call the original handleSubmit logic
  };

  // Remove handleAddressSubmit and handleSubmitWithAddress
  const handleSubmit = async () => {
    try {
      setIsUploading(true);
      console.log('Submitting form data:', formData); // Debug
      
      // Calculate pre-sale end date
      // Default: 20 days, Gold tier extension: 28 days (4 weeks)
      const endDate = new Date();
      const presaleDays = formData.extendPresaleToFourWeeks ? 28 : 20;
      endDate.setTime(endDate.getTime() + (presaleDays * 24 * 60 * 60 * 1000));
      
      const price = formData.recordSize === '7 inch' ? 13 : 22;
      // ...track upload logic as before...
      const trackUploadPromises = [
        ...formData.sideA.tracks.map(async (track) => {
          const trackUploadFormData = new FormData();
          if (!track.file) throw new Error(`Missing file for track: ${track.name}`);
          trackUploadFormData.append('file', track.file);
          trackUploadFormData.append('type', 'master');
          trackUploadFormData.append('nftId', 'temp');
          trackUploadFormData.append('side', 'a');
          trackUploadFormData.append('albumTitle', formData.name);
          const response = await fetch('/api/upload', { method: 'POST', body: trackUploadFormData });
          if (!response.ok) throw new Error(`Failed to upload track ${track.name}`);
          return response.json();
        }),
        ...formData.sideB.tracks.map(async (track) => {
          const trackUploadFormData = new FormData();
          if (!track.file) throw new Error(`Missing file for track: ${track.name}`);
          trackUploadFormData.append('file', track.file);
          trackUploadFormData.append('type', 'master');
          trackUploadFormData.append('nftId', 'temp');
          trackUploadFormData.append('side', 'b');
          trackUploadFormData.append('albumTitle', formData.name);
          const response = await fetch('/api/upload', { method: 'POST', body: trackUploadFormData });
          if (!response.ok) throw new Error(`Failed to upload track ${track.name}`);
          return response.json();
        })
      ];
      const trackData = await Promise.all(trackUploadPromises);
      const missingUrls = trackData.filter(data => !data.url);
      if (missingUrls.length > 0) throw new Error('Some tracks failed to upload properly');
      const nftData = {
        name: formData.name,
        description: formData.description,
        externalLink: formData.externalLink,
        genre: formData.genre,
        recordSize: formData.recordSize,
        recordLabel: formData.recordLabel,
        sideAImage: formData.sideA.imageUrl,
        sideBImage: formData.sideB.imageUrl,
        sideATracks: formData.sideA.tracks.map((track, index) => ({
          name: track.name,
          url: trackData[index].url,
          duration: track.duration,
          isrc: track.isrc || null
        })),
        sideBTracks: formData.sideB.tracks.map((track, index) => ({
          name: track.name,
          url: trackData[index + formData.sideA.tracks.length].url,
          duration: track.duration,
          isrc: track.isrc || null
        })),
        price: price,
        endDate: endDate.toISOString(),
        targetOrders: formData.targetOrders,
        isVinylPresale: true,
        // addressName: address.name, // address state was removed
        // addressStreet: address.street, // address state was removed
        // addressCity: address.city, // address state was removed
        // addressPostcode: address.postcode, // address state was removed
        // addressCountry: address.country, // address state was removed
        // addressPaypal: address.paypal, // address state was removed
      };
      console.log('NFT Data being sent:', nftData);
      const nftResponse = await fetch('/api/nft/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nftData),
      });
      if (!nftResponse.ok) {
        const errorData = await nftResponse.json();
        throw new Error(errorData.error || 'Failed to create Album');
      }
      const nftDataResponse = await nftResponse.json();
      console.log('🎉 NFT creation response:', nftDataResponse);
      setSuccess('Vinyl Album created successfully!');
      
      // Refresh the session to get updated user data (including decremented credits)
      await update();
      
      // Refresh radio playlist to include the new album
      try {
        await fetch('/api/radio/refresh', { method: 'POST' });
        console.log('Radio playlist refreshed with new album');
      } catch (error) {
        console.error('Failed to refresh radio playlist:', error);
      }
      
      router.push(`/nft-detail/${nftDataResponse.nft.id}` as any);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create Album';
      setError(errorMessage);
      
      // Check if this is a pay-as-you-go error
      if (errorMessage.includes('Pay-as-you-go credit required')) {
        setShowPayAsYouGoModal(true);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Restore track name editing functionality
  const handleTrackNameChange = (side: 'sideA' | 'sideB', index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => {
      const newTracks = [...prev[side].tracks];
      newTracks[index] = { ...newTracks[index], name: value };
      return {
        ...prev,
        [side]: {
          ...prev[side],
          tracks: newTracks
        }
      };
    });
  };

  // Restore image removal functionality
  const handleRemoveImage = (side: 'sideA' | 'sideB') => {
    setFormData(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        image: null,
        imagePreview: '',
        imageUrl: ''
      }
    }));
  };

  // Restore add track functionality
  const addTrack = (side: 'sideA' | 'sideB') => {
    setFormData(prev => {
      const newTracks = [...prev[side].tracks, { file: null, name: '', duration: 0, isrc: '' }];
      return {
        ...prev,
        [side]: {
          ...prev[side],
          tracks: newTracks
        }
      };
    });
  };

  const handleTrackIsrcChange = (side: 'sideA' | 'sideB', index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setFormData(prev => {
      const newTracks = [...prev[side].tracks];
      newTracks[index] = { ...newTracks[index], isrc: value };
      return {
        ...prev,
        [side]: {
          ...prev[side],
          tracks: newTracks
        }
      };
    });
  };

  const generateTempIsrc = () => {
    const rand = Math.floor(100000 + Math.random() * 900000).toString();
    return `TEMP${rand}`; // placeholder until real registrant code
  };

  const validateForm = () => {
    setError(null);
    setSuccess(null);

    // Check if user has a record label set up
    if (!session?.user?.recordLabel) {
      setError('You must set up your record label in account settings before creating an Album');
      return false;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Album name is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (countWords(formData.description) > MAX_DESCRIPTION_WORDS) {
      setError(`Description must be no more than ${MAX_DESCRIPTION_WORDS} words. Currently: ${countWords(formData.description)} words.`);
      return false;
    }
    if (!formData.genre) {
      setError('Genre is required');
      return false;
    }
    if (!formData.recordSize) {
      setError('Record size is required');
      return false;
    }
    if (!formData.recordLabel.trim()) {
      setError('Record label is required');
      return false;
    }

    // Validate Side A
    if (!formData.sideA.image) {
      setError('Side A artwork is required');
      return false;
    }
    if (formData.sideA.tracks.length === 0) {
      setError('At least one track is required for Side A');
      return false;
    }
    if (formData.sideA.tracks.some(track => !track.file || !track.name.trim())) {
      setError('All tracks on Side A must have a file and name');
      return false;
    }

    // Validate Side B
    if (!formData.sideB.image) {
      setError('Side B artwork is required');
      return false;
    }
    if (formData.sideB.tracks.length === 0) {
      setError('At least one track is required for Side B');
      return false;
    }
    if (formData.sideB.tracks.some(track => !track.file || !track.name.trim())) {
      setError('All tracks on Side B must have a file and name');
      return false;
    }

    // Validate track limits
    const { maxTracks, maxDuration } = getTrackLimits();
    if (formData.sideA.tracks.length > maxTracks || formData.sideB.tracks.length > maxTracks) {
      setError(`Maximum ${maxTracks} tracks allowed per side for ${formData.recordSize}`);
      return false;
    }
    if (formData.sideA.totalDuration > maxDuration || formData.sideB.totalDuration > maxDuration) {
      setError(`Maximum duration of ${maxDuration / 60} minutes allowed per side for ${formData.recordSize}`);
      return false;
    }

    return true;
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  const renderVinylSide = (side: 'sideA' | 'sideB') => {
    const { maxTracks, maxDurationMinutes } = getTrackLimits();
    const sideData = formData[side];
    const tracks = sideData.tracks;
    
    // Debug logging to help identify the issue
    console.log(`renderVinylSide - Side: ${side}, Record Size: "${formData.recordSize}", maxTracks: ${maxTracks}, current tracks: ${tracks.length}`);

    return (
      <div className="space-y-6">
        <FormItem label="Vinyl Artwork *" desc={`Upload the artwork for ${side === 'sideA' ? 'Side A' : 'Side B'}`}>
          <div className="mt-5 flex justify-center rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700 px-6 py-8">
            <div className="space-y-1 text-center">
              {sideData.imagePreview ? (
                <div className="relative">
                  <img
                    src={sideData.imagePreview}
                    alt={`Vinyl artwork for ${side === 'sideA' ? 'Side A' : 'Side B'}`}
                    className="w-full h-auto max-w-xs mx-auto rounded-2xl object-cover"
                  />
                  <button
                    className="absolute top-2 right-2 bg-white dark:bg-neutral-900 rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    onClick={() => handleRemoveImage(side)}
                    type="button"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className="mx-auto h-12 w-12 text-neutral-400">
                    <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex text-sm text-neutral-6000 dark:text-neutral-300">
                    <label className="relative cursor-pointer rounded-md font-medium text-primary-6000 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>Upload a file</span>
                      <input
                        required
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={(e) => handleVinylImageChange(side, e)}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    PNG, JPG, GIF up to 10MB
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    Artwork must be at least 1500x1500 pixels.
                  </p>
                </>
              )}
            </div>
          </div>
        </FormItem>

        <FormItem 
          label="Tracks *" 
          desc={`Add up to ${maxTracks} tracks (max ${maxDurationMinutes} minutes per side)`}
        >
          <div className="space-y-3">
            {tracks.map((track, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  required
                  type="text"
                  placeholder="Track name"
                  value={track.name}
                  onChange={(e) => handleTrackNameChange(side, index, e)}
                  className="flex-grow"
                />
                {/* removed ISRC field and generator button */}

                <div className="flex-shrink-0 w-24">
                  <label className="relative cursor-pointer rounded-md font-medium text-primary-6000 hover:text-primary-500">
                    <span className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg block text-center">
                      {track.file ? formatDuration(track.duration) : 'Upload'}
                    </span>
                    <input
                      required
                      type="file"
                      className="sr-only"
                      accept="audio/*"
                      onChange={(e) => handleAudioTrackChange(side, index, e)}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeTrack(side, index)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {tracks.length < maxTracks && (
            <ButtonSecondary
              type="button"
              onClick={() => addTrack(side)}
              className="mt-3"
            >
              Add Track
            </ButtonSecondary>
          )}

          
        </FormItem>
      </div>
    );
  };

  return (
    <div className={`nc-PageUploadItem`}>
      <div className="container">
        <div className="my-12 sm:lg:my-16 lg:my-24 max-w-4xl mx-auto space-y-8 sm:space-y-10">
          {/* HEADING */}
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-semibold">
              Create Vinyl Presale Album
            </h2>
            <span className="block mt-3 text-neutral-500 dark:text-neutral-400">
              Upload your vinyl sides and audio tracks
            </span>
          </div>



          <hr className="w-full border-t-2 border-neutral-100 dark:border-neutral-700" />

          <form onSubmit={handleFinalStep} className="mt-10 md:mt-0 space-y-5 sm:space-y-6 md:sm:space-y-8">
            {/* Basic Info Section */}
            <div className="space-y-6">
              <FormItem label="Album Name *" desc="This will be the title of your Album">
                <Input
                  required
                  placeholder="Enter album name"
                  value={formData.name}
                  onChange={handleChange}
                  name="name"
                />
              </FormItem>
              <FormItem label="External Link" desc="Optional: Link to your website or social media">
                <Input
                  placeholder="Enter external link (optional)"
                  value={formData.externalLink}
                  onChange={handleChange}
                  name="externalLink"
                />
              </FormItem>
              <FormItem label="Description *" desc="Detailed description of your album">
                <Textarea
                  required
                  rows={6}
                  className="mt-1.5"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={handleChange}
                  name="description"
                  maxLength={5000}
                />
                <div className="text-xs text-neutral-500 mt-1">
                  {countWords(formData.description)} / {MAX_DESCRIPTION_WORDS} words
                </div>
              </FormItem>
              <FormItem label="Genre *" desc="Select the primary genre of your album">
                <select
                  required
                  className="nc-Select h-11 block w-full text-sm rounded-2xl border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900"
                  value={formData.genre}
                  onChange={handleChange}
                  name="genre"
                >
                  <option value="">Select genre</option>
                  {GENRES.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </FormItem>
              <FormItem label="Record Size *" desc="Choose your vinyl format">
                <RadioGroup
                  value={formData.recordSize}
                  onChange={(value) => setFormData(prev => ({ ...prev, recordSize: value }))}
                  className="flex gap-4"
                >
                  {RECORD_SIZES.map((size) => (
                    <RadioGroup.Option key={size} value={size}>
                      {({ checked }) => (
                        <span className={`cursor-pointer inline-flex items-center px-4 py-2 rounded-full border ${checked ? 'bg-primary-600 border-primary-600 text-white' : 'border-neutral-200 dark:border-neutral-700'}`}>
                          {size}
                        </span>
                      )}
                    </RadioGroup.Option>
                  ))}
                </RadioGroup>
              </FormItem>
              <FormItem label="Record Label" desc="Your record label will be displayed on the Album">
                <div className="flex items-center space-x-2">
                  {session?.user?.recordLabelImage && (
                    <img
                      src={session.user.recordLabelImage}
                      alt="Record Label"
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <Input
                    placeholder={session?.user?.recordLabel ? "Enter record label name" : "Please set up your record label in account settings"}
                    value={formData.recordLabel}
                    name="recordLabel"
                    onChange={(e) => setFormData(prev => ({ ...prev, recordLabel: e.target.value }))}
                    readOnly={!session?.user?.recordLabel}
                    className={!session?.user?.recordLabel ? "bg-red-50 dark:bg-red-900/10" : ""}
                  />
                </div>
                <p className="mt-2 text-sm text-neutral-500">
                  {session?.user?.recordLabel ? (
                    <>This is automatically set from your profile. You can edit it here or change the default in your <a href="/account" className="text-primary-600 hover:text-primary-500">account settings</a>.</>
                  ) : (
                    <span className="text-red-500">You must first set up your record label in your <a href="/account" className="underline">account settings</a> before creating an Album.</span>
                  )}
                </p>
              </FormItem>
            </div>

            <div className="w-full border-b-2 border-neutral-100 dark:border-neutral-700"></div>

            {/* Vinyl Sides Grid Container */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Vinyl Side A */}
              <div>
                <h3 className="text-lg font-semibold mb-6">Side A</h3>
                {renderVinylSide('sideA')}
              </div>

              {/* Vinyl Side B */}
              <div>
                <h3 className="text-lg font-semibold mb-6">Side B</h3>
                {renderVinylSide('sideB')}
              </div>
            </div>

            <div className="w-full border-b-2 border-neutral-100 dark:border-neutral-700"></div>

            {/* Track Summary Section */}
            <div className="space-y-6">
              <h3 className="text-lg sm:text-2xl font-semibold">Track Summary</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium mb-2">Side A Tracks:</h4>
                  {formData.sideA.tracks.length > 0 ? (
                    formData.sideA.tracks.map((track, index) => (
                      <div key={index} className="flex items-center space-x-4 p-2 border rounded-lg mb-2">
                        <div className="flex-1">
                          <div className="font-medium">{getBaseFileName(track.name)}</div>
                          <div className="text-sm text-neutral-500">{formatDuration(track.duration)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-500">No tracks uploaded yet</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Side B Tracks:</h4>
                  {formData.sideB.tracks.length > 0 ? (
                    formData.sideB.tracks.map((track, index) => (
                      <div key={index} className="flex items-center space-x-4 p-2 border rounded-lg mb-2">
                        <div className="flex-1">
                          <div className="font-medium">{getBaseFileName(track.name)}</div>
                          <div className="text-sm text-neutral-500">{formatDuration(track.duration)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-500">No tracks uploaded yet</p>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group col-span-12">
              <Label>Target Order Quantity</Label>
              <select
                key={formData.recordSize} // Force re-render when record size changes
                className="block w-full text-sm rounded-lg border border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white dark:border-neutral-700 dark:focus:ring-primary-6000 dark:focus:ring-opacity-25 dark:bg-neutral-900"
                value={formData.targetOrders}
                onChange={(e) => {
                  const target = parseInt(e.target.value);
                  let price;
                  
                  // Different pricing for 7-inch vs 12-inch records
                  if (formData.recordSize === '7 inch') {
                    // 7-inch pricing
                    price = 13; // Fixed price for 7-inch regardless of quantity
                  } else {
                    // 12-inch pricing (tiered)
                    price = 26;
                    if (target === 200) price = 22;
                    if (target === 500) price = 20;
                  }
                  
                  setFormData({ ...formData, targetOrders: target, price });
                }}
              >
                {formData.recordSize === '7 inch' ? (
                  // 7-inch options - fixed price
                  <>
                    <option value={100}>100 Records @ PreSale price of £13 per unit</option>
                    <option value={200}>200 Records @ PreSale price of £13 per unit</option>
                    <option value={500}>500 Records @ PreSale price of £13 per unit</option>
                  </>
                ) : (
                  // 12-inch options - tiered pricing
                  <>
                    <option value={100}>100 Records @ PreSale price of £26 per unit</option>
                    <option value={200}>200 Records @ PreSale price of £22 per unit</option>
                    <option value={500}>500 Records @ PreSale price of £20 per unit</option>
                  </>
                )}
              </select>
              <div key={`payout-${formData.recordSize}-${formData.targetOrders}`} className="mt-2 text-green-700 text-sm font-medium">
                {formData.recordSize === '7 inch' ? (
                  // 7-inch payouts (net artist earnings after platform fees)
                  <>
                    {formData.targetOrders === 100 && 'You will be paid £175 on successful presale completion - minus any orders that can\'t be processed'}
                    {formData.targetOrders === 200 && 'You will be paid £350 on successful presale completion - minus any orders that can\'t be processed'}
                    {formData.targetOrders === 500 && 'You will be paid £875 on successful presale completion - minus any orders that can\'t be processed'}
                  </>
                ) : (
                  // 12-inch payouts (net artist earnings after platform fees)
                  <>
                    {formData.targetOrders === 100 && 'You will be paid £260 on successful presale completion - minus any orders that can\'t be processed'}
                    {formData.targetOrders === 200 && 'You will be paid £750 on successful presale completion - minus any orders that can\'t be processed'}
                    {formData.targetOrders === 500 && 'You will be paid £3000 on successful presale completion - minus any orders that can\'t be processed'}
                  </>
                )}
              </div>
              <div className="mt-1">
                <a href="/help-center" className="text-primary-600 hover:underline text-sm">Read more in our FAQ</a>
              </div>
            </div>

            {/* Gold Tier Presale Extension Option */}
            {session?.user?.subscriptionTier === 'gold' && (
              <div className="form-group col-span-12 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-start space-x-3">
                  <input
                    id="extendPresale"
                    type="checkbox"
                    checked={formData.extendPresaleToFourWeeks}
                    onChange={(e) => setFormData({ ...formData, extendPresaleToFourWeeks: e.target.checked })}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="extendPresale" className="text-sm font-medium text-neutral-900 dark:text-neutral-100 cursor-pointer">
                      I want to extend my PreSale to 28 days
                    </label>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Gold tier members can extend their presale period from 20 days to 28 days (4 weeks) for better promotional reach.
                      {formData.extendPresaleToFourWeeks 
                        ? " Your presale will run for 28 days." 
                        : " Your presale will run for the standard 20 days."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row space-y-3 sm:space-y-0 space-x-0 sm:space-x-3">
              <ButtonPrimary type="submit" className="flex-1" disabled={isUploading}>
                {isUploading ? 'Uploading... this may take up to two minutes' : 'Create Vinyl Presale Album'}
              </ButtonPrimary>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative mt-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded relative mt-4" role="alert">
                <span className="block sm:inline">{success}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Pay-as-You-Go Modal */}
      {showPayAsYouGoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Presale Upload Options
            </h3>
            <p className="text-gray-600 mb-6">
              You need either a pay-as-you-go credit (£30) or a higher subscription tier to create presales. 
              Choose your preferred option below.
            </p>
            <div className="space-y-3">
              <button
                onClick={handlePayAsYouGoPurchase}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                disabled={isProcessingPayAsYouGo}
              >
                {isProcessingPayAsYouGo ? 'Processing...' : 'Purchase Pay-as-You-Go Credit (£30)'}
              </button>
              <a
                href="/subscription"
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center block"
                onClick={() => setShowPayAsYouGoModal(false)}
              >
                Upgrade to Higher Tier
              </a>
              <button
                onClick={() => setShowPayAsYouGoModal(false)}
                className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={isProcessingPayAsYouGo}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function CheckIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="currentColor" opacity="0.2" />
      <path
        d="M7 13l3 3 7-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Remove KYC wrapper to allow direct access after onboarding completion

export default PageUploadItem;