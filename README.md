# MotoTrack — Motorcycle Service Management

MotoTrack is a mobile application designed to help motorcycle repair shops manage service requests and track vehicle maintenance progress. It allows customers to register their motorcycles, request services, review repair estimates, and monitor the status of their vehicles throughout the servicing process.

Customers can also access their maintenance history, view digital invoices, and complete payments through online or cash payment options. Meanwhile, workshop administrators can manage service requests, record vehicle inspections, update repair progress, and handle service transactions.

MotoTrack aims to simplify motorcycle service management, improve communication between customers and repair shops, and provide a more organized and transparent maintenance experience.

## Tech Stack

**Backend**

- Node.js
- Express.js
- TypeScript
- PostgreSQL (Aiven)
- Drizzle ORM

**Mobile**

- Flutter
- Dart

**Other Tools**

- Cloudinary
- Swagger
- Xendit (Test Mode)

## Project Structure

```text
MotoTrack/
├── server/       # Backend REST API
├── mobile/       # Flutter application
└── README.md
```

## Getting Started

### Backend

```bash
cd server
npm install
npm run dev
```

The development server runs at `http://localhost:5000`.

### Mobile

```bash
cd mobile
flutter pub get
flutter run
```

## Development Status

MotoTrack is currently under development. The backend has been initialized with Express.js and TypeScript, while the Flutter project has been created with its default configuration.

Database integration, authentication, service management features, and mobile UI development are planned for the next stages.
