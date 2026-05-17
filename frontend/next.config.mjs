/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NEXT_STATIC_EXPORT === "true" ? { output: "export" } : {}),
  images: { unoptimized: true },
};

export default nextConfig;
