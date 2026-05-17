import FollowsClient from "./FollowsClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ userId: "0" }];
}

export default function FollowsPage() {
  return <FollowsClient />;
}
