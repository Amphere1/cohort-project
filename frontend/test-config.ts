// Test script to verify environment configuration
import { config, buildApiUrl } from './src/lib/config';

console.log('=== Environment Configuration Test ===');
console.log('Backend URL from env:', process.env.NEXT_PUBLIC_BACKEND_URL);
console.log('Config BACKEND_URL:', config.BACKEND_URL);
console.log('Is Development:', config.IS_DEVELOPMENT);

console.log('\n=== URL Building Test ===');
console.log('buildApiUrl("/api/auth/login"):', buildApiUrl('/api/auth/login'));
console.log('buildApiUrl("api/doctor/appointments"):', buildApiUrl('api/doctor/appointments'));
console.log('buildApiUrl("http://external.api.com/test"):', buildApiUrl('http://external.api.com/test'));

export {};
