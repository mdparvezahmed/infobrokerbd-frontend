// Response shapes of the InfoBrokerBD backend API.

export type PostKind = "REVIEW" | "RECOMMENDATION" | "EXPERIENCE" | "TIP" | "WARNING";
export type ContentStatus = "ACTIVE" | "HIDDEN" | "REMOVED";
export type ReportReason = "SPAM" | "FAKE" | "SCAM" | "OFFENSIVE" | "WRONG_INFO" | "PRIVACY" | "OTHER";
export type SearchMode = "all" | "any" | "fuzzy";
export type SortKey = "relevance" | "new" | "top" | "rating" | "near";

export interface Category {
  id: number;
  slug: string;
  name: string;
  nameBn: string;
  icon: string;
  color: string;
  postCount?: number;
}

export interface Author {
  id: number;
  username: string;
  displayName: string;
  reputation: number;
}

export interface PostListItem {
  id: number;
  kind: PostKind;
  title: string;
  excerpt: string;
  rating: number | null;
  placeName: string | null;
  area: string | null;
  city: string | null;
  lat: number;
  lng: number;
  category: Category;
  author: Author | null;
  authorName: string;
  isAnonymous: boolean;
  image: string | null;
  imageCount: number;
  helpfulCount: number;
  commentCount: number;
  viewCount: number;
  status: ContentStatus;
  createdAt: string;
  distanceMeters: number | null;
  reportCount?: number;
}

export interface PostImage {
  id: number;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
}

export interface PostDetail extends Omit<PostListItem, "excerpt" | "image" | "imageCount" | "distanceMeters"> {
  body: string;
  phone: string | null;
  address: string | null;
  images: PostImage[];
  reportCount: number;
  updatedAt: string;
}

export interface PostViewerState {
  viewerHasVoted: boolean;
  canDelete: boolean;
  isAdmin: boolean;
}

export interface Page<T, C = string | number> {
  items: T[];
  nextCursor: C | null;
}

export interface PostSearchPage extends Page<PostListItem, string> {
  searchMode: SearchMode | null;
}

export interface Comment {
  id: number;
  postId: number;
  body: string;
  author: Author | null;
  authorName: string;
  isAnonymous: boolean;
  status: ContentStatus;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  displayName: string;
  bio: string | null;
  area: string | null;
  role: "USER" | "ADMIN";
  reputation: number;
  postCount: number;
  commentCount: number;
  helpfulReceived: number;
  createdAt: string;
  email?: string;
  isBanned?: boolean;
}

export interface Leader {
  id: number;
  username: string;
  displayName: string;
  area: string | null;
  points: number;
  posts: number;
  comments: number;
  helpful: number;
}

export interface Stats {
  posts: number;
  users: number;
  comments: number;
  areas: number;
}

/** Public post count for one (category, city) pair. */
export interface Place {
  category: string;
  city: string;
  posts: number;
  updatedAt: string;
}

export interface SitemapData {
  posts: { id: number; title: string; updatedAt: string; image: string | null }[];
  users: { username: string; updatedAt: string }[];
}

export interface MapCluster {
  lat: number;
  lng: number;
  count: number;
  post: {
    id: number;
    title: string;
    kind: PostKind;
    rating: number | null;
    placeName: string | null;
    area: string | null;
    helpfulCount: number;
    commentCount: number;
    category: Pick<Category, "slug" | "name" | "icon" | "color">;
    image: string | null;
  } | null;
}

export interface GeoResult {
  lat?: number;
  lng?: number;
  displayName: string | null;
  area: string | null;
  city: string | null;
  street: string | null;
}
