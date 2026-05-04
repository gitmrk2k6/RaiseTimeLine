import api from "@/lib/api";

export interface Post {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  username: string;
  profileImageUrl: string | null;
}

export const fetchTimeline = (before?: string, limit = 20): Promise<Post[]> =>
  api
    .get("/posts", { params: { ...(before ? { before } : {}), limit } })
    .then((res) => res.data);

export const createPost = (content: string): Promise<Post> =>
  api.post("/posts", { content }).then((res) => res.data);

export const updatePost = (id: number, content: string): Promise<Post> =>
  api.put(`/posts/${id}`, { content }).then((res) => res.data);

export const deletePost = (id: number): Promise<void> =>
  api.delete(`/posts/${id}`).then(() => undefined);
