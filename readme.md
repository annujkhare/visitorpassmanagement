# PassPoint – Visitor Management System

PassPoint is a full-stack visitor management app for handling visitor registration, appointments, approvals, visitor passes, QR scanning, check-in/check-out, notifications, and reports.

There are four main roles in the system: **Admin, Security/Frontdesk, Employee/Host, and Visitor**.

## Main Features

### Admin
- Manage users and staff
- Manage organization settings
- View the dashboard and visitor activity
- Search, filter, and export records

### Security / Frontdesk
- Issue visitor passes
- Scan and verify QR codes
- Check visitors in and out
- View check-in/check-out records

### Employee / Host
- Invite visitors
- Create appointments
- Approve visitor requests
- View appointment information

### Visitor
- Register or pre-register
- Add visitor details and a photo
- View the digital visitor pass
- Use the QR code on the pass

## What the App Includes

- JWT login and role-based access
- Visitor registration
- Appointment and pre-registration
- Visitor approval
- Digital visitor passes
- QR code generation
- PDF visitor badges
- QR code scanning
- Check-in and check-out
- Check-in/check-out logs
- Email notifications
- SMS notification integration
- Dashboard and basic analytics
- Search and filters
- CSV export
- Organization and staff management

## Technology Used

### Frontend
- React
- React Router
- JavaScript
- Tailwind CSS
- jsQR
- QRCode

### Backend
- Node.js
- Express.js
- JWT
- bcrypt
- MongoDB
- Nodemailer
- Twilio
- PDFKit
- QRCode

### Database

The main MongoDB collections are:

```text
users
visitors
appointments
passes
checkLogs
notifications
otps
organizations
```

## How It Works

```text
React Frontend
     |
     | REST API
     v
Express Backend
     |
     |-- Login and roles
     |-- Visitor management
     |-- Appointments
     |-- Passes and QR verification
     |-- Notifications
     |
     v
MongoDB
```

Email is sent through SMTP/Nodemailer, and SMS can be sent through Twilio when a Twilio account is configured.

## Visitor Flow

```text
Visitor registers
       ↓
Appointment / pre-registration
       ↓
Host approves the request
       ↓
Visitor pass is created
       ↓
QR code + PDF badge
       ↓
Email / SMS notification
       ↓
Visitor arrives
       ↓
Security scans the QR code
       ↓
Pass is checked
       ↓
Check-in
       ↓
Check-out
       ↓
Logs and reports are updated
```

## Project Structure

```text
PassPoint/
│
├── src/
│   ├── components/
│   ├── utils/
│   ├── server/
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── organizations.js
│   │   │   ├── visitors.js
│   │   │   ├── appointments.js
│   │   │   ├── passes.js
│   │   │   ├── checkLogs.js
│   │   │   ├── notifications.js
│   │   │   └── exports.js
│   │   ├── db.js
│   │   └── notifications.js
│   ├── App.jsx
│   └── main.jsx
│
├── server.js
├── scripts/
├── package.json
├── .env
├── .gitignore
└── readme.md
```

## Installation

### 1. Clone the project

```bash
git clone <your-repository-url>
cd PassPoint
```

### 2. Install packages

```bash
npm install
```

If the frontend and backend use separate `package.json` files, install the packages in each folder.

### 3. Set up environment variables

Create a `.env` file and add your own values.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=visitor_pass_management

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email
SMTP_PASS=your_app_password
SMTP_FROM=your_email

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=your_twilio_number
```

Do not upload a real `.env` file, passwords, API keys, or other credentials to GitHub.

## Running the Project

### Start the backend

```bash
npm run server
```

or:

```bash
node server.js
```

### Start the frontend

```bash
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173
```

The backend normally runs at:

```text
http://localhost:5000
```

## Login and Roles

PassPoint uses JWT for login sessions and bcrypt to hash passwords.

Available roles:

```text
admin
security
host
visitor
```

Each role gets access to the parts of the system it needs.

## QR Visitor Pass

Every visitor pass has a unique QR code. The QR data contains pass details such as:

```json
{
  "passNumber": "VP-2026-XXXX",
  "visitorName": "Visitor Name",
  "visitorEmail": "visitor@example.com",
  "hostName": "Host Name",
  "validUntil": "2026-10-04T10:30:00.000Z"
}
```

The QR code can be displayed on the visitor's phone, printed on the PDF badge, or scanned directly by the PassPoint scanner.

The scanner checks the pass against the backend before allowing check-in or check-out.

## PDF Visitor Badge

The app can create a printable PDF badge with:

- Visitor information
- Pass number
- Validity details
- Access information
- QR code

The QR code on the badge can be scanned by Security/Frontdesk.

## Notifications

### Email

Email notifications use **Nodemailer with SMTP**.

Email sending has been tested with the project.

### SMS

SMS is connected through the **Twilio API**.

Actual SMS delivery needs a configured Twilio account with available billing/credits.

## Dashboard and Reports

The dashboard shows information such as:

- Total visitors
- Active passes
- Appointments
- Check-ins
- Check-outs
- Visitor activity

The project also includes:

- Search
- Filters
- Pass history
- Check-in/check-out logs
- CSV export

## Basic Test Flow

You can test the main flow in this order:

```text
1. Register / Login
2. Create a visitor
3. Create an appointment
4. Approve the appointment
5. Generate the visitor pass
6. Download the PDF badge
7. Scan the QR code
8. Check the visitor in
9. Check the visitor out
10. Open Check Logs
11. Check the Dashboard
12. Export the records
```

## Security

- Passwords are hashed with bcrypt.
- Protected API routes use JWT authentication.
- Role checks prevent users from accessing restricted actions.
- Sensitive values are kept in environment variables.
- The `.env` file should not be committed to GitHub.

## Project Status

**Status: Completed**

The current project includes:

```text
Authentication
Role-Based Authorization
Visitor Registration
Appointment Management
Visitor Approval
Pass Generation
QR Code
PDF Badge
QR Scanner
Check-In / Check-Out
Check Logs
Email Notifications
SMS Integration
Dashboard
Search & Filters
CSV Export
```

## Project

**PassPoint – Visitor Management System**

PassPoint is a React, Node.js, Express, and MongoDB project that manages the complete visitor process, from registration and approval to QR-based entry, check-out, notifications, and reporting.
