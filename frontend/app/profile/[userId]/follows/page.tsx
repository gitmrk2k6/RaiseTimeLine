import FollowsClient from "./FollowsClient";

export function generateStaticParams() {
  return [{ userId: "0" }];
}

export default function FollowsPage({ params }: { params: { userId: string } }) {
  return <FollowsClient userId={Number(params.userId)} />;
}
