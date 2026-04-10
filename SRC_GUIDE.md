# 📖 FE Source Code Guide - Hướng Dẫn Đọc Mã Nguồn

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
3. [Các Tính Năng Chính](#các-tính-năng-chính)
4. [Luồng Hoạt Động](#luồng-hoạt-động)
5. [Chi Tiết Từng Thư Mục](#chi-tiết-từng-thư-mục)

---

## 🎯 Tổng Quan

Đây là một **ứng dụng web chat** được xây dựng với **React** + **Vite**, có các tính năng chính:

- 🔐 **Xác thực người dùng** (Login, Register, Verify Email)
- 💬 **Gửi tin nhắn** (Chat, Conversations)
- 👥 **Quản lý bạn bè** (Add, Remove, Friend Requests)
- 🔍 **Tìm kiếm bạn bè** (Search by phone)
- 👤 **Quản lý hồ sơ** (Profile, Avatar, Bio)

**Stack Công Nghệ:**

- React 18+ (UI Framework)
- React Router (Routing)
- Axios (HTTP Client)
- Tailwind CSS (Styling)
- Vite (Build Tool)

---

## 📁 Cấu Trúc Thư Mục

```
src/
├── api/                      # HTTP & Axios Configuration
│   └── axios-instance.js    # Axios instance with interceptors
├── components/               # Reusable React Components
│   ├── auth/                # Authentication components
│   ├── chat/                # Chat UI components
│   ├── common/              # Shared components (PrivateRoute, Modal, etc.)
│   ├── contacts/            # Contact list component
│   ├── layout/              # Main layout & navigation
│   └── search/              # Search functionality
├── pages/                    # Page Components (Routes)
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── HomePage.jsx
│   └── ... (other pages)
├── styles/                   # CSS & Tailwind styles
│   └── globals.css
├── constants/                # Application constants
│   └── index.js
├── context/                  # React Context (State Management)
│   ├── AuthContext.jsx      # Authentication state
│   ├── AppContext.jsx       # App-level state
│   └── index.js
├── hooks/                    # Custom React Hooks
│   ├── useAuth.js           # Get auth state
│   ├── useFetch.js          # Data fetching hook
│   └── index.js
├── runtime/                  # Runtime Configuration
│   ├── config.js            # App configuration
│   ├── storage.js           # LocalStorage wrapper
│   └── index.js
├── services/                 # API Services (Business Logic)
│   ├── api.js               # Base API helper
│   ├── authService.js       # Authentication API calls
│   ├── userService.js       # User profile API
│   ├── conversationService.js # Chat/Conversation API
│   ├── friendService.js     # Friend management API
│   ├── mediaService.js      # File/Media upload API
│   └── index.js
├── utils/                    # Helper Functions
│   ├── helpers.js           # Common utilities
│   ├── eventBus.js          # Event management
│   └── index.js
├── App.jsx                   # Root component (Routing)
└── main.jsx                  # Entry point
```

---

## 🎨 Các Tính Năng Chính

### 1️⃣ **Xác Thực (Authentication)**

- **Đăng nhập** bằng số điện thoại + mật khẩu
- **Đăng ký** tài khoản mới
- **Xác minh email** qua OTP
- **Quên mật khẩu** & reset
- **Đăng xuất** (clear session)

### 2️⃣ **Tin Nhắn (Chat)**

- Xem danh sách cuộc trò chuyện
- Gửi/nhận tin nhắn real-time
- Hiển thị tin nhắn đã gửi
- Mock messages để demo

### 3️⃣ **Quản Lý Bạn Bè (Friends)**

- Tìm bạn theo số điện thoại
- Gửi/nhận yêu cầu kết bạn
- Chặn/Xóa bạn
- Xem danh sách bạn

### 4️⃣ **Hồ Sơ Người Dùng (User Profile)**

- Xem thông tin cá nhân
- Cập nhật tên, bio, email
- Thay đổi avatar
- Upload file (image)

---

## 🔄 Luồng Hoạt Động

### Luồng 1: Xác Thực & Khởi Động

```
main.jsx
  ↓
configureRuntime() → Khai báo API URL
  ↓
<AuthProvider> → Khôi phục session & user từ localStorage
  ↓
<App /> → Render routing
  ↓
PrivateRoute → Kiểm tra token, redirect nếu chưa auth
```

**Chi tiết:**

1. `main.jsx` khởi tạo runtime config
2. `AuthProvider` (từ context) tải user từ localStorage
3. App render các routes
4. PrivateRoute bảo vệ các trang tính năng

---

### Luồng 2: Đăng Nhập

```
LoginPage
  ↓
LoginForm.jsx
  ↓
authService.login() → Gọi API /auth/login
  ↓
setAuthTokens() → Lưu vào localStorage (axios-instance.js)
  ↓
AuthContext.updateUser() → Update state
  ↓
Redirect → HomePage
```

**Các file liên quan:**

- `pages/LoginPage.jsx` - Trang đăng nhập
- `components/auth/LoginForm.jsx` - Form input
- `services/authService.js` - Gọi API login
- `context/AuthContext.jsx` - Lưu state user

---

### Luồng 3: Tìm Kiếm & Kết Bạn

```
SearchFriendsPage
  ↓
SearchFriendForm.jsx → Input số điện thoại
  ↓
friendService.searchUserByPhone(phone) → Gọi API
  ↓
UserSearchCard.jsx → Hiển thị user
  ↓
sendFriendRequest() → Gửi yêu cầu kết bạn
  ↓
Update UI → "Request sent"
```

**Các file liên quan:**

- `pages/SearchFriendsPage.jsx` - Trang tìm kiếm
- `components/search/` - Search components
- `services/friendService.js` - API friend
- `components/layout/MainLayout.jsx` - Layout chính

---

### Luồng 4: Gửi Tin Nhắn

```
HomePage → MainLayout.jsx
  ↓
ChatList → Chọn conversation
  ↓
ActiveChatPane.jsx
  ↓
(Gửi tin) → conversationService.sendMessage()
  ↓
Lưu vào state messages[]
  ↓
Re-render chat UI
```

**Các file liên quan:**

- `components/layout/MainLayout.jsx` - Logic chính
- `components/chat/ActiveChatPane.jsx` - Chat UI
- `services/conversationService.js` - API tin nhắn

---

## 📂 Chi Tiết Từng Thư Mục

### **1. `api/`**

#### `axios-instance.js` ⭐

**Tác dụng:** Tạo Axios instance với interceptors

**Tính năng:**

- ✅ Tự động thêm Bearer token vào headers
- ✅ Refresh token khi hết hạn (401)
- ✅ Xử lý queue request khi refresh
- ✅ Xóa session nếu token không hợp lệ

**Hàm chính:**

```javascript
setAuthTokens({ accessToken, refreshToken }); // Lưu token
clearAuthTokens(); // Xóa token
axiosInstance.interceptors.request.use(); // Add token to request
axiosInstance.interceptors.response.use(); // Handle 401
```

**Được dùng bởi:** `services/` (tất cả API calls)

---

### **2. `components/`**

#### `auth/`

- **LoginForm.jsx** - Form đăng nhập (email, password)
- **RegisterForm.jsx** - Form đăng ký (phone, password, confirm)
- **EmailVerificationForm.jsx** - OTP verification
- **ForgotPasswordForm.jsx** - Reset password form

#### `chat/`

- **ChatList.jsx** - Danh sách conversations
- **ActiveChatPane.jsx** - Panel tin nhắn (gửi/nhận)

#### `common/` ⭐

- **PrivateRoute.jsx** - Bảo vệ routes (yêu cầu login)
- **UserProfileModal.jsx** - Modal xem/sửa hồ sơ
- **AvatarEditor.jsx** - Upload & crop avatar

#### `contacts/`

- **Contacts.jsx** - Danh sách bạn bè (add, remove)

#### `layout/` ⭐ (Quan trọng)

- **MainLayout.jsx** - Layout chính (sidebar + chat)
- **Header.jsx** - Thanh header với user info
- **Sidebar.jsx** - Menu bên trái (Home, Friends, etc.)
- **MainTaskbar.jsx** - Custom taskbar (nếu cần)
- **ProfileMenu.jsx** - Dropdown menu user
- **QuickActionFab.jsx** - Floating action button
- **ResizableChatPanel.jsx** - Panel có thể resize

#### `search/`

- **SearchFriendForm.jsx** - Input search phone
- **UserSearchCard.jsx** - Card user từ kết quả tìm kiếm

---

### **3. `pages/`**

Các page tương ứng với routes trong `App.jsx`:

| File                   | Route            | Mô tả              |
| ---------------------- | ---------------- | ------------------ |
| LoginPage.jsx          | /login           | Trang đăng nhập    |
| RegisterPage.jsx       | /register        | Trang đăng ký      |
| VerifyEmailPage.jsx    | /verify-email    | Xác minh email     |
| ForgotPasswordPage.jsx | /forgot-password | Quên mật khẩu      |
| HomePage.jsx           | /                | Trang chính (Chat) |
| SearchFriendsPage.jsx  | /search-friends  | Tìm kiếm bạn       |
| FriendsPage.jsx        | /friends         | Danh sách bạn      |
| FriendRequestsPage.jsx | /friend-requests | Yêu cầu kết bạn    |
| TermsPage.jsx          | /terms           | Điều khoản dịch vụ |

---

### **4. `styles/`**

#### `globals.css`

**Tác dụng:** CSS global & Tailwind config

- Reset CSS browser
- Theme colors
- Font setup

---

### **5. `constants/`**

#### `index.js`

**Tác dụng:** Lưu các hằng số ứng dụng

**Ví dụ:**

```javascript
export const API_BASE_URL = "http://localhost:3000/v1"
export const APP_NAME = "ChatChit"
export const CACHE_KEYS = { ... }
```

---

### **6. `context/`** ⭐ (State Management)

#### `AuthContext.jsx`

**Tác dụng:** Quản lý trạng thái xác thực toàn ứng dụng

**State:**

- `user` - Thông tin user hiện tại
- `token` - JWT token
- `loading` - Đang load hay không
- `error` - Lỗi xác thực

**Hàm:**

- `login(phone, password)` - Đăng nhập
- `register(data)` - Đăng ký
- `logout()` - Đăng xuất
- `verifyEmail(otp)` - Verify OTP
- `updateProfile(data)` - Cập nhật hồ sơ

**Khôi phục session:**

```javascript
useEffect(() => {
  // Tự động tải user từ localStorage lúc mount
  authService.getProfile() → setUser()
})
```

#### `AppContext.jsx`

**Tác dụng:** Quản lý state ứng dụng (nếu cần)

**Sử dụng:** Có thể lưu global state (theme, language, etc.)

---

### **7. `hooks/`** ⭐ (Custom Hooks)

#### `useAuth.js`

**Tác dụng:** Hook để lấy auth state

```javascript
const { user, token, login, logout } = useAuth();
```

**Các hàm trả về:**

- `user` - Thông tin user
- `token` - JWT token
- `login(phone, password)` - Đăng nhập
- `register(data)` - Đăng ký
- `logout()` - Đăng xuất
- `updateProfile(data)` - Cập nhật profile
- `verifyEmail(otp)` - Verify email

---

#### `useFetch.js`

**Tác dụng:** Hook để fetch dữ liệu

```javascript
const { data, loading, error } = useFetch(url, options);
```

**Tính năng:**

- Tự động fetch khi mount
- Xử lý loading state
- Xử lý error
- Refetch function

---

### **8. `runtime/`** ⭐ (Configuration)

#### `config.js`

**Tác dụng:** Khai báo cấu hình ứng dụng

```javascript
export let appConfig = {
  apiUrl: "http://localhost:3000/v1",
};

export function configureRuntime(config) {
  appConfig = { ...appConfig, ...config };
}
```

**Được gọi trong:** `main.jsx`

#### `storage.js`

**Tác dụng:** Wrapper cho localStorage

**Hàm:**

```javascript
authStorage.getItem(key); // Lấy giá trị
authStorage.setItem(key, val); // Lưu giá trị
authStorage.removeItem(key); // Xóa giá trị
```

**Dữ liệu được lưu:**

- `token` - Access token
- `refreshToken` - Refresh token
- `user` - User info (JSON)

---

### **9. `services/` ⭐ (API & Business Logic)**

#### `api.js`

**Tác dụng:** Helper function chung cho API

```javascript
const apiCall = async (method, url, data) => {
  return axiosInstance[method](url, data);
};
```

#### `authService.js`

**Tác dụng:** API xác thực

**Hàm:**

```javascript
login(phone, password); // POST /auth/login
register(phone, password, email); // POST /auth/register
verifyEmail(otp); // POST /auth/verify-email
forgotPassword(email); // POST /auth/forgot-password
resetPassword(token, password); // POST /auth/reset-password
getProfile(); // GET /user/profile
logout(); // POST /auth/logout
```

#### `userService.js`

**Tác dụng:** API quản lý hồ sơ

**Hàm:**

```javascript
getProfile(); // GET /user/profile
updateProfile(data); // PUT /user/profile
updateAvatarViaAuth(file); // Upload avatar
```

#### `conversationService.js`

**Tác dụng:** API tin nhắn

**Hàm:**

```javascript
getConversations(); // GET danh sách chat
getMessages(conversationId); // GET tin nhắn
sendMessage(conversationId, msg); // POST gửi tin
```

#### `friendService.js`

**Tác dụng:** API quản lý bạn bè

**Hàm:**

```javascript
searchUserByPhone(phone); // Tìm user
sendFriendRequest(userId); // Gửi yêu cầu
acceptFriendRequest(requestId); // Chấp nhận
rejectFriendRequest(requestId); // Từ chối
removeFriend(friendId); // Xóa bạn
getFriends(); // Lấy danh sách bạn
getPendingRequests(); // Yêu cầu chưa xử lý
```

#### `mediaService.js`

**Tác dụng:** API upload file

**Hàm:**

```javascript
uploadMedia(file); // Upload file
uploadAvatar(file); // Upload avatar
getMediaUrl(mediaId); // Lấy URL file
```

---

### **10. `utils/`** ⭐ (Helper Functions)

#### `helpers.js`

**Tác dụng:** Các hàm tiện ích

**Ví dụ:**

```javascript
formatDate(date); // Format ngày tháng
formatPhone(phone); // Format số điện thoại
validateEmail(email); // Kiểm tra email
truncateString(str, len); // Cắt chuỗi
getInitials(name); // Lấy ký tự đầu tên
```

#### `eventBus.js`

**Tác dụng:** Quản lý event toàn ứng dụng

**Ví dụ:**

```javascript
eventBus.emit("auth:logout"); // Phát sự kiện logout
eventBus.on("auth:logout", callback); // Lắng nghe logout
```

---

### **11. `App.jsx`** ⭐ (Root Component)

**Tác dụng:** Định nghĩa tất cả routes

```javascript
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  // Protected routes
  <Route
    path="/"
    element={
      <PrivateRoute>
        <HomePage />
      </PrivateRoute>
    }
  />
  <Route path="/search-friends" element={<PrivateRoute>...</PrivateRoute>} />
  // ...
</Routes>
```

**Routes:**
| Path | Component | Auth Required |
|------|-----------|---|
| /login | LoginPage | ❌ No |
| /register | RegisterPage | ❌ No |
| /verify-email | VerifyEmailPage | ❌ No |
| /forgot-password | ForgotPasswordPage | ❌ No |
| /terms | TermsPage | ❌ No |
| / | HomePage | ✅ Yes |
| /search-friends | SearchFriendsPage | ✅ Yes |
| /friends | FriendsPage | ✅ Yes |
| /friend-requests | FriendRequestsPage | ✅ Yes |

---

### **12. `main.jsx`** (Entry Point)

**Tác dụng:** Khởi động ứng dụng

```javascript
1. configureRuntime() → Setup API URL
2. <BrowserRouter> → Enable routing
3. <AuthProvider> → Restore session
4. <App /> → Render routes
```

---

## 🔑 Các Khái Niệm Quan Trọng

### **React Context API**

```javascript
// Sử dụng auth state trong component
const { user, login, logout } = useAuth()

// Context tự động restore user từ localStorage
<AuthProvider>
  <App />
</AuthProvider>
```

### **Protected Routes**

```javascript
<PrivateRoute>
  <HomePage /> // Chỉ access nếu đã login
</PrivateRoute>
```

### **Token Refresh**

```javascript
// Axios tự động:
// 1. Thêm token vào header
// 2. Nếu token hết hạn (401), gọi refresh
// 3. Retry request ban đầu
```

### **API Service Pattern**

```javascript
// Mỗi service là module độc lập
// authService.js → API auth
// friendService.js → API bạn bè
// Dễ maintain & test
```

---

## 📝 Worflow Phát Triển Tính Năng

Khi thêm feature mới:

1. **Tạo API service** → `services/newService.js`

   ```javascript
   export const newApi = async (params) => {
     return axiosInstance.post("/endpoint", params);
   };
   ```

2. **Tạo Page/Component** → `pages/NewPage.jsx` hoặc `components/NewComponent.jsx`

   ```javascript
   import { newApi } from "../services";

   export const NewComponent = () => {
     const [data, setData] = useState(null);
     useEffect(() => {
       newApi().then(setData);
     }, []);
     return <div>{/* UI */}</div>;
   };
   ```

3. **Thêm Route** (nếu là page) → `App.jsx`

   ```javascript
   <Route
     path="/new-feature"
     element={
       <PrivateRoute>
         <NewPage />
       </PrivateRoute>
     }
   />
   ```

4. **Cập nhật Context nếu cần** → `context/AppContext.jsx`

---

## 🐛 Debugging Tips

1. **Redux DevTools** - Xem state flow
2. **Network Tab** - Kiểm tra API calls
3. **Console** - Xem errors & logs
4. **React DevTools** - Inspect components
5. **localStorage** - Kiểm tra token/user

---

## 📚 Tài Liệu Tham Khảo

- [React Docs](https://react.dev)
- [React Router](https://reactrouter.com)
- [Axios](https://axios-http.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)

---

**Cập nhật lần cuối:** 10/04/2026  
**Version:** 1.0.0
