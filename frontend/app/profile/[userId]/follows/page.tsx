import FollowsClient from "./FollowsClient";

export function generateStaticParams() {
  return [{ userId: "0" }];
}

export default function FollowsPage() {
  return <FollowsClient />;
}
