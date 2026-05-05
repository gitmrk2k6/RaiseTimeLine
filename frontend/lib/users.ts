import api from "@/lib/api";
import type { Post } from "@/lib/posts";

export interface UserProfile {
  id: number;
  username: string;
  profileImageUrl: string | null;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface FollowResult {
  userId: number;
  followerCount: number;
  isFollowing: boolean;
}

export const searchUsers = (username: string): Promise<UserProfile[]> =>
  api.get("/users", { params: { username } }).then((r) => r.data);

export const getProfile = (userId: number): Promise<UserProfile> =>
  api.get(`/users/${userId}`).then((r) => r.data);

export const getUserPosts = (
  userId: number,
  before?: string,
  limit = 20
): Promise<Post[]> =>
  api
    .get(`/users/${userId}/posts`, {
      params: { ...(before ? { before } : {}), limit },
    })
    .then((r) => r.data);

export const followUser = (userId: number): Promise<FollowResult> =>
  api.post(`/users/${userId}/follow`).then((r) => r.data);

export const unfollowUser = (userId: number): Promise<FollowResult> =>
  api.delete(`/users/${userId}/follow`).then((r) => r.data);

export const getFollowers = (userId: number): Promise<UserProfile[]> =>
  api.get(`/users/${userId}/followers`).then((r) => r.data);

export const getFollowing = (userId: number): Promise<UserProfile[]> =>
  api.get(`/users/${userId}/following`).then((r) => r.data);

export const updateProfile = (username: string, image?: File): Promise<UserProfile> => {
  const form = new FormData();
  form.append("username", username);
  if (image) form.append("image", image);
  return api
    .put("/users/me", form, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};
