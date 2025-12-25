/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig


