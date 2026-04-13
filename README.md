# Chat FE - Frontend Application

A responsive, real-time chat web application frontend built with **Vite + React 18 + Tailwind CSS + JavaScript**. 

This repository contains the user interface and client-side logic for the messaging application, designed to look and feel like modern messaging solutions (e.g., Telegram).

## 🚀 Quick Start & Installation

### Prerequisites

- Node.js >= 16
- npm or yarn

### Setup Instructions

1. **Clone the repository** and navigate to the project directory:
   ```bash
   cd chatFE
   ```

2. **Install the dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file and update if necessary:
   ```bash
   cp .env.example .env.local
   ```
   > Ensure `VITE_API_URL` points to your backend instance (e.g., `http://localhost:3000/v1`).

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

---

## 🎯 Key Features

### 1. **Authentication** ✅
- Registration with phone number, email, and password.
- Login via phone number + password.
- Auto-login via persisted token (localStorage) and session restoration.
- Logout functionality.

### 2. **Friend Management** ✅
- Search for users by phone number.
- Send, accept, decline, or cancel friend requests.
- Manage friends list and mutual connections.
- Unfriend users.

### 3. **UI/UX** ✅
- **3-Column Layout**: Sidebar | Left Panel (Toggles Chat/Contacts) | Right Panel (Messages).
- **Dark Mode**: Integrated toggles for Night Mode.
- **Responsive Design**: Adapts fluently across Mobile, Tablet, and Desktop screens.
- **Real-time Input**: Seamless visual feedback.

### 4. **Chat (Pending / In Progress)** ⏳
- 1-on-1 text messaging and file attachments.
- WebSocket-powered real-time updates and notifications.

---

## 📁 Project Documentation

To keep the README concise, detailed specifications and source guides have been split into standalone documents:

- 📖 **[FE Source Code Guide](./SRC_GUIDE.md)**: Thorough documentation on the project architecture, component structures, API services logic, custom hooks, and context management. 
- 🔗 **[API Specification](./docs/API_SPEC.md)**: Detailed backend endpoint contracts, request/response formats, WebSocket events, and error codes.

---

## 🛠️ Tech Stack

| Technology       | Purpose                      |
| ---------------- | ---------------------------- |
| **Vite**         | Fast build tool & dev server |
| **React 18**     | UI framework with hooks      |
| **React Router** | Client-side routing          |
| **Tailwind CSS** | Utility-first CSS            |
| **JavaScript**   | Pure JS (no TypeScript)      |
| **Socket.IO**    | Real-time WebSockets         |
| **Axios**        | Promise-based HTTP client    |

---

## 💻 Common Tasks

### Adding a New Page & Route
1. Create your component under `src/pages/NewPage.jsx`.
2. Open `src/App.jsx` and add your new `<Route>`. Wrap it inside `<PrivateRoute>` if it requires a logged-in user.
   ```jsx
   <Route path="/new-path" element={<PrivateRoute><NewPage /></PrivateRoute>} />
   ```

### Adding a New API Call
1. Add a service function in the corresponding file under `src/services/` (e.g. `userService.js`).
2. Utilize the pre-configured `api.js` (Axios wrapper) to make requests.
   ```js
   import api from './api';
   // Returns { status, msg, data }
   export const fetchMyData = () => api.get('/my/endpoint');
   ```

### Accessing Authentication State
```jsx
import { useAuth } from "../hooks/useAuth";

export const MyComponent = () => {
  const { user, token, logout } = useAuth();
  return <div>Welcome, {user?.displayName}!</div>;
};
```

---

## 🐛 Troubleshooting

### Token/Auth Issue (401 Unauthorized)
- **Problem**: Requests are being blocked by the server with a 401 error.
- **Solution**: Clear your browser's `localStorage` to wipe the stale token, or check the network tab to ensure your request headers are including `Authorization: Bearer <token>`.

### CORS Error
- **Problem**: Requests are blocked by CORS policy.
- **Solution**: Ensure your backend instance has configured CORS properly to allow traffic from `http://localhost:5173`.

### "User Not Found" during Search
- **Problem**: Search doesn't find the user.
- **Solution**: Ensure your search input exactly matches the format expected by the backend (e.g., standard 10-digit phone numbering `0912345678`).

---

**Made with ❤️ | Happy Coding! 🚀**
