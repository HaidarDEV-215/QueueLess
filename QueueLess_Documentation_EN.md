# QueueLess

## Digital Queue Management Backend

> Backend API for managing digital queues and tickets, built with Node.js, Express, and MongoDB/Mongoose.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [1. General Goal](#1-general-goal)
3. [2. Problems Solved by the System](#2-problems-solved-by-the-system)
4. [3. How the System Works](#3-how-the-system-works)
5. [Roles and Permissions](#roles-and-permissions)
6. [Data Model](#data-model)
7. [Linked List Mechanism](#linked-list-mechanism)
8. [Ticket Lifecycle](#ticket-lifecycle)
9. [Architecture and Project Structure](#architecture-and-project-structure)
10. [Technologies Used](#technologies-used)
11. [4. Installation and Running](#4-installation-and-running)
12. [Environment Variables](#environment-variables)
13. [5. API Documentation](#5-api-documentation)
14. [Authentication](#authentication)
15. [Queue and Ticket API](#queue-and-ticket-api)
16. [Manager API](#manager-api)
17. [Account API](#account-api)
18. [Admin API](#admin-api)
19. [6. End-to-End System Flow](#6-end-to-end-system-flow)
20. [7. Security and Validation](#7-security-and-validation)
21. [8. Strengths](#8-strengths)
22. [9. Weaknesses and Limitations](#9-weaknesses-and-limitations)
23. [10. Suggested Tests](#10-suggested-tests)
24. [11. Using Postman](#11-using-postman)
25. [12. Future Improvements](#12-future-improvements)
26. [13. Conclusion](#13-conclusion)

---

# Project Overview

QueueLess is a Backend API for a Digital Queue Management System.

The core idea is to replace traditional physical waiting with a digital sequence of tickets. A user can register, join an open queue, receive a Ticket, check its state and position, and cancel it when allowed.

A Queue Manager can create and manage queues, activate a queue, and move from one ticket to the next.

An Administrator can manage user accounts and system-level permissions.

The project is backend-focused, so the complete workflow can be tested with Postman without requiring a frontend.

---

# 1. General Goal

The goal of QueueLess is to build a real backend system for digital queue management, with a focus on:

- Authentication using JWT.
- Role-based authorization.
- Account confirmation using email OTP.
- Password recovery using OTP.
- Queue management.
- Ticket lifecycle management.
- Representing ticket order using a Linked List inside MongoDB.
- Enforcing queue capacity.
- Preventing operations that are not allowed according to ticket state or resource ownership.
- Handling some concurrent requests using MongoDB atomic operations.
- Protecting the API using validation, rate limiting, and Helmet.
- Separating Routes, Middlewares, Controllers, Services, and Models.

The project is not simply CRUD; its main challenge is maintaining queue state, ticket ordering, and the business rules around them.

---

# 2. Problems Solved by the System

## 2.1 Physical Waiting

In a traditional system, a person may need to remain at the location to know when their turn arrives.

QueueLess allows users to join a queue digitally and follow their ticket through the API.

## 2.2 Lack of Visibility Into Queue Order

Each Ticket references the ticket before it through the `prev` field.

This allows the system to maintain the logical ticket sequence.

## 2.3 Queue Management

A Queue Manager can:

- Create a Queue.
- Open and close a Queue.
- View tickets in a Queue.
- Activate a Queue.
- Move to the next ticket.

## 2.4 Ticket Cancellation

When a user cancels a Ticket, it is not immediately treated as if it never existed.

The Ticket remains with:

```text
canceled
```

so the queue-processing system can encounter it as part of the sequence and handle it accordingly.

This preserves a clear record of the cancellation instead of immediately deleting the Ticket.

## 2.5 Permission Control

The system distinguishes between:

```text
normalUser
queueManager
admin
```

A normal user cannot perform Queue Manager or Administrator operations.

---

# 3. How the System Works

The system can be summarized as:

```text
User
  |
  | Authentication
  v
JWT
  |
  v
Queue
  |
  +---- Ticket 1
  |       prev = null
  |
  +---- Ticket 2
  |       prev = Ticket 1
  |
  +---- Ticket 3
          prev = Ticket 2
```

When a Queue is created, the system stores information such as:

- Queue name.
- Queue creator.
- Capacity.
- Current length.
- Last Ticket.
- Current ticket being served.
- Queue status.

When a user joins a Queue, the system creates a Ticket and stores a reference to the Ticket that was previously at the end of the Queue.

Example:

```text
Ticket A
prev = null

Ticket B
prev = A

Ticket C
prev = B
```

When a Manager starts processing the Queue, the next Ticket can be found by searching for:

```text
Ticket.prev == currentTurn
```

In other words:

```text
Current Ticket
      |
      v
Ticket whose prev = Current Ticket
```

If the next Ticket is canceled, the system continues through the sequence until it finds an eligible Ticket.

---

# Roles and Permissions

## Normal User

A normal user can:

- Register an account.
- Confirm the account.
- Log in.
- Recover a password.
- Update account information.
- Delete their account.
- Create a Ticket in an open Queue.
- View their Tickets.
- View their Ticket in a specific Queue.
- Check the Ticket position.
- Cancel a Ticket they own while it is `waiting`.

A normal user cannot:

- Create a Queue.
- Activate a Queue.
- Move between Queue tickets.
- Modify another Manager's Queue.
- Perform Administrator operations.

## Queue Manager

A Queue Manager can:

- Create a Queue.
- View tickets in their Queue.
- Update their Queue.
- Open and close their Queue.
- Activate a Queue.
- Move to the next Ticket.

The system also verifies that the Queue is actually owned by the current Manager, rather than checking the Role alone.

## Admin

An Administrator can:

- View users.
- Delete users.
- Change a user's Role.

---

# Data Model

## User

Main fields:

```text
firstName
lastName
email
role
password
phone
isConfirmed
pendingExpiresAt
createdAt
updatedAt
```

Allowed Roles:

```text
normalUser
queueManager
admin
```

Passwords are stored as hashes using bcryptjs.

Unconfirmed accounts use `pendingExpiresAt` with MongoDB TTL so they can be automatically cleaned up after an approximate period.

---

## Queue

Main fields:

```text
name
createdBy
capacity
currentLength
lastTicket
currentTurn
status
createdAt
updatedAt
```

### `currentLength`

Represents the current number used by the application when enforcing queue capacity.

### `lastTicket`

References the last Ticket added to the Queue and is used to determine `prev` when a new Ticket is created.

### `currentTurn`

References the Ticket currently being served.

### `status`

Values:

```text
open
closed
```

---

## Ticket

Main fields:

```text
owner
queue
prev
status
isCheckedBySystem
createdAt
updatedAt
```

### `owner`

The user who owns the Ticket.

### `queue`

The Queue to which the Ticket belongs.

### `prev`

A reference to the previous Ticket in the sequence.

### `status`

Values:

```text
waiting
serving
canceled
finished
```

### `isCheckedBySystem`

Used in some Queue-processing operations to help prevent the same Ticket from being processed more than once by concurrent requests.

---

## OTP

Contains:

```text
user
email
code
expiresAt
createdAt
updatedAt
```

The OTP itself is stored as a hash rather than plain text.

TTL on `expiresAt` is used to clean up expired OTP records.

---

# Linked List Mechanism

QueueLess does not store a "number of people before you" counter inside every Ticket.

Instead, it uses:

```text
prev
```

Example:

```text
Ticket A
prev = null

Ticket B
prev = A

Ticket C
prev = B

Ticket D
prev = C
```

If the current Ticket is `B`, the system can search for:

```text
Ticket where prev = B
```

to find `C`.

## Advantage of This Design

When a Ticket in the middle of the Queue is canceled, the system does not need to modify every Ticket after it.

Example:

```text
A -> B -> C -> D
```

If `B` is canceled:

```text
A -> B(canceled) -> C -> D
```

When processing reaches `B`, the system can skip it and continue to `C`.

---

# Ticket Lifecycle

Main states:

```text
waiting
   |
   v
serving
   |
   v
finished
```

or:

```text
waiting
   |
   v
canceled
```

A canceled Ticket does not become `serving`.

---

# Architecture and Project Structure

The current structure uses a simple Functional/Procedural style without introducing DDD, SOLID, or a class-heavy architecture.

Main components:

```text
QueueLess/
│
├── index.js
│
├── config/
│   └── mongoDB.js
│
├── routes/
│   ├── auth.routes.js
│   ├── queues.routes.js
│   ├── manager.routes.js
│   ├── users.routes.js
│   └── admin.routes.js
│
├── controllers/
│   ├── auth.controllers.js
│   ├── queue.controllers.js
│   ├── usersProfile.controllers.js
│   └── admin.controllers.js
│
├── services/
│   ├── auth.services.js
│   ├── queue.services.js
│   └── usersProfiles.services.js
│
├── models/
│   ├── user.model.js
│   ├── queue.model.js
│   ├── ticket.model.js
│   └── otp.model.js
│
├── middlewares/
│   ├── verifyToken.js
│   ├── validationHandler.js
│   ├── rateLimits.js
│   ├── asyncWrapper.js
│   └── errorHandlers.js
│
├── validators/
│   ├── authValidators.js
│   ├── queueValidators.js
│   └── userUpdateValidators.js
│
└── utils/
    ├── appError.js
    ├── createJWT.js
    ├── emailService.js
    └── emailsTemplates.js
```

## Request Flow

A typical request flows approximately as follows:

```text
HTTP Request
     ↓
Route
     ↓
Middleware
     ↓
Validation / Authentication / Authorization
     ↓
Controller
     ↓
Service
     ↓
Mongoose Model
     ↓
MongoDB
     ↓
Service
     ↓
Controller
     ↓
HTTP Response
```

---

# Technologies Used

| Technology | Usage |
|---|---|
| Node.js | Runtime |
| Express 5 | HTTP Server / REST API |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| bcryptjs | Password / OTP Hashing |
| Nodemailer | Email |
| express-validator | Request Validation |
| express-rate-limit | Rate Limiting |
| Helmet | HTTP Security Headers |
| CORS | Cross-Origin Requests |
| dotenv | Environment Variables |
| validator | Email validation |
| crypto | OTP generation |
| nodemon | Development server |

---

# 4. Installation and Running

## Requirements

You need:

- Node.js.
- npm.
- MongoDB or MongoDB Atlas.
- A valid SMTP email account if you want to use OTP and email functionality.

The project does not require a frontend to run.

---

## 4.1 Clone the Project

After obtaining the project:

```bash
git clone https://github.com/HaidarDEV-215/QueueLess.git
cd QueueLess
```

If you have the project as a ZIP file:

```bash
unzip QueueLess.zip
cd QueueLess
```

---

## 4.2 Install Packages

Run:

```bash
npm install
```

npm reads:

```text
package.json
```

and installs the required Dependencies and Dev Dependencies.

---

## 4.3 Create `.env`

Create a file named:

```text
.env
```

in the project root, next to `index.js`.

Example:

```env
PORT=3000
mongoDB_URI=mongodb://127.0.0.1:27017/queueless
SECURITY_CODE=your_secret_key
APP_EMAIL=your_email@gmail.com
APP_PASSWORD=your_email_app_password
```

### Required Variables

| Variable | Usage |
|---|---|
| `PORT` | Express port |
| `mongoDB_URI` | MongoDB connection URI |
| `SECURITY_CODE` | Secret used to sign JWTs |
| `APP_EMAIL` | Email used to send messages |
| `APP_PASSWORD` | SMTP password/credentials |

> Never commit your `.env` file to GitHub.

---

## 4.4 Run the Application

The project contains:

```json
"start": "nodemon index.js"
```

Run:

```bash
npm start
```

The application starts on the port specified by:

```env
PORT
```

For example:

```text
http://localhost:3000
```

when:

```env
PORT=3000
```

---

## 4.5 Run Directly

You can also run:

```bash
node index.js
```

However, `npm start` uses `nodemon`, which automatically restarts the application when development files change.

---

# Environment Variables and Security

Do not commit real values for:

```text
SECURITY_CODE
APP_PASSWORD
APP_EMAIL
mongoDB_URI
```

Use `.gitignore`:

```gitignore
.env
node_modules/
```

---

# 5. API Documentation

## Base URL

For local development:

```text
http://localhost:3000
```

Base paths:

```text
/api/auth
/api/queues
/api/accounts
/api/manager
/api/admin
```

---

# Authentication

## 1. Register

### Endpoint

```http
POST /api/auth/register
```

### Purpose

Creates a new unconfirmed account and sends an OTP for email confirmation.

### Body

```json
{
  "firstName": "Haidar",
  "lastName": "Shawish",
  "email": "haidar@example.com",
  "phone": "0999999999",
  "password": "StrongPassword123!"
}
```

### Fields

| Field | Type | Required |
|---|---|---|
| `firstName` | String | Yes |
| `lastName` | String | Yes |
| `email` | String | Yes |
| `phone` | String | Yes |
| `password` | String | Yes |

### Important Constraints

`firstName` and `lastName`:

```text
2 - 20 characters
```

Password:

```text
8 - 16 characters
```

and must satisfy the project's `isStrongPassword()` requirements.

### Response

```json
{
  "message": "user account created successfully, but email not confirmed!",
  "data": {
    "token": "<temporary-confirmation-token>"
  }
}
```

The returned Token is not a normal Authentication Token.

Its purpose is:

```text
confirm_account
```

and it is used by the account confirmation endpoint.

---

# 2. Confirm Account

### Endpoint

```http
PUT /api/auth/confirmAccount
```

### Authentication

Send the Temporary Confirmation Token:

```http
Authorization: Bearer <temporary-confirmation-token>
```

### Body

```json
{
  "code": "123456"
}
```

### Purpose

Confirms the account using the OTP.

### Response

```json
{
  "message": "account confirmed successfully",
  "data": {
    "token": "<authentication-token>"
  }
}
```

The returned Token is a normal JWT for protected endpoints.

---

# 3. Login

### Endpoint

```http
POST /api/auth/login
```

### Body

```json
{
  "email": "haidar@example.com",
  "password": "StrongPassword123!"
}
```

### Response

```json
{
  "message": "user logged in successfully",
  "data": {
    "token": "<jwt>"
  }
}
```

Use the returned Token:

```http
Authorization: Bearer <jwt>
```

---

# 4. Forgot Password

### Endpoint

```http
POST /api/auth/forgetPassword
```

### Body

```json
{
  "email": "haidar@example.com"
}
```

### Purpose

Sends an OTP to the email associated with the account.

### Response

```json
{
  "message": "a verification email sent!"
}
```

---

# 5. Confirm OTP

### Endpoint

```http
POST /api/auth/confirmOtp
```

### Body

```json
{
  "email": "haidar@example.com",
  "code": "123456"
}
```

### Purpose

Verifies the OTP used for password recovery.

### Response

```json
{
  "message": "email verified",
  "data": "<password-changing-token>"
}
```

This is a temporary Token whose purpose is:

```text
password_changing
```

---

# 6. Change Password

### Endpoint

```http
PUT /api/auth/changePassword
```

### Authentication

```http
Authorization: Bearer <password-changing-token>
```

### Body

```json
{
  "password": "NewStrongPassword123!"
}
```

### Response

```json
{
  "message": "password changed"
}
```

---

# Queue and Ticket API

## 7. Create Ticket / Join Queue

### Endpoint

```http
POST /api/queues/tickets
```

### Authentication

```http
Authorization: Bearer <authentication-token>
```

### Body

```json
{
  "queueId": "<queue-id>"
}
```

The current Controller also accepts `status`, but from an API design perspective the client should not choose the Ticket state. The normal state when joining is:

```text
waiting
```

### Purpose

Adds the current user to an open Queue.

### Main Rules

- The Queue must be open.
- The Queue must not be full.
- `prev` is determined from `lastTicket`.
- `lastTicket` is updated.
- `currentLength` is updated.
- Multiple waiting Tickets for the same user in the same Queue are prevented by the application logic.

### Response

```json
{
  "message": "ticket created successfully",
  "data": {
    "_id": "<ticket-id>",
    "owner": "<user-id>",
    "queue": "<queue-id>",
    "prev": "<previous-ticket-id-or-null>",
    "status": "waiting"
  }
}
```

---

# 8. Cancel Ticket

### Endpoint

```http
PUT /api/queues/tickets
```

### Authentication

```http
Authorization: Bearer <authentication-token>
```

### Body

```json
{
  "ticketId": "<ticket-id>"
}
```

### Purpose

Cancels a Ticket owned by the current user.

### Rule

The Ticket must be:

```text
waiting
```

A user cannot cancel another user's Ticket.

### Response

```json
{
  "message": "ticket canceled",
  "data": {
    "...": "ticket data"
  }
}
```

The Ticket state becomes:

```text
canceled
```

---

# 9. Get My Tickets

### Endpoint

```http
GET /api/queues/tickets
```

### Authentication

```http
Authorization: Bearer <authentication-token>
```

### Query Parameters

Optional:

```text
?page=1&limit=10
```

Example:

```http
GET /api/queues/tickets?page=1&limit=10
```

### Response

```json
{
  "items": 2,
  "data": [
    {
      "...": "ticket"
    }
  ]
}
```

Returns only Tickets belonging to the current user.

---

# 10. Get My Ticket in a Queue

### Endpoint

```http
GET /api/queues/tickets/:queueId
```

### Authentication

```http
Authorization: Bearer <authentication-token>
```

### Example

```http
GET /api/queues/tickets/64f...
```

### Purpose

Returns the current user's Ticket inside a specific Queue.

If no suitable Ticket exists, the system returns an error.

---

# Manager API

All endpoints below require:

```http
Authorization: Bearer <authentication-token>
```

The user's Role must be:

```text
queueManager
```

---

# 11. Create Queue

### Endpoint

```http
POST /api/manager
```

### Body

```json
{
  "name": "General Consultation",
  "capacity": 50,
  "status": "open"
}
```

### Fields

| Field | Type | Required |
|---|---|---|
| `name` | String | Yes |
| `capacity` | Number | Yes |
| `status` | String | Optional |

Allowed `status` values:

```text
open
closed
```

If `status` is not provided, the Controller uses:

```text
open
```

### Response

```json
{
  "message": "queue created successfully",
  "data": {
    "...": "queue"
  }
}
```

---

# 12. Get All Tickets in Manager Queue

### Endpoint

```http
GET /api/manager/:queueId
```

### Authentication

Manager only.

### Query Parameters

```text
?page=1&limit=10
```

### Example

```http
GET /api/manager/64f...?page=1&limit=10
```

### Purpose

Returns Tickets in the Queue owned by the current Manager.

### Ownership

The system verifies:

```text
queue._id == queueId
AND
queue.createdBy == currentUser
```

This prevents a Manager from managing a Queue owned by another Manager.

---

# 13. Update Queue

### Endpoint

```http
PUT /api/manager/:queueId
```

### Body

Possible fields:

```json
{
  "name": "Updated Queue Name",
  "capacity": 100,
  "status": "open"
}
```

All fields are optional.

### Allowed Fields

```text
name
capacity
status
```

### Response

```json
{
  "message": "ticket updated",
  "data": {
    "...": "updated queue"
  }
}
```

---

# 14. Toggle Queue Status

### Endpoint

```http
PATCH /api/manager/:queueId
```

### Body

No body required.

### Behavior

If the current status is:

```text
open
```

it becomes:

```text
closed
```

If it is:

```text
closed
```

it becomes:

```text
open
```

### Response

```json
{
  "message": "done.. queue is open",
  "data": {
    "...": "queue"
  }
}
```

---

# 15. Activate Queue

### Endpoint

```http
POST /api/manager/activate/:queueId
```

### Body

No body required.

### Purpose

Starts processing a Queue for the first time.

The system searches for the first Ticket in the sequence, skips canceled Tickets, and sets the eligible Ticket to:

```text
serving
```

It also stores that Ticket in:

```text
Queue.currentTurn
```

### Response

```json
{
  "message": "queue has been activated",
  "data": {
    "...": "queue"
  }
}
```

---

# 16. Move to Next Ticket

### Endpoint

```http
PUT /api/manager/activate/:queueId
```

### Body

No body required.

### Purpose

Finishes the current Ticket and moves to the next Ticket.

Conceptually:

```text
current serving
       |
       v
finished

next ticket
       |
       v
serving
```

If the next Ticket is:

```text
canceled
```

the system skips it and searches for the next Ticket in the sequence.

### Response

```json
{
  "message": "swapped to next ticket",
  "data": {
    "...": "queue"
  }
}
```

---

# Account API

## 17. Update My Account

### Endpoint

```http
PUT /api/accounts/me
```

### Authentication

Any authenticated user.

### Body

Possible fields:

```json
{
  "firstName": "Haidar",
  "lastName": "Updated",
  "phone": "0999999999"
}
```

All fields are optional.

This endpoint does not allow changing:

```text
email
password
role
isConfirmed
```

---

# 18. Delete My Account

### Endpoint

```http
DELETE /api/accounts/me
```

### Authentication

```http
Authorization: Bearer <authentication-token>
```

### Body

No body required.

### Purpose

Deletes the current user's account.

---

# Admin API

All endpoints below require:

```http
Authorization: Bearer <authentication-token>
```

The user's Role must be:

```text
admin
```

---

# 19. Get All Users

### Endpoint

```http
GET /api/admin
```

### Query Parameters

```text
?page=1&limit=10
```

### Response

```json
{
  "items": 10,
  "data": [
    {
      "...": "user without password"
    }
  ]
}
```

Passwords are not returned.

---

# 20. Delete User

### Endpoint

```http
DELETE /api/admin
```

### Body

```json
{
  "userId": "<user-id>"
}
```

### Purpose

Allows an Administrator to delete a user.

### Response

```json
{
  "message": "user deleted successfully",
  "data": null
}
```

---

# 21. Change User Role

### Endpoint

```http
PUT /api/admin/permissions
```

### Body

```json
{
  "userId": "<user-id>",
  "newRole": "queueManager"
}
```

Valid values:

```text
normalUser
queueManager
admin
```

### Response

```json
{
  "message": "role changed",
  "data": {
    "...": "updated user"
  }
}
```

---

# All Endpoints Summary

| # | Method | Endpoint | Role |
|---:|---|---|---|
| 1 | POST | `/api/auth/register` | Public |
| 2 | PUT | `/api/auth/confirmAccount` | Temporary confirmation token |
| 3 | POST | `/api/auth/login` | Public |
| 4 | POST | `/api/auth/forgetPassword` | Public |
| 5 | POST | `/api/auth/confirmOtp` | Public |
| 6 | PUT | `/api/auth/changePassword` | Password-change token |
| 7 | POST | `/api/queues/tickets` | Authenticated User |
| 8 | PUT | `/api/queues/tickets` | Authenticated User |
| 9 | GET | `/api/queues/tickets` | Authenticated User |
| 10 | GET | `/api/queues/tickets/:queueId` | Authenticated User |
| 11 | POST | `/api/manager` | Queue Manager |
| 12 | GET | `/api/manager/:queueId` | Queue Manager |
| 13 | PUT | `/api/manager/:queueId` | Queue Manager |
| 14 | PATCH | `/api/manager/:queueId` | Queue Manager |
| 15 | POST | `/api/manager/activate/:queueId` | Queue Manager |
| 16 | PUT | `/api/manager/activate/:queueId` | Queue Manager |
| 17 | PUT | `/api/accounts/me` | Authenticated User |
| 18 | DELETE | `/api/accounts/me` | Authenticated User |
| 19 | GET | `/api/admin` | Admin |
| 20 | DELETE | `/api/admin` | Admin |
| 21 | PUT | `/api/admin/permissions` | Admin |

> There are 21 implemented HTTP operations, with some operations sharing the same URL but using different HTTP methods.

---

# 6. End-to-End System Flow

The following is the normal complete workflow.

## Stage 1 — Account Registration

```text
POST /api/auth/register
```

The user sends:

```text
name
email
phone
password
```

The system:

1. Validates the data.
2. Checks that the email does not already exist.
3. Hashes the password.
4. Creates an unconfirmed User.
5. Creates an OTP.
6. Sends the OTP by email.
7. Returns a Temporary JWT.

---

## Stage 2 — Account Confirmation

```text
PUT /api/auth/confirmAccount
```

The user sends the OTP with the Temporary Token.

If valid:

```text
isConfirmed = true
```

The user then receives an Authentication JWT.

---

## Stage 3 — Login

```text
POST /api/auth/login
```

The user receives a JWT and uses:

```http
Authorization: Bearer <token>
```

for protected endpoints.

---

## Stage 4 — Manager Creates a Queue

The Manager sends:

```text
POST /api/manager
```

Example:

```json
{
  "name": "General Consultation",
  "capacity": 20
}
```

---

## Stage 5 — Open the Queue

The Manager can use:

```text
PATCH /api/manager/:queueId
```

to toggle the Queue status.

---

## Stage 6 — User Joins

The user sends:

```text
POST /api/queues/tickets
```

with:

```json
{
  "queueId": "<queue-id>"
}
```

If this is the first user:

```text
Ticket A
prev = null
```

Second user:

```text
Ticket B
prev = A
```

Third user:

```text
Ticket C
prev = B
```

---

## Stage 7 — Check Position

The user sends:

```text
GET /api/queues/tickets/:queueId
```

The system can traverse the Ticket sequence to determine the user's Ticket position.

---

## Stage 8 — Start Service

The Manager sends:

```text
POST /api/manager/activate/:queueId
```

The first eligible Ticket becomes:

```text
serving
```

and becomes:

```text
queue.currentTurn
```

---

## Stage 9 — Move to the Next Ticket

The Manager sends:

```text
PUT /api/manager/activate/:queueId
```

The current Ticket becomes:

```text
finished
```

and the next eligible Ticket becomes:

```text
serving
```

---

## Stage 10 — Canceled Ticket

If the sequence is:

```text
A -> B -> C -> D
```

and the owner of `C` cancels it:

```text
A -> B -> C(canceled) -> D
```

when processing reaches `C`, the system skips it and continues to `D`.

---

# 7. Security and Validation

## JWT Authentication

The system uses JSON Web Tokens.

There are multiple Token purposes:

```text
authentication
confirm_account
password_changing
```

This is preferable to using one Token type for every sensitive operation.

---

## Role-Based Authorization

There is a Manager-specific middleware:

```text
authorizeQueueManager
```

and an Admin-specific middleware:

```text
authorizeAdmin
```

---

## Ownership

Having the Manager Role alone is not sufficient.

When managing a Queue, the system also checks:

```text
createdBy == currentUser
```

to prevent a Manager from managing another Manager's Queue.

---

## Password Hashing

The system uses:

```text
bcryptjs
```

to store password hashes.

---

## OTP Hashing

OTP values are not stored as plain text.

The code is hashed before being stored.

---

## Validation

The project uses:

```text
express-validator
```

with the following flow:

```text
Request
   ↓
Validator
   ↓
validationHandler
   ↓
Controller
   ↓
Service
```

---

## Helmet

The project uses:

```text
helmet
```

to add common HTTP security headers.

---

## CORS

CORS is enabled to support requests from other applications.

---

## Rate Limiting

There is general rate limiting in addition to limiters for authentication and OTP operations.

Examples include:

```text
Login
Register
Confirm Account
Forgot Password
Confirm OTP
Reset Password
Ticket/Queue POST operations
```

The goal is to reduce abuse and request flooding.

---

# 8. Strengths

## 8.1 Non-Traditional Project Idea

QueueLess is more distinctive than common CRUD projects such as:

```text
Task Manager
Simple Blog
Basic Todo
```

because it contains real Domain Logic.

---

## 8.2 Linked List Inside the Database

Using:

```text
prev
lastTicket
currentTurn
```

creates a clear model for Ticket sequencing.

This is one of the technically distinctive parts of the project.

---

## 8.3 Concurrency Awareness

The project does not assume that requests always arrive one after another.

Ticket creation uses:

- Pre-generating an ObjectId.
- Atomic Queue Update.
- `$expr` to check capacity during the update.
- `$set` to update `lastTicket`.
- `$inc` to update `currentLength`.

This reduces problems during concurrent Ticket creation.

---

## 8.4 Atomic State Transition

Ticket cancellation uses conditions such as:

```text
_id
owner
status = waiting
```

within the update operation itself.

This prevents two requests from successfully performing the same cancellation transition.

---

## 8.5 Ownership Checks

A Manager is not trusted based on Role alone.

Queue ownership is also checked.

Likewise, a user cannot cancel another user's Ticket because `owner` is included in the update conditions.

---

## 8.6 Realistic Authentication Flow

The project goes beyond:

```text
register
login
```

and includes:

```text
registration
email verification
OTP
temporary confirmation token
forgot password
password reset
JWT authentication
```

This gives the project more value as a Backend Portfolio Project.

---

## 8.7 Validation Middleware

Validation is separated from Controllers.

Instead of placing many input checks directly inside Controllers, the project uses:

```text
express-validator
+
validationHandler
```

---

## 8.8 Centralized Error Handling

The project includes:

```text
AppError
asyncWrapper
globalErrorHandler
notFoundError
```

This avoids repeating `try/catch` blocks in every Controller.

---

## 8.9 Separation of Responsibilities

The current structure separates:

```text
Routes
Middlewares
Controllers
Services
Models
Config
Utils
Validators
```

This is appropriate for the current stage of the project.

---

# 9. Weaknesses and Limitations

> These points describe the uploaded version of the project, assuming that the `createTicket` issue you fixed after uploading the project is now working correctly. Some of the following points are future engineering improvements rather than problems that necessarily prevent the application from running.

## 9.1 Multi-Document Operations Are Not a Single Transaction

Some operations update more than one Document.

For example, cancellation may involve:

```text
Ticket → canceled
Queue  → currentLength - 1
```

These are separate updates.

If the first succeeds and the second fails, the data can become inconsistent.

A stronger future solution is:

```text
MongoDB Transaction
```

---

## 9.2 Waiting-Ticket Check for a User

The logic that prevents a second Ticket relies on a previous check followed by creation.

With two highly concurrent requests, a Race Condition is still possible.

A stronger solution is to protect the business invariant at the Database level with an appropriate index.

---

## 9.3 `isCheckedBySystem` Is Not a Complete Lock

The field:

```text
isCheckedBySystem
```

is a useful attempt to protect Queue processing from concurrent requests, but it is not a full Transaction or Distributed Lock.

If the process crashes during the operation, the Ticket may require recovery.

Future solutions could include:

- Transaction.
- Lease/lock with expiry.
- Redesigning the Queue-processing operation.

---

## 9.4 Successor Queries Should Explicitly Include the Queue

In some operations that find the next Ticket, relying only on:

```text
prev
```

is less explicit than using:

```text
prev + queue
```

to guarantee that the resulting Ticket belongs to the same Queue.

---

## 9.5 Pagination Validation Is Incomplete

The project uses:

```text
page
limit
```

but all endpoints do not strongly protect against values such as:

```text
page = 0
limit = -100
limit = very large
```

Validators and a maximum limit should be added.

---

## 9.6 ObjectId Validation

Some `queueId` and `ticketId` values coming from users are not explicitly validated before reaching MongoDB.

ObjectId validators should be added.

---

## 9.7 Empty Arrays

Some Services use patterns such as:

```js
if (!tickets)
```

MongoDB returns:

```js
[]
```

when there are no results, and an empty Array is Truthy in JavaScript.

Where needed, use:

```js
if (tickets.length === 0)
```

---

## 9.8 Queue Updates Depend on Truthy Values

Some update logic uses:

```js
if (data[element]) {
    updates[element] = data[element];
}
```

This means valid Falsy values are ignored.

A safer pattern is:

```js
if (data[element] !== undefined) {
    updates[element] = data[element];
}
```

---

## 9.9 Rate Limiting Is Not Full Business Rate Limiting

The current key is based on:

```text
IP + endpoint
```

which is different from a business rule such as:

```text
10 tickets per user per day
```

or:

```text
50 queues per manager per day
```

For true business limits, the authenticated user's identity should be part of the rate-limit key.

---

## 9.10 Some Rate-Limit Configuration Needs Review

The authentication limiters currently use a one-hour window.

The Registration route also uses `loginLimiter` instead of `registerLimiter` in the current code.

This configuration should be cleaned up before considering the Rate Limiting policy fully aligned with the intended rules.

---

## 9.11 OTP Has No Explicit Purpose

The same OTP Model is used in multiple contexts.

A future improvement would be adding:

```text
purpose
```

such as:

```text
account_confirmation
password_reset
```

so each OTP is explicitly associated with the operation for which it was created.

---

## 9.12 Email Transport Is Created Per Message

The email service creates a Nodemailer Transport when sending email.

In a larger system, it is better to create one Transport and reuse it.

---

## 9.13 Database Connection Does Not Fully Gate Startup

The database connection is called before `app.listen`, but `index.js` does not explicitly wait for the Promise before starting the HTTP server.

A stronger production startup sequence would be:

```text
connect database
      ↓
success
      ↓
start HTTP server
```

This prevents the application from accepting requests before the database is ready.

---

## 9.14 No Automated Tests

The project currently relies mainly on manual testing through Postman.

Future improvements should include:

```text
Unit Tests
Integration Tests
Concurrency Tests
```

especially because QueueLess contains real concurrency scenarios.

---

## 9.15 No Frontend

This is not a problem for a Backend Project.

It simply means:

- The final user experience is not implemented.
- Real-time updates are not currently used.
- Socket.IO/WebSocket has not been added yet.

Postman is sufficient for testing the backend itself.

---

## 9.16 Repository Layer Is Not Fully Implemented

The project's conceptual structure allows for a Repository Layer, but the current implementation accesses Mongoose directly from Services.

This is acceptable at the current learning stage.

A future structure could be:

```text
Routes
  ↓
Middlewares
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
Mongoose Models
```

The important point is to avoid turning the Repository into dozens of unnecessary small methods.

---

# 10. Suggested Tests

## Authentication

Test:

- Successful registration.
- Invalid email.
- Weak password.
- Duplicate email.
- Concurrent registration using the same email.
- Correct OTP.
- Incorrect OTP.
- Expired OTP.
- Reused OTP.
- Confirming an account twice.
- Successful login.
- Incorrect password.
- Login with an unconfirmed account.
- Missing JWT.
- Invalid JWT.
- Expired JWT.
- Forgot Password.
- Password-reset OTP confirmation.
- Password reset.
- Expired password-reset Token.

---

## Authorization

Test:

```text
Normal User → Manager endpoint
Normal User → Admin endpoint
Manager → Admin endpoint
Manager A → Queue of Manager B
User A → Ticket of User B
```

Unauthorized operations should fail.

---

## Queue

Test:

- Create Queue.
- Valid Queue capacity.
- Zero capacity.
- Negative capacity.
- Full Queue.
- Closed Queue.
- Update Queue.
- Open Queue.
- Close Queue.
- Activate an empty Queue.
- Activate a Queue twice.
- Manager attempting to access another Manager's Queue.

---

## Ticket

Test:

- First Ticket.
- Second Ticket.
- Third Ticket.
- Correct `prev`.
- Queue capacity.
- Second Ticket for the same user.
- Ticket cancellation.
- Canceling a Ticket twice.
- Canceling another user's Ticket.
- Canceling a Ticket after service has started.
- Multiple consecutive canceled Tickets.
- First Ticket canceled.
- Last Ticket canceled.
- All Tickets canceled.
- Moving to the next Ticket.
- Concurrent Next requests.

---

## Concurrency

One of the most important tests for this project is:

### Concurrent Ticket Creation

Send multiple requests at the same time:

```text
User A → createTicket
User B → createTicket
User C → createTicket
User D → createTicket
```

Then verify:

```text
linked-list integrity
lastTicket
currentLength
capacity
```

---

# 11. Using Postman

The project can be tested almost completely using Postman.

## Suggested Collection Structure

```text
QueueLess
├── Authentication
│   ├── Register
│   ├── Confirm Account
│   ├── Login
│   ├── Forgot Password
│   ├── Confirm OTP
│   └── Change Password
│
├── User
│   ├── Update Account
│   ├── Delete Account
│   ├── Get My Tickets
│   ├── Get Ticket in Queue
│   └── Cancel Ticket
│
├── Manager
│   ├── Create Queue
│   ├── Get Queue Tickets
│   ├── Update Queue
│   ├── Toggle Queue
│   ├── Activate Queue
│   └── Next Ticket
│
└── Admin
    ├── Get Users
    ├── Delete User
    └── Change Role
```

---

# Practical Postman Scenario

## User 1

```text
Register
→ Confirm Account
→ Login
→ Save JWT
```

## Manager

Create an account, then have an Admin change the Role to:

```text
queueManager
```

Then:

```text
Login
→ Create Queue
→ Open Queue
```

## User 1

```text
Login
→ Join Queue
```

## User 2

```text
Register
→ Confirm
→ Login
→ Join Queue
```

The logical sequence should then be:

```text
Ticket 1
prev = null

Ticket 2
prev = Ticket 1
```

## Manager

```text
Activate Queue
```

Then:

```text
Next Ticket
```

and monitor the Ticket states.

---

# 12. Future Improvements

## Real-Time Queue

Add:

```text
Socket.IO
```

to update users immediately when:

- Their turn is approaching.
- Their service starts.
- The Queue advances.
- A Ticket is canceled.
- The Queue closes.

---

## Estimated Waiting Time

Calculate an approximate waiting time based on:

```text
average service duration
+
number of tickets before the user
```

---

## Multiple Service Counters

Instead of one Manager serving one Queue:

```text
Queue
 ├── Counter 1
 ├── Counter 2
 └── Counter 3
```

---

## Priority Queues

Support:

```text
normal
priority
emergency
```

according to clearly defined rules.

---

## Queue Analytics

Add statistics such as:

```text
Average Waiting Time
Average Service Time
Number of Served Tickets
Number of Canceled Tickets
Peak Hours
```

---

## Audit Logs

Record:

```text
Who created the Queue?
Who opened it?
Who closed it?
Who changed Roles?
Who processed Tickets?
```

---

## Notification System

Add email notifications such as:

```text
Your turn is approaching.
Your turn has arrived.
Queue has been closed.
Ticket canceled successfully.
```

---

## Automated Tests

Add:

```text
Jest / Vitest / Mocha
Supertest
MongoDB test environment
```

with Integration Tests and Concurrency Tests.

---

## Repository Layer

After the project is stable:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Model
```

Business Logic should remain inside Services.

---

## MongoDB Transactions

Add Transactions to operations that modify multiple Documents and need to succeed or fail as one unit.

Example:

```text
Cancel Ticket
    ↓
Ticket.status = canceled
    +
Queue.currentLength -= 1
```

---

## Docker

Add:

```text
Dockerfile
docker-compose.yml
MongoDB container
QueueLess container
```

to simplify deployment.

---

## OpenAPI / Swagger

Document the API in a format that can be viewed and executed directly through Swagger UI.

---

# 13. Conclusion

QueueLess is a Backend Project focused on a real problem: digital queue management.

The main value of the project is not the number of endpoints, but the Domain Logic behind them.

The project goes beyond:

```text
CRUD
+
JWT
+
MongoDB
```

into:

```text
Business Rules
+
Ticket Lifecycle
+
Linked List Data Modeling
+
Authorization
+
Ownership
+
OTP Authentication Flows
+
Validation
+
Rate Limiting
+
Atomic MongoDB Operations
+
Concurrency Considerations
```

The strongest technical part is the Ticket sequencing model using `prev`, `lastTicket`, and `currentTurn`, together with the attempt to handle concurrent requests using atomic MongoDB operations.

The project is currently well suited as an advanced training Backend Portfolio Project, especially because its technical value can be demonstrated without a graphical frontend.

A sensible next path is:

```text
Current Project
      ↓
Deploy
      ↓
Fix remaining correctness issues
      ↓
Add automated/integration tests
      ↓
Repository refactor
      ↓
MongoDB Transactions where needed
      ↓
Socket.IO / Real-Time
      ↓
SOLID / Design Patterns / DDD
```

This keeps QueueLess as a project you fully understand while providing a solid foundation for more advanced Backend Architecture topics.

---

## Documentation Status

This document translates the uploaded QueueLess documentation into English while preserving its structure, API examples, terminology, and technical level.

The `createTicket` issue is treated as fixed based on the user's confirmation that it now works correctly.

Any feature that was not actually implemented in the uploaded code is presented as a future improvement rather than as an existing feature.
