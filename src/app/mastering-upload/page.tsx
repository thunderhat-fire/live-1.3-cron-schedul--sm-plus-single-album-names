'use client';

import React, { useEffect, useState } from "react";
import Label from "@/components/Label/Label";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import ButtonSecondary from "@/shared/Button/ButtonSecondary";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

interface MasteringRequest {
  id: string;
  originalTrackUrl: string;
  masteredTrackUrl?: string;
  status: string;
  createdAt: string;
}

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (quantity: number) => void;
  isLoading: boolean;
}

const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({ 
  isOpen, 
  onClose, 
  onPurchase, 
  isLoading 
}) => {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  const totalCost = quantity * 5; // £5 per credit

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Purchase AI Mastering Credits</h2>
        
        <div className="space-y-4">
          <div>
            <Label>Number of Credits</Label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="mt-2 block w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2"
              disabled={isLoading}
            >
              {[1, 2, 3, 4, 5, 10, 15, 20, 25].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'credit' : 'credits'} - £{num * 5}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span>Credits:</span>
              <span className="font-medium">{quantity}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span>Price per credit:</span>
              <span className="font-medium">£5.00</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center font-bold">
              <span>Total:</span>
              <span>£{totalCost}.00</span>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              💡 Each credit allows you to master one audio track with our AI mastering service.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <ButtonSecondary
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </ButtonSecondary>
          <ButtonPrimary
            onClick={() => onPurchase(quantity)}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Processing...' : `Purchase £${totalCost}`}
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
};

function MasteringUploadPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<MasteringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const credits = session?.user?.aiMasteringCredits ?? 0;
  const isEligible = true; // Allow all tiers to access mastering upload

  useEffect(() => {
    if (!session) {
      router.push('/login?redirect=/mastering-upload');
      return;
    }

    // No subscription gate – users can purchase credits on this page regardless of tier

    fetchRequests();

    // Check for purchase success/cancel messages
    const purchaseStatus = searchParams?.get('purchase');
    if (purchaseStatus === 'success') {
      toast.success('Credits purchased successfully! Your account has been updated.');
      setSuccess('Credits purchased successfully! Your account has been updated.');
      
      // Force aggressive session update
      console.log('🔄 Forcing session update after credit purchase...');
      console.log('Credits before update:', session?.user?.aiMasteringCredits);
      
      // Update session multiple times to ensure it refreshes
      update().then(() => {
        console.log('✅ First session update complete');
        // Force a second update after a short delay
        setTimeout(() => {
          console.log('🔄 Second session update...');
          update().then(() => {
            console.log('✅ Second session update complete');
            console.log('Credits after updates:', session?.user?.aiMasteringCredits);
            
            // Force a page reload if session still doesn't update
            setTimeout(() => {
              if ((session?.user?.aiMasteringCredits ?? 0) <= 0) {
                console.log('⚠️ Session still not updated, forcing page reload');
                window.location.reload();
              }
            }, 2000);
          });
        }, 1000);
      });
      
      // Clean up URL
      router.replace('/mastering-upload');
    } else if (purchaseStatus === 'cancelled') {
      toast.error('Credit purchase was cancelled.');
      // Clean up URL
      router.replace('/mastering-upload');
    }
  }, [session, isEligible, router, success, searchParams, update]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mastering-request');
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch mastering requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async (quantity: number) => {
    setPurchaseLoading(true);
    try {
      const response = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout');
      setPurchaseLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['audio/wav', 'audio/x-wav', 'audio/mp3', 'audio/mpeg', 'audio/flac', 'audio/aiff'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please upload a valid audio file (WAV, MP3, FLAC, or AIFF)');
        setFile(null);
        return;
      }

      // Validate file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (selectedFile.size > maxSize) {
        setError('File size must be under 100MB');
        setFile(null);
        return;
      }

      setError(null);
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || credits <= 0) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('track', file);

      const response = await fetch('/api/mastering-request', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess('Track uploaded successfully! Your mastering request has been submitted.');
      setFile(null);
      toast.success('Track uploaded for mastering!');
      
      // Reset file input
      const fileInput = document.getElementById('track-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Force session update to reflect new credit count
      await update();
      
      // Refresh requests to show the new one
      fetchRequests();

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  // Removed gating UI; all users stay on page

  return (
    <div className="container py-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">🎵 AI Mastering Upload</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Upload your tracks for professional AI mastering. You have <strong>{credits}</strong> credits remaining.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-6">Upload Track for Mastering</h2>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <p className="text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <Label>Select Audio File</Label>
            <input
              id="track-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              disabled={credits <= 0 || uploading}
              className="mt-2 block w-full text-sm text-neutral-500 dark:text-neutral-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100
                dark:file:bg-primary-900/20 dark:file:text-primary-400
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Supported formats: WAV, MP3, FLAC, AIFF (Max 100MB)
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              - You can buy more credits when you reach 0 available
            </p>
          </div>

          {file && (
            <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
              <h3 className="font-medium mb-2">Selected File:</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                <strong>Name:</strong> {file.name}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                <strong>Size:</strong> {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                <strong>Type:</strong> {file.type}
              </p>
            </div>
          )}

          {/* Purchase credits prompt */}
          {credits <= 0 && (
            <div className="text-center">
              <ButtonPrimary type="button" onClick={() => setShowPurchaseModal(true)}>
                Purchase Credits (£5 each)
              </ButtonPrimary>
            </div>
          )}

          <div className="flex gap-4">
            <ButtonPrimary
              type="submit"
              disabled={credits <= 0 || uploading || !file}
              className="flex-1"
            >
              {uploading ? 'Uploading...' : `Upload for Mastering (${credits} credits left)`}
            </ButtonPrimary>
          </div>
        </form>
      </div>

      {/* Credit purchase modal */}
      <CreditPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={handlePurchaseCredits}
        isLoading={purchaseLoading}
      />
    </div>
  );
}

export default MasteringUploadPage;