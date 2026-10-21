# Job Application Tracker

A full-stack web application that helps users organize and monitor their job applications in one place.

## Features

- User registration and login
- Secure password hashing with bcryptjs
- JWT-based authentication
- Add, edit, and delete job applications
- Track application status: Applied, Interview, Offer, or Rejected
- Search and filter applications
- Dashboard statistics
- User-specific application data
- Responsive interface

## Technologies Used

**Frontend:** HTML, CSS, JavaScript

**Backend:** Node.js, Express.js

**Database:** MongoDB Atlas, Mongoose

**Authentication:** JSON Web Tokens (JWT), bcryptjs

**Deployment:** Render

## Project Structure

```text
job-tracker-new/
├── backend/
│   ├── models/
│   ├── middleware/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
```

## Getting Started

1. Clone the repository.
2. Open the `backend` directory.
3. Run `npm install`.
4. Create a `.env` file with `MONGODB_URI`, `JWT_SECRET`, and `PORT=3000`.
5. Run `node server.js`.
6. Visit `http://localhost:3000`.

Never commit your `.env` file or API credentials.

## GitHub Repository

https://github.com/2728-ane/job-application-tracker

## Developer

**Ane Tabitha Wesonga**

GitHub: https://github.com/2728-ane

Portfolio: https://2728-ane.github.io/my-portfolio/

LinkedIn: https://www.linkedin.com/in/ane-tabitha-651003442/
