"use client";
import React, { useEffect, useState } from "react";

interface Author {
    id: string;
    name: string | null;
    image?: string | null;
}

interface LiveAuthor extends Author {
  hlsUrl: string | null;
}

const LatestStreamsGrid: React.FC = () => {
  const [liveAuthors, setLiveAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all authors and check live status
  const fetchLiveAuthors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/popular?timeFilter=all");
      const data = await res.json();
      const authors: Author[] = data.success && data.users ? data.users : [];
      // Check live status for each author in parallel
      const statuses = await Promise.all(
        authors.map(async (author) => {
          const statusRes = await fetch(`/api/live-status/${author.id}`);
          const statusData = await statusRes.json();
          if (statusData.isLive) {
            return author;
          }
          return null;
        })
      );
      setLiveAuthors(statuses.filter(Boolean) as Author[]);
    } catch (err) {
      setLiveAuthors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAuthors();
    const interval = setInterval(fetchLiveAuthors, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <section style={{ margin: "48px 0" }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Artists are streaming
      </h2>
      <div style={{ fontSize: 17, color: "#666", marginBottom: 24 }}>
        Sessions, Album PreRelease info, Q&amp;A with your favourite musician or BTS previews
      </div>
      {loading ? (
        <div>Loading streams...</div>
      ) : liveAuthors.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 24,
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          {liveAuthors.map((author) => (
            <a
              key={author.id}
              href={`/author/${author.id}`}
              style={{
                display: "block",
                background: "#181818",
                borderRadius: 12,
                boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                overflow: "hidden",
                textDecoration: "none",
                color: "#fff",
                position: "relative",
                border: "1px solid #bbb",
                padding: "5px",
              }}
            >
              <div style={{ position: "relative" }}>
                  <div style={{ width: "100%", aspectRatio: "16/9", background: "#222" }} />
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      background: "#e53935",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      padding: "2px 10px",
                      borderRadius: 6,
                      letterSpacing: 1,
                    }}
                  >
                    LIVE
                  </span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 6 }}>
                  {author.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {author.image && (
                    <img
                      src={author.image}
                      alt={author.name || ""}
                      style={{ width: 28, height: 28, borderRadius: "50%" }}
                    />
                  )}
                  <span style={{ fontSize: 15, color: "#aaa" }}>
                    {author.name || "Unknown"}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div style={{ color: '#aaa', textAlign: 'center', marginTop: 32, fontSize: 18 }}>
          No artists are live right now. Check back soon!
        </div>
      )}
    </section>
  );
};

export default LatestStreamsGrid; 