export interface StreamMetadata {
  id: string;
  creatorId: string;
  title: string;
  startedAt: Date;
  endedAt?: Date;
  recordingUrl?: string;
  presaleId?: string;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  status: 'live' | 'ended' | 'processing';
}

export interface StreamMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
}

export interface StreamStats {
  viewCount: number;
  likeCount: number;
  shareCount: number;
  chatCount: number;
}

export interface Stream {
  id: string;
  title: string;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
  viewCount: number;
  channelName: string | null;
  token: string | null;
  uid: number | null;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
} 