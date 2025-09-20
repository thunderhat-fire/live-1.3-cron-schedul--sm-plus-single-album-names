"use client";
import React, { useEffect, useState } from 'react';

interface LiveStream {
  id: string;
  title: string;
  creator: {
    id: string;
    name: string | null;
    image?: string | null;
  };
}

const LiveNowGrid: React.FC = () => {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/streams/live')
      .then(res => res.json())
      .then(data => {
        setStreams(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading live streams...</div>;
  if (!streams.length) return null;

  return (
    <section style={{ margin: '48px 0' }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Artist live streams</h2>
      <div style={{ fontSize: 17, color: '#aaa', marginBottom: 24 }}>
        Watch Album explainers, BTS and Q&amp;A sessions with your favourite performer
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 24
      }}>
        {streams.map(stream => (
          <a
            key={stream.id}
            href={`/stream/${stream.id}`}
            style={{
              display: 'block',
              background: '#181818',
              borderRadius: 12,
              boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              textDecoration: 'none',
              color: '#fff',
              position: 'relative'
            }}
          >
            <div style={{ position: 'relative' }}>
                <div style={{ width: '100%', aspectRatio: '16/9', background: '#222' }} />
              <span style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: '#e53935',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                padding: '2px 10px',
                borderRadius: 6,
                letterSpacing: 1
              }}>LIVE</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 6 }}>{stream.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {stream.creator?.image && (
                  <img src={stream.creator.image} alt={stream.creator.name || ''} style={{ width: 28, height: 28, borderRadius: '50%' }} />
                )}
                <span style={{ fontSize: 15, color: '#aaa' }}>{stream.creator?.name || 'Unknown'}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default LiveNowGrid; 