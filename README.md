# QueueLess

A backend REST API for managing digital queues, tickets, queue managers, and users.

QueueLess is designed to replace traditional physical waiting lines with a digital queue system. Users can join queues remotely, manage their tickets, and track their position, while queue managers can control their queues and serve customers sequentially.

The project was built as a backend-focused software engineering project using **Node.js, Express.js, MongoDB, and Mongoose**, with an emphasis on authentication, authorization, validation, atomic database operations, concurrency handling, and clean backend structure.

---

## Features

### Authentication & Accounts

* User registration
* Email/account confirmation using OTP
* Login with JWT authentication
* Password hashing with bcrypt
* Forgot password
* Password reset using OTP
* Temporary confirmation tokens
* Account management
* Authentication and authorization middleware
* Automatic cleanup of unconfirmed accounts using MongoDB TTL

### Queue Management

* Create queues
* Update queue information
* Open/close queues
* Activate queue serving
* Queue capacity management
* Queue ownership
* Queue manager authorization

### Digital Tickets

* Join a queue
* Cancel a ticket
* Track ticket status
* Track the user's position
* Retrieve user tickets
* Retrieve tickets belonging to a queue
* Sequential ticket serving
* Ticket status lifecycle

### Ticket Lifecycle

A ticket can have one of the following states:

```text
waiting
serving
canceled
finished
```

Canceled tickets are intentionally kept in the database instead of being immediately deleted. This allows the system to preserve the history of the user's action and maintain an audit trail.

### Security

* JWT authentication
* Password hashing
* Role-based authorization
* Queue ownership verification
* Request validation
* Helmet security headers
* Rate limiting
* Protected routes
* Server-side business-rule validation

---

# How QueueLess Works

The system contains three main roles:

| Role          | Description                                   |
| ------------- | --------------------------------------------- |
| User          | Joins queues and manages their own tickets    |
| Queue Manager | Creates and manages queues and serves tickets |
| Admin         | Has administrative access to the system       |

### Basic Workflow

1. A user creates an account.
2. The user confirms their email using an OTP.
3. The user logs in and receives a JWT.
4. A queue manager creates a queue.
5. A user joins the queue and receives a ticket.
6. The ticket is added to the end of the queue.
7. The queue manager activates the next ticket.
8. The current ticket becomes `finished`.
9. The next valid ticket becomes `serving`.
10. Users can check their ticket status and position.
11. Users can cancel their tickets when necessary.

---

# Linked-List Queue Design

QueueLess uses a linked-list approach for ticket ordering.

Each ticket stores a reference to the previous ticket:

```text
Ticket A
prev = null

Ticket B
prev = Ticket A

Ticket C
prev = Ticket B

Ticket D
prev = Ticket C
```

This creates a chain:

```text
A → B → C → D
```

The queue stores references to important points in the chain, including the current ticket and the last ticket.

When a new ticket is created, the system can append it to the end of the linked list without modifying all existing tickets.

This approach was chosen to avoid mass updates to tickets when a new customer joins the queue.

---

# Ticket Status Flow

A normal ticket follows this lifecycle:

```text
waiting → serving → finished
```

A user can also cancel a waiting ticket:

```text
waiting → canceled
```

Canceled tickets remain stored in the database so the system can distinguish between:

* a user who canceled their ticket
* a ticket that was served
* a ticket that is currently waiting
* a ticket that has already been completed

---

# Architecture

QueueLess follows a layered backend structure:

```text
Request
   ↓
Route
   ↓
Middleware
   ↓
Controller
   ↓
Service
   ↓
Repository / Database Access
   ↓
MongoDB
```

The main project structure is organized around responsibilities:

```text
QueueLess/
│
├── controllers/
├── services/
├── repositories/
├── models/
├── routes/
├── middlewares/
├── validators/
├── config/
├── utils/
│
├── index.js
├── package.json
└── .env
```

The project intentionally avoids unnecessary architectural complexity. The main goal is to keep the backend understandable while separating HTTP handling, business logic, validation, and database operations.

---

# Technology Stack

### Runtime

* Node.js

### Framework

* Express.js

### Database

* MongoDB
* Mongoose

### Authentication

* JSON Web Token (JWT)
* bcryptjs

### Validation

* express-validator

### Security

* Helmet
* express-rate-limit

### Email

* Nodemailer
* OTP-based email verification and password recovery

### Development

* Git
* Postman
* Linux

---

# Installation

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd QueueLess
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
```

Add any additional environment variables required by your local configuration.

> Never commit your `.env` file to GitHub.

---

# Run the Project

Start the server with:

```bash
node index.js
```

For development, if you use nodemon:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:3000
```

---

# API Overview

The API is divided into several areas.

## Authentication

Typical authentication operations include:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/confirmAccount
POST /api/auth/forgotPassword
POST /api/auth/confirmOTP
POST /api/auth/resetPassword
```

Authentication endpoints handle registration, account confirmation, login, and password recovery.

---

## User Account

Authenticated users can manage their own account.

```text
GET    /api/auth/
PUT    /api/auth/me
DELETE /api/auth/me
```

Access to protected account operations requires a valid JWT.

---

## Queues

Queue managers can create and manage queues.

```text
POST   /api/queues/
PUT    /api/queues/manager/:queueId
PATCH  /api/queues/manager/:queueId
POST   /api/queues/manager/activate/:queueId
```

---

## Tickets

Users can interact with queues through tickets.

```text
POST /api/queues/tickets
PUT  /api/queues/tickets
```

Additional endpoints are available for retrieving queue tickets, user tickets, and ticket positions.

For the complete API specification, see the project documentation.

---

# Authentication

Protected endpoints require a JWT.

The token is normally sent using the HTTP `Authorization` header:

```http
Authorization: Bearer <token>
```

Authentication is handled through middleware before the request reaches protected controllers.

Authorization is then applied according to the user's role and resource ownership.

---

# Validation

QueueLess uses request validation middleware to validate incoming data before it reaches the controller.

The general flow is:

```text
Request
   ↓
Authentication
   ↓
Authorization
   ↓
Validation
   ↓
Validation Handler
   ↓
Controller
   ↓
Service
```

Validation is used to prevent invalid requests from reaching the business logic layer.

Business rules are additionally enforced inside the service layer and, where appropriate, through database constraints.

---

# Concurrency Considerations

One of the main technical goals of QueueLess is handling concurrent requests correctly.

Queue operations can naturally suffer from race conditions.

For example, two users may attempt to join the same queue at almost exactly the same time.

QueueLess uses atomic MongoDB operations in important parts of the queue logic to reduce the possibility of inconsistent state.

Examples include:

* atomic queue updates
* atomic ticket cancellation
* capacity checks
* controlled ticket insertion
* ownership checks
* state-based ticket transitions

Concurrency remains one of the more complex areas of the project and is an important area for future improvement through stronger transaction and locking strategies.

---

# Rate Limiting

Rate limiting is used to protect sensitive endpoints and reduce abuse.

Examples include limits for:

* Login attempts
* Registration
* OTP confirmation
* Password recovery
* Ticket creation
* Queue creation

Rate limits help protect authentication endpoints from excessive requests and reduce accidental or malicious abuse.

---

# Example Workflow

A simplified example of using QueueLess:

### 1. Register

```http
POST /api/auth/register
```

The user provides their account information.

### 2. Confirm Account

The user receives an OTP by email.

```http
POST /api/auth/confirmAccount
```

After successful confirmation, the account becomes active.

### 3. Login

```http
POST /api/auth/login
```

The server returns a JWT.

### 4. Create a Queue

A queue manager creates a queue:

```http
POST /api/queues/
Authorization: Bearer <token>
```

### 5. Join the Queue

A user creates a ticket:

```http
POST /api/queues/tickets
Authorization: Bearer <token>
```

The ticket starts with:

```text
status = waiting
```

### 6. Serve the Next Ticket

The queue manager activates the next ticket:

```http
POST /api/queues/manager/activate/:queueId
Authorization: Bearer <token>
```

The current ticket becomes:

```text
finished
```

and the next valid ticket becomes:

```text
serving
```

---

# Error Handling

The API uses centralized error-handling mechanisms to provide consistent HTTP responses.

Examples of possible errors include:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

The service layer is responsible for detecting business-rule violations, while middleware and controllers handle request-level concerns.

---

# Project Strengths

Some of the main strengths of QueueLess are:

* Real-world backend use case
* Clear separation of responsibilities
* JWT authentication
* Role-based authorization
* OTP account verification
* Password recovery
* Secure password hashing
* Request validation
* Rate limiting
* Queue ownership verification
* Linked-list ticket ordering
* Atomic MongoDB operations
* Capacity handling
* Ticket state management
* Concurrency awareness
* Auditability of canceled tickets
* Backend-only architecture suitable for API testing with Postman

The project is intentionally focused on backend engineering rather than building a frontend interface.

---

# Current Limitations

QueueLess is a learning and portfolio project and is not intended to claim production-level robustness.

Some areas that can be improved include:

### Database Consistency

Some operations modify multiple documents separately.

MongoDB transactions could be introduced where atomic multi-document changes are required.

### Concurrency

Some complex queue operations involve multiple database operations.

A stronger locking or transaction strategy could further improve reliability.

### Testing

Automated unit and integration tests can be added to cover:

* authentication
* authorization
* ticket creation
* queue capacity
* concurrent requests
* ticket cancellation
* queue activation
* duplicate registrations
* OTP operations

### API Documentation

OpenAPI / Swagger could be added to provide interactive API documentation.

### Real-Time Updates

Socket.IO or WebSocket functionality could be added so users receive real-time updates when:

* their position changes
* their ticket becomes active
* the queue opens or closes
* their ticket is canceled
* the manager serves the next customer

---

# Testing

The API can be tested using Postman.

Recommended testing scenarios include:

### Authentication

* Register a new user
* Confirm the account
* Login
* Use an invalid JWT
* Attempt to access protected routes without authentication

### Authorization

* User attempts to access another user's resource
* Regular user attempts manager operation
* Manager attempts to modify another manager's queue
* Unauthorized admin operations

### Queue

* Create a queue
* Update a queue
* Close a queue
* Reopen a queue
* Exceed queue capacity
* Attempt to modify another user's queue

### Tickets

* Join a queue
* Join a full queue
* Create duplicate active tickets
* Cancel a ticket
* Attempt to cancel another user's ticket
* Retrieve ticket position
* Serve the next ticket
* Handle canceled tickets between active tickets

### Concurrency

Test multiple requests arriving at nearly the same time for:

* ticket creation
* queue capacity
* ticket cancellation
* serving the next ticket

---

# Future Improvements

Possible future improvements include:

* MongoDB transactions
* More robust concurrency control
* Automated testing
* Swagger / OpenAPI
* Structured logging
* Request IDs
* Socket.IO real-time communication
* Email notifications
* Queue analytics
* Improved monitoring
* Deployment with Nginx
* Docker/Podman containerization
* CI/CD pipeline

---

# What I Learned

Building QueueLess helped me practice backend concepts beyond simply creating CRUD endpoints.

The project focused particularly on:

* Designing backend architecture
* Authentication and authorization
* JWT
* Password security
* OTP workflows
* Request validation
* Middleware design
* MongoDB data modeling
* Mongoose
* Atomic database operations
* Race conditions
* Concurrency problems
* State transitions
* Rate limiting
* Error handling
* API design
* Separation of business logic and database access

The project also helped identify areas that require more advanced backend concepts, particularly transactions, automated testing, stronger concurrency control, and eventually more advanced architectural patterns.

---

# Project Status

**Status:** Active learning / portfolio project

The core queue management functionality is implemented. Future development will focus on improving reliability, testing, documentation, real-time communication, and deployment.

---

# Author

**Haidar Shawish**

Software Engineering Student
Backend Developer

Main interests:

* Backend Development
* Node.js
* Express.js
* TypeScript
* MongoDB
* MySQL
* REST APIs
* Software Architecture
* Linux

---

# License

This project is intended primarily for educational and portfolio purposes.
