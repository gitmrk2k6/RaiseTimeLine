import ProfileClient from "./ProfileClient";

export function generateStaticParams() {
  return [{ userId: "0" }];
}

export default function ProfilePage({ params }: { params: { userId: string } }) {
  return <ProfileClient userId={Number(params.userId)} />;
}
