import ProfileClient from "./ProfileClient";

export function generateStaticParams() {
  return [{ userId: "0" }];
}

export default function ProfilePage() {
  return <ProfileClient />;
}
