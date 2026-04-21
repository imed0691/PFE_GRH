# PFE_GRH - Management System

## Prerequisites
- Node.js installed
- MySQL Server running

## Setup Instructions

### 1. Database Setup
Create a MySQL database and run the following query:
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100),
  prenom VARCHAR(100),
  role VARCHAR(50),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255)
);
```

### 2. Backend Configuration
- Go to `backend/` folder.
- Run `npm install`.
- Create a `.env` file based on `.env.example`.
- Start with `npm start`.

### 3. Frontend Configuration
- Go to `frontend/` folder.
- Run `npm install`.
- Start with `npm run dev`.