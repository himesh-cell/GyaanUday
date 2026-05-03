<div align="center">
  <h1>🌟 GyaanUday Platform</h1>
  <p>A full-stack, production-ready knowledge-sharing and project showcase platform for students and developers.</p>
  
  [![Frontend](https://img.shields.io/badge/Frontend-Vanilla_JS-f1e05a?style=for-the-badge&logo=javascript)](https://gyaan-uday.vercel.app/)
  [![Backend](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=nodedotjs)](https://gyaanuday-1.onrender.com)
  [![Database](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)](#)
  [![Auth](https://img.shields.io/badge/Auth-Google_OAuth-4285F4?style=for-the-badge&logo=google)](#)
</div>

<br />

## 📖 About The Project

**GyaanUday** is an interactive, highly responsive web application designed to empower students and professionals to share, manage, and discover technical projects. 

Whether you're exploring AI innovations, Web Development architectures, or IoT devices, GyaanUday provides a modern, gamified environment to showcase your work, connect with peers, and climb the platform leaderboard.

### ✨ Key Features

- **🔐 Robust Authentication:** Secure traditional Email/Password login with JWT, plus seamless **Sign in with Google** integration.
- **🎨 Modern UI/UX:** A stunning, glassmorphism-inspired design with buttery smooth micro-animations and a dynamic **Light/Dark Mode** toggle.
- **📁 Project Management:** Upload, edit, and categorize projects by domain (AI, Web Dev, Mobile, Data Science, Cybersecurity).
- **👥 Social & Network System:** Connect with other innovators. Send friend requests, view public profiles, and manage your network directly from the dashboard.
- **🏆 Gamified Leaderboard:** Earn points through upvotes and interactions. Top contributors are featured globally on the platform leaderboard.
- **💬 Community Interaction:** Upvote, downvote, and comment on public projects to foster constructive feedback.
- **🛠️ Admin Dashboard:** Built-in moderation tools to manage users, track site statistics, and oversee content.

---

## 🚀 Tech Stack

### Frontend
- **HTML5 & CSS3:** Semantic structure with modern CSS Variables for highly flexible theming.
- **Vanilla JavaScript:** Fast, lightweight, and framework-free DOM manipulation and state management.
- **Google Identity Services:** Integrated OAuth 2.0 flow for instant Google Sign-in.
- **ScrollReveal.js:** For dynamic on-scroll animations.

### Backend
- **Node.js & Express.js:** Scalable RESTful API architecture.
- **MongoDB & Mongoose:** Flexible NoSQL database for handling complex relational user and project data.
- **JWT (JSON Web Tokens):** Secure, stateless authentication middleware.
- **Nodemailer:** Email integration for password reset workflows.
- **Multer:** Handling multipart/form-data for file and image uploads.

---

## 📂 Project Structure

```text
GyaanUday/
├── backend/
│   ├── controllers/      # Route logic and database interactions
│   ├── middlewares/      # JWT verification, upload handling
│   ├── models/           # Mongoose schemas (User, Project, Comment, etc.)
│   ├── routes/           # Express API route definitions
│   ├── uploads/          # Locally stored user uploads (images, files)
│   ├── server.js         # Entry point for the Node.js application
│   └── .env              # Environment variables (ignored in git)
│
├── frontend/
│   ├── index.html        # Landing page
│   ├── auth.html         # Login / Registration portals
│   ├── explore.html      # Public project feed
│   ├── user-dashboard.html # User profile and management
│   ├── network.html      # Friend requests and connections
│   ├── admin-dashboard.html # Administrative controls
│   ├── style.css         # Global design system & variables
│   └── script.js         # Core frontend logic & API calls
│
├── .gitignore
└── README.md
```

---

## 🔌 API Reference

### Authentication
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate and receive a JWT
- `POST /api/auth/google` - Authenticate using a Google OAuth credential
- `POST /api/auth/forgotpassword` - Request an OTP via email
- `PUT /api/auth/resetpassword` - Reset password using OTP

### Users & Social
- `GET /api/users/me` - Get current authenticated user profile
- `GET /api/users/search?q=` - Search users by name/email
- `POST /api/users/friends/request/:id` - Send a friend request
- `POST /api/users/friends/accept/:id` - Accept a friend request

### Projects
- `GET /api/projects` - Fetch all projects (with pagination & filters)
- `POST /api/projects` - Upload a new project (requires auth)
- `POST /api/projects/:id/upvote` - Upvote a project
- `POST /api/projects/:id/comment` - Add a comment to a project

---

## 💻 Running Locally

To get a local copy up and running, follow these simple steps.

### Prerequisites
- [Node.js](https://nodejs.org/en/) installed on your machine.
- A [MongoDB](https://www.mongodb.com/) instance (local or Atlas).
- A [Google Cloud Console](https://console.cloud.google.com/) project configured for OAuth 2.0.

### 1. Clone the Repository
```bash
git clone https://github.com/himesh-cell/GyaanUday.git
cd GyaanUday
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory with your credentials:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://127.0.0.1:5500
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Because the frontend uses vanilla HTML/JS, you can serve it using any local static file server.
*If using VS Code, we recommend the **Live Server** extension.*

1. Open the `frontend/` folder in your IDE.
2. Start your live server (usually runs on port `5500`).
3. Ensure the `getApiBaseUrl()` function in `frontend/script.js` points to `http://localhost:5000` during local development.

---

## 🌐 Deployment

The platform is designed to be easily deployed on modern cloud infrastructure.

- **Frontend Deployment:** Hosted on **Vercel**. Simply connect your GitHub repository and set the *Root Directory* to `frontend`.
- **Backend Deployment:** Hosted on **Render** (or Railway/Heroku). Deploy the `backend/` directory as a Node Web Service and configure the exact same Environment Variables from your local `.env`.

---

## 🛣️ Roadmap

- [ ] Real-time messaging between friends using `Socket.io`.
- [ ] In-app notification system for likes and comments.
- [ ] Markdown support for project descriptions.
- [ ] AI-powered project recommendation feed.
- [ ] Mobile-native application build using React Native.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
  <p>Built with ❤️ for the Developer Community.</p>
</div>
