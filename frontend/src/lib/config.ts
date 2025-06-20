// Configuration file for environment variables
export const config = {
  // Backend API URL - defaults to localhost:3001 for development
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
  
  // Other configuration options can be added here
  API_TIMEOUT: 30000, // 30 seconds
  
  // Development flags
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  // If endpoint already starts with http, return as-is
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const fullUrl = `${config.BACKEND_URL}${normalizedEndpoint}`;
  console.log(`buildApiUrl: ${endpoint} -> ${fullUrl} (BACKEND_URL: ${config.BACKEND_URL})`);
  return fullUrl;
};

// Export commonly used API base paths
export const API_ROUTES = {
  AUTH: '/api/auth',
  DOCTOR: '/api/doctor',
  PATIENTS: '/api/patients',
  PRESCRIPTIONS: '/api/prescriptions',
  DOCTORS: '/api/doctors',
} as const;
