# MediLite - Healthcare Simplified 🏥

MediLite is a modern, secure, and intuitive medical record management system designed for Patients, Doctors, and Administrators. It leverages real-time synchronization, secure QR-based access, and automated medicine reminders to improve healthcare outcomes.

## ✨ Key Features

### 👤 For Patients
- **Medical Dashboard**: Centralized view of health stats and recent records.
- **Record Vault**: Upload, categorize, and manage medical reports, prescriptions, and bills.
- **Health Timeline**: A beautiful, chronological journey of your medical history.
- **Medicine Reminders**: Automated SMS alerts for your medication schedule (powered by Twilio).
- **Secure QR Profile**: Give temporary access to doctors with a single scan.

### ⚕️ For Doctors
- **Patient Search**: Quickly find patients via ID or name.
- **Consultation Notes**: Add secure medical findings and advice to patient timelines.
- **Verified Status**: Formal medical professional verification flow.
- **Recent Activity**: Track recent patient interactions at a glance.

### 🛡️ For Admins
- **Command Center**: Monitor total users, records, and active sessions.
- **Professional Verification**: Review and approve doctor credentials.
- **System Logs**: Audit medical record uploads and core system events.

## 🚀 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Clerk Auth.
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL.
- **Communications**: Twilio SMS API.
- **Storage**: Cloudinary (Medical Images/PDFs).

## 🛠️ Quick Start

### Prerequisites
- Node.js v18+
- Docker & Docker Compose
- Clerk Account (Publishable Key)

### Local Setup (Manual)

1. **Clone the Repo**
2. **Server Setup**:
   ```bash
   cd server
   npm install
   # Create .env based on server/.env.example
   npx prisma migrate dev
   npm start
   ```
3. **Client Setup**:
   ```bash
   cd client
   npm install
   # Create .env based on client/.env.example
   npm run dev
   ```

### Docker Setup (One-Click)

```bash
docker-compose up --build
```
*Note: Ensure your `.env` files are populated before running Docker.*

## 🔒 Security

- **End-to-End Auth**: Powered by Clerk.
- **Encrypted Storage**: Secure Cloudinary buckets.
- **Temporal Access**: QR tokens expire after a single use/session.

---
Built with ❤️ by the MediLite Team.
