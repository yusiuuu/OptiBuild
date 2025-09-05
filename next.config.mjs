<<<<<<< HEAD
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
=======
/**
 * Next.js configuration for OptiBuild application
 * Defines build settings, experimental features, and development options
 */
const nextConfig = {
  // ESLint configuration - ignore errors during builds for development
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration - ignore type errors during builds for development
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Image optimization settings - disable for development and testing
  images: {
    unoptimized: true,
  },
  
  // Experimental Next.js features for improved performance
  experimental: {
    // Enable webpack build worker for faster builds
    webpackBuildWorker: true,
    // Enable parallel server build traces for better debugging
    parallelServerBuildTraces: true,
    // Enable parallel server compilation for faster development
>>>>>>> 34d06b5 (Updated the +New Project section)
    parallelServerCompiles: true,
  }
}

export default nextConfig
