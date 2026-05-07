import { setupServer } from "msw/node";

// 各テストファイルで handlers を上書きするため、ここでは空のまま起動する
export const server = setupServer();
