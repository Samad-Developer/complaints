# DC Complaint Cell

Complaint registration and tracking system for the Deputy Commissioner Complaint Cell, Swabi.
Built with Next.js 16 (App Router) and Supabase.

## Features

- **Dashboard**: totals by status, complaints over the last 30 days, and breakdowns by tehsil and department, plus recent complaints.
- **All complaints**: search by name, phone, location or reference number (e.g. `DCC-00012`); filter by status, tehsil, department and date range; paginated.
- **New complaint**: name, tehsil, contact number, date, complaint, location, remarks, attachments (PNG/JPG/JPEG/PDF, max 5 MB each, up to 5 files), concerned department, and status.
- **Complaint detail**: full record, attachment previews, and a panel to update status, reassign the department, edit remarks, or delete the complaint.
- Staff-only access via Supabase Auth. Row Level Security protects the database and storage.

## Setup

1. **Database**: in the Supabase dashboard open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `complaints` table, security policies, the `complaint_stats()` function, and the private `complaint-attachments` storage bucket.
2. **Disable public sign-ups**: under **Authentication → Sign In / Providers**, turn off **Allow new users to sign up**, so only accounts you create can log in.
3. **Create staff accounts**: under **Authentication → Users → Add user → Create new user**, enter an email and password and tick **Auto Confirm User**.
4. **Environment**: copy `.env.example` to `.env.local` and fill in your project URL and publishable (or anon) key.
5. Run the app:

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:3000 and sign in.

## Customising lists

Tehsils, departments and statuses are defined in [`src/lib/constants.ts`](src/lib/constants.ts).
If you add a tehsil, also update the `tehsil` check constraint in the database.
