/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compress responses
  compress: true,
  // Disable x-powered-by header
  poweredByHeader: false,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    config.resolve.alias['@react-native-async-storage/async-storage'] = false
    return config
  },
}

module.exports = nextConfig
