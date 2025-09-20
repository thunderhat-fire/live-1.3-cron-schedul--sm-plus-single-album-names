"use client";

import React, { useEffect, useState } from 'react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';

const AdminMasteringRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/mastering-requests')
      .then(res => res.json())
      .then(data => {
        setRequests(data.requests || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [success]);

  const handleUpload = async (e: React.FormEvent, id: string, file: File) => {
    e.preventDefault();
    setUploadingId(id);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append('track', file);
      const res = await fetch(`/api/admin/mastering-request/${id}/complete`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSuccess('Mastered track uploaded!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="container py-16">
      <h1 className="text-3xl font-bold mb-8">Mastering Requests</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : requests.length === 0 ? (
        <div>No mastering requests found.</div>
      ) : (
        <div className="space-y-6">
          {requests.map((req: any) => (
            <div key={req.id} className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="font-semibold">{req.user?.name || req.user?.email || 'Unknown User'}</div>
                <div className="text-sm text-neutral-500">{req.user?.email}</div>
                <div className="text-sm mt-1">Requested: {new Date(req.createdAt).toLocaleString()}</div>
                <div className="text-sm mt-1">Status: {req.status}</div>
                <div className="flex gap-2 mt-2">
                  <a href={req.originalTrackUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">Original</a>
                  {req.status === 'completed' && req.masteredTrackUrl && (
                    <a href={req.masteredTrackUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 underline text-sm">Download Mastered</a>
                  )}
                </div>
              </div>
              {req.status === 'pending' && (
                <form
                  className="mt-4 md:mt-0 flex flex-col md:flex-row items-center gap-2"
                  onSubmit={e => {
                    const input = (e.target as HTMLFormElement).elements.namedItem('track') as HTMLInputElement;
                    if (input && input.files && input.files[0]) {
                      handleUpload(e, req.id, input.files[0]);
                    } else {
                      e.preventDefault();
                    }
                  }}
                >
                  <input type="file" name="track" accept="audio/*" required disabled={uploadingId === req.id} />
                  <ButtonPrimary type="submit" disabled={uploadingId === req.id}>
                    {uploadingId === req.id ? 'Uploading...' : 'Upload Mastered'}
                  </ButtonPrimary>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMasteringRequestsPage; 