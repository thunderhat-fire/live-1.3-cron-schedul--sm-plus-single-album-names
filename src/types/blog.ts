export interface BlogAuthor {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  bio?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: BlogAuthor;
  categories: BlogCategory[];
  tags: BlogTag[];
  publishedAt: string;
  readingTime: number;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: string;
  content: string;
  author: BlogAuthor;
  postId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface BlogPostFilters {
  category?: string;
  tag?: string;
  author?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'latest' | 'popular' | 'trending';
} 