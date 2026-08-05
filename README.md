# Task Tracking System

A Node.js task tracking API with user authentication, task management, and team collaboration features.

## Features

- User registration and secure login with JWT
- User profile view/update
- Task creation, assignment, completion, filtering, sorting, and search
- Team/project creation, member invites, and join flow
- Comments and attachments for tasks
- MongoDB persistence

## Getting Started

### Prerequisites

- Node.js 18+ or later
- MongoDB database

### Install dependencies

```bash
npm install
```

### Configure environment

Create a `.env` file in the repository root with values similar to:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/tasktrackingsystem
JWT_SECRET=your_jwt_secret_here
```

### Run the server

```bash
npm start
```

The application starts on the configured `PORT` (default `3000`).

## Project Layout

- `src/app.js` - Express app configuration and route wiring
- `src/index.js` - Application entry point
- `src/config/db.js` - MongoDB connection setup
- `src/controllers/` - Route handlers for auth, tasks, and teams
- `src/middlewares/` - Authentication middleware
- `src/models/` - Mongoose models for User, Task, Team, and Comment
- `src/routes/` - REST API route definitions

## API Endpoints

### Authentication

- `POST /api/auth/register`
  - Body: `name`, `email`, `password`
- `POST /api/auth/login`
  - Body: `email`, `password`
- `GET /api/auth/profile`
  - Requires `Authorization: Bearer <token>`
- `PUT /api/auth/profile`
  - Requires `Authorization: Bearer <token>`
  - Body: optional `name`, `email`, `password`
- `POST /api/auth/logout`
  - Requires `Authorization: Bearer <token>`

### Tasks

- `POST /api/tasks`
  - Create a task with `title`, `description`, and `dueDate`
- `GET /api/tasks`
  - List tasks assigned to or created by the authenticated user
  - Query params: `status`, `search`, `sortBy`, `teamId`, `assignedTo`
- `GET /api/tasks/assigned`
  - List tasks assigned to the authenticated user
- `GET /api/tasks/:id`
  - Get a specific task by ID
- `PUT /api/tasks/:id`
  - Update task fields
- `PATCH /api/tasks/:id/complete`
  - Mark a task as completed
- `POST /api/tasks/:id/assign`
  - Assign a task to another user (`userId`)
- `POST /api/tasks/:id/comments`
  - Add a comment to a task (`body`)
- `POST /api/tasks/:id/attachments`
  - Upload a task attachment (`attachment`)

### Teams

- `POST /api/teams`
  - Create a new team with `name` and optional `description`
- `GET /api/teams`
  - List teams the authenticated user belongs to
- `POST /api/teams/:id/invite`
  - Invite a user to a team (`userId`)
- `POST /api/teams/:id/join`
  - Join a team using an invite

## Notes

- The current logout uses an in-memory token blacklist. For production, replace this with a persistent store.
- Task search uses MongoDB text indexes on `title` and `description`.
- Attachments are stored in `src/uploads` and served from `/uploads`.
