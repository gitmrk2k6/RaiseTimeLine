import api from "@/lib/api";

export interface Post {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  userId: number;
  username: string;
  profileImageUrl: string | null;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  username: string;
  profileImageUrl: string | null;
  content: string;
  createdAt: string;
}

export interface LikeResult {
  postId: number;
  likeCount: number;
  likedByCurrentUser: boolean;
}

export const fetchTimeline = (before?: string, limit = 20): Promise<Post[]> =>
  api
    .get("/posts", { params: { ...(before ? { before } : {}), limit } })
    .then((res) => res.data);

export const createPost = (content: string, image?: File): Promise<Post> => {
  const form = new FormData();
  form.append("content", content);
  if (image) form.append("image", image);
  return api
    .post("/posts", form, { headers: { "Content-Type": "multipart/form-data" } })
    .then((res) => res.data);
};

export const updatePost = (id: number, content: string): Promise<Post> =>
  api.put(`/posts/${id}`, { content }).then((res) => res.data);

export const deletePost = (id: number): Promise<void> =>
  api.delete(`/posts/${id}`).then(() => undefined);

export const fetchComments = (postId: number): Promise<Comment[]> =>
  api.get(`/posts/${postId}/comments`).then((res) => res.data);

export const createComment = (postId: number, content: string): Promise<Comment> =>
  api.post(`/posts/${postId}/comments`, { content }).then((res) => res.data);

export const deleteComment = (postId: number, commentId: number): Promise<void> =>
  api.delete(`/posts/${postId}/comments/${commentId}`).then(() => undefined);

export const likePost = (postId: number): Promise<LikeResult> =>
  api.post(`/posts/${postId}/likes`).then((res) => res.data);

export const unlikePost = (postId: number): Promise<LikeResult> =>
  api.delete(`/posts/${postId}/likes`).then((res) => res.data);
