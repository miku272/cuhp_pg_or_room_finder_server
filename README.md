# CUHP PG or Room Finder API

## Description

This project is the backend API for a PG (Paying Guest) or Room Finder application, likely targeted for students or individuals around CUHP (Central University of Himachal Pradesh). It provides functionalities for user authentication, property listings, real-time chat, OTP verification, reviews, and saved properties. The application is built with Node.js, Express, MongoDB, and uses Socket.IO for real-time communication.

## Features

- **User Authentication:** Secure user registration and login using JWT.
- **OTP Verification:** Email/SMS based OTP verification for actions like registration or password reset.
- **Property Management:** CRUD operations for property listings.
- **Real-time Chat:** Socket.IO based chat functionality between users (e.g., property owner and seeker).
- **Reviews and Ratings:** Users can leave reviews and ratings for properties.
- **Saved Properties:** Users can save or "favorite" properties for later viewing.
- **Rate Limiting:** Protects against brute-force attacks and abuse.
- **Comprehensive API Endpoints:** Well-structured routes for all features.

## Tech Stack

- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MongoDB (with Mongoose ODM)
- **Real-time Communication:** Socket.IO
- **Authentication:** JWT (JSON Web Tokens), bcrypt (for password hashing)
- **Validation:** express-validator
- **Email:** Nodemailer
- **SMS:** Twilio (implied by dependency)
- **Testing:** Jest, Supertest
- **Linting & Formatting:** ESLint, Prettier
- **Containerization:** Docker
- **Deployment:** Vercel, Azure App Service

## Prerequisites

- Node.js (Version 22.x recommended, as per `package.json`. Dockerfile uses Node 20)
- npm (comes with Node.js)
- MongoDB (either local instance or a cloud-hosted solution like MongoDB Atlas)
- Docker (Optional, for running with Docker)

## Installation and Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd cuhp_pg_or_room_finder
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory of the project. This file will store sensitive information and configuration settings. The `docker-compose.yaml` file indicates that `PORT` and `DATABASE_URL` are expected. You might need others for services like Twilio, Nodemailer, JWT secret, etc.

    Example `.env` file:

    ```env
    PORT=8000
    DATABASE_URL=mongodb://localhost:27017/cuhp_room_finder # Or your MongoDB Atlas connection string
    JWT_SECRET=your_jwt_secret_key
    JWT_EXPIRES_IN=30d

    # Nodemailer (Email) Configuration
    EMAIL_HOST=your_email_host (e.g., smtp.gmail.com)
    EMAIL_PORT=your_email_port (e.g., 587 or 465)
    EMAIL_USER=your_email_address
    EMAIL_PASSWORD=your_email_password
    EMAIL_FROM=Your App Name <noreply@example.com>

    # Twilio (SMS) Configuration
    TWILIO_ACCOUNT_SID=your_twilio_account_sid
    TWILIO_AUTH_TOKEN=your_twilio_auth_token
    TWILIO_PHONE_NUMBER=your_twilio_phone_number
    ```

## Running the Application

### 1. Development Mode (with Nodemon for auto-reloading)

```bash
npm run dev
```

The server will start on `http://localhost:8000` (or the port specified in your `.env` file).

### 2. Production Mode

First, build the TypeScript code:

```bash
npm run build
```

Then, start the application:

```bash
npm start
```

This will run the compiled JavaScript files from the `dist` directory.

### 3. Using Docker

Ensure Docker and Docker Compose are installed.

1.  **Build and run the container:**
    ```bash
    docker-compose up --build
    ```
    (You can omit `--build` if the image is already built and no changes were made to `Dockerfile` or related files).

The application will be accessible at `http://localhost:8000`.

## Available Scripts

- `npm run lint`: Lint the codebase using ESLint.
- `npm run lint:fix`: Lint the codebase and automatically fix issues.
- `npm run format`: Format the code using Prettier.
- `npm test`: Run tests using Jest.
- `npm run test:watch`: Run tests in watch mode.
- `npm run test:coverage`: Generate a test coverage report.
- `npm run dev`: Start the server in development mode with Nodemon.
- `npm run build`: Compile TypeScript to JavaScript.
- `npm start`: Start the server in production mode (after building).

## API Endpoints Overview

The main API routes are defined in `src/index.ts`:

- `/auth`: Authentication related endpoints (login, register).
- `/otp`: OTP generation and verification.
- `/property`: Property listing management.
- `/chat`: Chat functionalities.
- `/review`: Property reviews and ratings.
- `/saved`: Saved/favorite properties.
- `/`: Root endpoint (health check).

Refer to the route files in `src/routes/` for detailed endpoint definitions.

## Socket.IO Event Overview

The application uses Socket.IO for real-time communication, primarily for chat functionalities. Key events include:

- **`connection`**: Triggered when a client connects to the Socket.IO server. Handles authentication and sets up user-to-socket mapping.
- **`disconnect`**: Triggered when a client disconnects. Cleans up user-to-socket mapping.
- **`join_chat` (emit from client, listen on server)**: Client emits this event to join a specific chat room. The server then adds the client's socket to the corresponding room.
  - Payload: `{ chatId: string }`
- **`send_message` (emit from client, listen on server)**: Client emits this to send a message to a chat room. The server then broadcasts this message to all users in that chat room and saves it to the database.
  - Payload: `{ chatId: string, content: string, senderId: string }`
- **`new_message` (emit from server, listen on client)**: Server emits this to clients in a chat room when a new message is sent.
  - Payload: `{ chatId: string, content: string, sender: { _id: string, name: string }, createdAt: string, readBy: string[] }`
- **`typing_indicator_start` (emit from client, listen on server)**: Client emits this when a user starts typing in a chat.
  - Payload: `{ chatId: string, userId: string }`
- **`typing_indicator_stop` (emit from client, listen on server)**: Client emits this when a user stops typing.
  - Payload: `{ chatId:string, userId: string }`
- **`user_typing` (emit from server, listen on client)**: Server broadcasts this to other users in the chat when someone starts typing.
  - Payload: `{ chatId: string, userId: string, isTyping: true }`
- **`user_stopped_typing` (emit from server, listen on client)**: Server broadcasts this when a user stops typing.
  - Payload: `{ chatId: string, userId: string, isTyping: false }`
- **`mark_as_read` (emit from client, listen on server)**: Client emits this when messages in a chat have been read by the user.
  - Payload: `{ chatId: string, userId: string, messageIds: string[] }`
- **`messages_read` (emit from server, listen on client)**: Server emits this to confirm messages have been marked as read, potentially updating UI for other users in the chat.
  - Payload: `{ chatId: string, userId: string, messageIds: string[] }`

## Project Structure

```
cuhp_pg_or_room_finder/
├── coverage/               # Test coverage reports
├── dist/                   # Compiled JavaScript output (after `npm run build`)
├── src/                    # Source code
│   ├── controllers/        # Request handlers
│   ├── db/                 # Database connection logic
│   ├── middlewares/        # Custom Express middlewares
│   ├── models/             # Mongoose models (database schemas)
│   ├── routes/             # API route definitions
│   ├── socket/             # Socket.IO setup and event handlers
│   ├── template/           # HTML/Email templates
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions (email, JWT, OTP, etc.)
│   └── index.ts            # Main application entry point
├── tests/                  # Automated tests (unit, integration)
│   ├── integration/
│   └── unit/
├── .env.example            # Example environment variables (you should create .env)
├── docker-compose.yaml     # Docker Compose configuration
├── Dockerfile              # Docker configuration
├── jest.config.ts          # Jest test runner configuration
├── nodemon.json            # Nodemon configuration
├── package.json            # Project metadata and dependencies
├── README.md               # This file
├── tsconfig.json           # TypeScript compiler options
└── vercel.json             # Vercel deployment configuration
```

## Deployment

This project is configured for deployment on Vercel using the `vercel.json` file. Vercel will automatically build and deploy the application when connected to your Git repository.

Additionally, the application is configured for deployment to Azure App Service, particularly for features requiring persistent WebSocket connections (e.g., Socket.IO), which may not be fully supported in a serverless environment like Vercel. The deployment to Azure is handled via GitHub Actions, as defined in `.github/workflows/master_cuhp-pg-or-room-finder.yml`.

**Note:** While the REST APIs can be served via Vercel, functionalities like real-time chat (Socket.IO) are intended to run on Azure App Service.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. Please make sure to update tests as appropriate.

## License

[ISC](https://opensource.org/licenses/ISC) - Copyright (c) Naresh Sharma
