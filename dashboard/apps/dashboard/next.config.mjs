/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    loader: "custom",
    loaderFile: "./image-loader.ts",
    qualities: [80, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  transpilePackages: ["@vision_dashboard/ui"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/proxy/sse",
        destination: "http://api.zapvision.tech/stream_raw",
      },
      {
        source: "/api/proxy/pdf",
        destination:
          "http://api.seindonesia.carbonzap.tech/api/report/customer/pdf",
      },
      {
        source: "/api/proxy/tracked",
        destination: "https://sei-be.zapvision.tech/tracked",
      },
      {
        source: "/api/proxy/tracked/customer/:customerId/history",
        destination:
          "https://sei-be.zapvision.tech/tracked/customer/:customerId/history",
      },
      {
        source: "/api/proxy/tracked/:path*",
        destination: "https://sei-be.zapvision.tech/tracked/:path*",
      },
      {
        source: "/api/proxy/garbage",
        destination: "https://sei-be.zapvision.tech/garbage",
      },
      {
        source: "/api/v1/face-recog/face-unique/:path*",
        destination: "http://136.114.253.227:8083/api/v1/face-recog/face-unique/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/((?!api/proxy).*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default config;
