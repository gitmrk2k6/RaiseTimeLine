import ProfileClient from "./ProfileClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ userId: "0" }];
}

export default function ProfilePage() {
  return <ProfileClient />;
}
