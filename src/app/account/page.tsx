'use client';

import React, { useEffect, useState, useRef } from "react";
import Label from "@/components/Label/Label";
import Avatar from "@/shared/Avatar/Avatar";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import Input from "@/shared/Input/Input";
import Textarea from "@/shared/Textarea/Textarea";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const MasteringCreditsSection = () => {
  const { data: session } = useSession();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const credits = session?.user?.aiMasteringCredits ?? 0;
  const isPlus = session?.user?.subscriptionTier === 'plus' || session?.user?.subscriptionTier === 'gold';

  useEffect(() => {
    if (!isPlus) return;
    setLoading(true);
    fetch('/api/mastering-request')
      .then(res => res.json())
      .then(data => {
        setRequests(data.requests || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isPlus, success]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append('track', file);
      const res = await fetch('/api/mastering-request', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSuccess('Track uploaded for mastering!');
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isPlus) return null;

  return (
    <div className="mt-10 md:mt-0 space-y-5 sm:space-y-6 md:sm:space-y-8">
      <div>
        <h3 className="text-lg sm:text-2xl font-semibold">AI Mastering Credits</h3>
        <span className="block mt-3 text-neutral-500 dark:text-neutral-400">
          You have <b>{credits}</b> AI Mastering Credits remaining.
        </span>
      </div>
      <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
      <form onSubmit={handleUpload} className="flex flex-col md:flex-row items-center gap-4">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          disabled={credits <= 0 || uploading}
        />
        <ButtonPrimary type="submit" disabled={credits <= 0 || uploading || !file}>
          {uploading ? 'Uploading...' : 'Upload for Mastering'}
        </ButtonPrimary>
      </form>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
      <div className="mt-6">
        <h4 className="font-semibold mb-2">Your Mastering Requests</h4>
        {loading ? (
          <div>Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-neutral-500">No mastering requests yet.</div>
        ) : (
          <ul className="space-y-2">
            {requests.map((req: any) => (
              <li key={req.id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="font-medium">{new Date(req.createdAt).toLocaleDateString()}</span>
                  <span className="ml-2 text-sm text-neutral-500">Status: {req.status}</span>
                </div>
                <div className="mt-2 md:mt-0 flex gap-2">
                  <a href={req.originalTrackUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">Original</a>
                  {req.status === 'completed' && req.masteredTrackUrl && (
                    <a href={req.masteredTrackUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 underline text-sm">Download Mastered</a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const AccountPage = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    website: '',
    facebook: '',
    twitter: '',
    tiktok: '',
    walletAddress: '',
    image: '',
    recordLabel: '',
    recordLabelImage: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialized = useRef(false);

  // Initialize form data from session
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user && !initialized.current) {
      console.log('Initializing form with session data:', session.user);
      setFormData({
        username: session.user.name || '',
        email: session.user.email || '',
        bio: session.user.bio || '',
        website: session.user.website || '',
        facebook: session.user.facebook || '',
        twitter: session.user.twitter || '',
        tiktok: session.user.tiktok || '',
        walletAddress: session.user.walletAddress || '',
        image: session.user.image || '',
        recordLabel: session.user.recordLabel || '',
        recordLabelImage: session.user.recordLabelImage || ''
      });
      initialized.current = true;
    }
  }, [session, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'profile');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      console.log('Upload response:', data);

      // Update local state and prepare update data
      const updatedFormData = {
        ...formData,
        image: data.url || null
      };
      setFormData(updatedFormData);

      // Prepare the data for the API
      const apiData = {
        username: updatedFormData.username,
        bio: updatedFormData.bio,
        website: updatedFormData.website,
        facebook: updatedFormData.facebook,
        twitter: updatedFormData.twitter,
        tiktok: updatedFormData.tiktok,
        walletAddress: updatedFormData.walletAddress,
        image: updatedFormData.image
      };

      // Update database
      const updateResponse = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update profile with new image');
      }

      const updateData = await updateResponse.json();
      console.log('Update response:', updateData);

      if (session && updateData.user) {
        // Update session with the new user data
        await update({
          ...session,
          user: {
            ...session.user,
            ...updateData.user
          }
        });

        // Wait a bit for the session to update
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Reload the page to ensure all components have the latest data
        window.location.reload();
      }

      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRecordLabelImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'recordLabel');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload record label image');
      }

      const data = await response.json();
      console.log('Upload response:', data);

      setFormData(prev => ({
        ...prev,
        recordLabelImage: data.url || null
      }));

      toast.success('Record label image uploaded successfully');
    } catch (error) {
      console.error('Error uploading record label image:', error);
      toast.error('Failed to upload record label image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRecordLabelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setIsSubmitting(true);
    try {
      const updatedFormData = {
        recordLabel: formData.recordLabel.trim(),
        recordLabelImage: formData.recordLabelImage
      };

      // Validate record label
      if (!updatedFormData.recordLabel) {
        throw new Error('Record label name is required');
      }

      // Update database first
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Record label update error:', errorData);
        throw new Error(errorData.error || 'Failed to update record label');
      }

      const data = await response.json();
      console.log('Record label update response:', data);

      // Update session with the confirmed database state
      await update({
        ...session,
        user: {
          ...session.user,
          ...data.user
        }
      });

      // Wait for session to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reload the page to ensure all components have the latest data
      window.location.reload();

      toast.success('Record label updated successfully');
    } catch (error) {
      console.error('Error updating record label:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update record label');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncRecordLabel = async () => {
    if (!session?.user?.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/sync-record-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Record label sync error:', errorData);
        throw new Error(errorData.error || 'Failed to sync record label');
      }

      const data = await response.json();
      console.log('Record label sync response:', data);

      toast.success(`${data.message} - Page will reload to show updated record labels`);
      
      // Wait a moment then reload the page
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error syncing record label:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync record label');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setIsSubmitting(true);
    try {
      // Update local state immediately for better UX
      const updatedFormData = {
        username: formData.username,
        bio: formData.bio,
        website: formData.website,
        facebook: formData.facebook,
        twitter: formData.twitter,
        tiktok: formData.tiktok,
        walletAddress: formData.walletAddress,
        image: formData.image,
        recordLabel: formData.recordLabel,
        recordLabelImage: formData.recordLabelImage
      };

      // Then update the database first
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Profile update error:', errorData);
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      console.log('Update response:', data);

      // Update session with the confirmed database state
      await update({
        ...session,
        user: {
          ...session.user,
          ...data.user
        }
      });

      // Wait for session to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reload the page to ensure all components have the latest data
      window.location.reload();

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className={`nc-AccountPage`}>
      <div className="container">
        <div className="my-12 sm:lg:my-16 lg:my-24 max-w-4xl mx-auto space-y-8 sm:space-y-10">
          {/* HEADING */}
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-semibold">
              Profile settings
            </h2>
            <span className="block mt-3 text-neutral-500 dark:text-neutral-400">
              You can set preferred display name, create your profile URL and
              manage other personal settings.
            </span>
          </div>
          <div className="w-full border-b-2 border-neutral-100 dark:border-neutral-700"></div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          {/* Profile Update Form remains here */}
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">
            <div className="flex-shrink-0 flex items-start">
              <div className="relative rounded-full overflow-hidden flex">
                <Avatar 
                  key={formData.image || ''}
                  imgUrl={formData.image || undefined}
                  sizeClass="w-32 h-32" 
                />
                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-neutral-50 cursor-pointer">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 30 30"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17.5 5H7.5C6.83696 5 6.20107 5.26339 5.73223 5.73223C5.26339 6.20107 5 6.83696 5 7.5V20M5 20V22.5C5 23.163 5.26339 23.7989 5.73223 24.2678C6.20107 24.7366 6.83696 25 7.5 25H22.5C23.163 25 23.7989 24.7366 24.2678 24.2678C24.7366 23.7989 25 23.163 25 22.5V17.5M5 20L10.7325 14.2675C11.2013 13.7988 11.8371 13.5355 12.5 13.5355C13.1629 13.5355 13.7987 13.7988 14.2675 14.2675L17.5 17.5M25 12.5V17.5M25 17.5L23.0175 15.5175C22.5487 15.0488 21.9129 14.7855 21.25 14.7855C20.5871 14.7855 19.9513 15.0488 19.4825 15.5175L17.5 17.5M17.5 17.5L20 20M22.5 5H27.5M25 2.5V7.5M17.5 10H17.5125"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="mt-1 text-xs">{isUploading ? 'Uploading...' : 'Change Image'}</span>
                </div>
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </div>
            </div>
            <div className="flex-grow mt-10 md:mt-0 md:pl-16 max-w-3xl space-y-5 sm:space-y-6 md:sm:space-y-7">
              {/* ---- */}
              <div>
                <Label>Username</Label>
                <Input 
                  className="mt-1.5" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              {/* ---- */}
              <div>
                <Label>Email</Label>
                <div className="mt-1.5 flex">
                  <span className="inline-flex items-center px-2.5 rounded-l-2xl border border-r-0 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-sm">
                    <EnvelopeIcon className="w-5 h-5" />
                  </span>
                  <Input
                    className="!rounded-l-none"
                    placeholder="example@email.com"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* ---- */}
              <div>
                <Label>Bio</Label>
                <Textarea
                  className="mt-1.5"
                  placeholder="Tell us about yourself..."
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                />
              </div>

              {/* ---- */}
              <div>
                <Label>Website</Label>
                <Input
                  className="mt-1.5"
                  placeholder="https://example.com"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>

              {/* ---- */}
              <div>
                <Label>Social Media</Label>
                <div className="mt-1.5 space-y-3">
                  <Input
                    placeholder="Facebook URL"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                  />
                  <Input
                    placeholder="Twitter URL"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                  />
                  <Input
                    placeholder="TikTok URL"
                    name="tiktok"
                    value={formData.tiktok}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Record Label Section */}
              <div>
                <Label>Record Label Name</Label>
                <Input
                  className="mt-1.5"
                  name="recordLabel"
                  value={formData.recordLabel}
                  onChange={handleChange}
                  placeholder="Enter your record label name"
                />
                <p className="mt-2 text-sm text-neutral-500">
                  This will be displayed on all your new albums. If you change this, use the sync button below to update existing albums.
                </p>
              </div>

              {/* Record Label Logo */}
              <div>
                <Label>Record Label Logo</Label>
                <div className="mt-1.5 flex items-center space-x-4">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden flex">
                    <img
                      src={formData.recordLabelImage || '/images/placeholder.png'}
                      alt="Record Label Logo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-neutral-50 cursor-pointer">
                      <svg
                        width="30"
                        height="30"
                        viewBox="0 0 30 30"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M17.5 5H7.5C6.83696 5 6.20107 5.26339 5.73223 5.73223C5.26339 6.20107 5 6.83696 5 7.5V20M5 20V22.5C5 23.163 5.26339 23.7989 5.73223 24.2678C6.20107 24.7366 6.83696 25 7.5 25H22.5C23.163 25 23.7989 24.7366 24.2678 24.2678C24.7366 23.7989 25 23.163 25 22.5V17.5M5 20L10.7325 14.2675C11.2013 13.7988 11.8371 13.5355 12.5 13.5355C13.1629 13.5355 13.7987 13.7988 14.2675 14.2675L17.5 17.5M25 12.5V17.5M25 17.5L23.0175 15.5175C22.5487 15.0488 21.9129 14.7855 21.25 14.7855C20.5871 14.7855 19.9513 15.0488 19.4825 15.5175L17.5 17.5M17.5 17.5L20 20M22.5 5H27.5M25 2.5V7.5M17.5 10H17.5125"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="mt-1 text-xs">{isUploading ? 'Uploading...' : 'Change Logo'}</span>
                    </div>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                      onChange={handleRecordLabelImageUpload}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>

              {/* Sync Record Label Button */}
              {formData.recordLabel && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Sync Record Label to Existing Albums
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    If you've changed your record label name, click this button to update all your existing albums to use the new record label name.
                  </p>
                  <ButtonPrimary
                    type="button"
                    onClick={handleSyncRecordLabel}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Syncing...' : 'Sync Record Label to All Albums'}
                  </ButtonPrimary>
                </div>
              )}

              {/* ---- */}
              <div className="pt-2">
                <ButtonPrimary type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update profile'}
                </ButtonPrimary>
              </div>
            </div>
          </form>

          {/* Separator and moved sections */}
          <div className="w-full border-b-2 border-neutral-100 dark:border-neutral-700 my-10"></div>
          {/* Subscription Section */}
          <div className="mt-10 md:mt-0 space-y-5 sm:space-y-6 md:sm:space-y-8">
            <div>
              <h3 className="text-lg sm:text-2xl font-semibold">
                Subscription & Benefits
              </h3>
              <span className="block mt-3 text-neutral-500 dark:text-neutral-400">
                Manage your subscription and access premium features
              </span>
            </div>
            <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
            <div className="flex flex-col space-y-4">
              <ButtonPrimary href="/account/subscription" className="w-full md:w-auto">
                Manage Subscription
              </ButtonPrimary>
            </div>
          </div>
          {/* AI Mastering Credits Section for Plus users */}
          <MasteringCreditsSection />
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
