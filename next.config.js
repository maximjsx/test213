/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // ws package uses these native addons for perf; they're unavailable in Lambda.
    // Marking as external lets ws fall back to its pure-JS implementations.
    config.externals.push('bufferutil', 'utf-8-validate')
    return config
  },
}
module.exports = nextConfig
