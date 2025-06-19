# Role-Based Authentication Implementation

## Overview
The healthcare system now uses a simplified role-based authentication with two main account types:
1. A single receptionist account that handles all patient data entry and appointment management
2. An admin account for managing doctors and system settings

## Changes Implemented

1. **Updated User Model**:
   - Added `role` field with options: 'admin', 'receptionist', 'doctor'
   - Added `isDefaultAccount` field to identify system-created default accounts

2. **Role-Based Middleware**:
   - Created `verifyAdmin` middleware: Ensures only admin users can access certain routes
   - Created `verifyReceptionist` middleware: Ensures only receptionist or admin users can access patient management routes
   - Created `verifyAny` middleware: Allows any authenticated user to access common routes

3. **Default Account Setup**:
   - Created a setup script (`seeds/setupAccounts.js`) that automatically creates the default admin and receptionist accounts
   - Default accounts use secure passwords that should be changed after first login

4. **Route Access Control**:
   - Receptionist access: All patient-related routes in `patientDetails.js` now require receptionist privileges
   - Admin access: All doctor management routes in `doctor.js` now require admin privileges
   - Doctor rating functionality is still available to receptionists (based on patient feedback)

5. **Token Enhancement**:
   - JWT tokens now include the user's role for frontend role-based UI
   - Token verification checks for appropriate roles before allowing access

## Default Account Credentials

### Admin Account
- Username: admin
- Email: admin@healthclinic.com
- Password: HealthClinic@2025

### Receptionist Account
- Username: receptionist
- Email: reception@healthclinic.com
- Password: HealthClinic@2025

## Usage Instructions

1. Run the setup script to create default accounts:
   ```
   node seeds/setupAccounts.js
   ```

2. Log in with the appropriate account for the tasks needed:
   - Receptionist account for patient management
   - Admin account for doctor management

3. For security, change the default passwords after first login

4. Use the appropriate tokens for authorization when making API calls:
   - `ADMIN_TOKEN` for admin-only operations
   - `RECEPTIONIST_TOKEN` for patient-related operations
