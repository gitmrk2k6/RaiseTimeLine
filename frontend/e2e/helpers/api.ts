import axios from "axios";

const BASE_URL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8080/api";

export interface TestUser {
  userId: number;
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export function uniqueSuffix(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export async function registerUser(
  username: string,
  email: string,
  password: string
): Promise<TestUser> {
  const res = await axios.post(`${BASE_URL}/auth/register`, { username, email, password });
  return {
    userId: res.data.userId,
    username: res.data.username,
    email,
    accessToken: res.data.accessToken,
    refreshToken: res.data.refreshToken,
  };
}

export async function loginUser(email: string, password: string): Promise<TestUser> {
  const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return {
    userId: res.data.userId,
    username: res.data.username,
    email,
    accessToken: res.data.accessToken,
    refreshToken: res.data.refreshToken,
  };
}

export async function createPost(content: string, accessToken: string): Promise<number> {
  const form = new FormData();
  form.append("content", content);
  const res = await axios.post(`${BASE_URL}/posts`, form, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.id;
}
