# Healthcare Management System - Frontend

This is a [Next.js](https://nextjs.org) project for a healthcare management system with role-based dashboards.

## Environment Setup

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure the backend URL:**
   Edit `.env` and set your backend URL:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
   ```

3. **For production deployment:**
   ```env
   NEXT_PUBLIC_BACKEND_URL=https://your-api-domain.com
   ```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- **Role-based authentication:** Admin, Doctor, Receptionist
- **Doctor Dashboard:** Appointments, prescriptions, case summaries
- **Admin Panel:** Doctor management, system overview
- **Receptionist Interface:** Patient registration, appointment scheduling

## Features

- ✅ Role-based authentication and authorization
- ✅ Real-time appointment management
- ✅ AI-powered prescription generation
- ✅ Drug interaction checking
- ✅ Case summary generation
- ✅ Responsive design with modern UI

## Login Credentials (Development)

**Doctors:**
- Email: `divya.mehta@hospital.com` | Password: `doctor123`
- Email: `arjun.brown@hospital.com` | Password: `doctor123`

**Admin:**
- Email: `admin@healthclinic.com` | Password: `HealthClinic@2025`

**Receptionist:**
- Email: `reception@healthclinic.com` | Password: `HealthClinic@2025`

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
