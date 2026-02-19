# KneeKlinic Mobile App (Patient)

A professional React Native mobile application for knee osteoarthritis patients, built with Expo. This app connects to the same backend as the web application and provides full patient functionality.

## 🎯 Features

### ✅ Implemented Core Features

1. **Authentication**
   - Email/Password login
   - Patient signup with OTP verification
   - Secure token storage
   - Auto-login on app restart

2. **AI X-Ray Analysis**
   - Upload knee X-ray images (camera or gallery)
   - AI-powered KL grade detection
   - Risk score calculation
   - Personalized recommendations
   - Analysis history with visualizations

3. **Appointments**
   - View all appointments
   - Book new appointments with doctors
   - Choose in-person or virtual visits
   - Reschedule or cancel appointments
   - Available time slots for each doctor

4. **Messaging**
   - Direct messaging with doctors
   - Conversation list with unread counts
   - Real-time message updates
   - Share AI analysis results

5. **Community Forum**
   - View community posts
   - Create new posts
   - Reply to posts
   - Like posts and replies
   - Delete your own content

6. **Profile Management**
   - View and edit profile
   - Upload profile picture
   - Change password
   - View account information

7. **Progress Tracking**
   - Visual charts of KL grade progression
   - Timeline of AI analyses
   - Risk score trends
   - Treatment effectiveness monitoring

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac only) or Android Emulator
- Physical device with Expo Go app (optional)

### Installation

1. **Navigate to the mobile app directory**:
   ```bash
   cd mobile-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API endpoint**:
   
   Edit `src/config/constants.ts` and update the API_BASE_URL:
   ```typescript
   export const API_BASE_URL = __DEV__
     ? 'http://YOUR_LOCAL_IP:5000' // Use your computer's local IP (not localhost)
     : 'https://your-production-api.com';
   ```

   **Finding your local IP**:
   - **Windows**: Run `ipconfig` in CMD, look for IPv4 Address
   - **Mac/Linux**: Run `ifconfig` or `ip addr show`
   - **Example**: `http://192.168.1.100:5000`

   **For Android Emulator**: Use `http://10.0.2.2:5000`

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Run on your device**:
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal
   - **Physical Device**: Scan the QR code with Expo Go app

## 📱 App Structure

```
mobile-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx       # Custom button with gradient
│   │   ├── Input.tsx        # Input field with icons
│   │   ├── Card.tsx         # Card container
│   │   └── Loading.tsx      # Loading indicator
│   │
│   ├── screens/             # Screen components
│   │   ├── auth/            # Authentication screens
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   └── OTPScreen.tsx
│   │   │
│   │   ├── main/            # Main tab screens
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── XRayScreen.tsx
│   │   │   ├── AppointmentsScreen.tsx
│   │   │   ├── CommunityScreen.tsx
│   │   │   ├── MessagesScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   │
│   │   └── details/         # Detail/modal screens
│   │       ├── AnalysisDetailScreen.tsx
│   │       ├── BookAppointmentScreen.tsx
│   │       ├── ConversationScreen.tsx
│   │       ├── PostDetailScreen.tsx
│   │       └── ProgressScreen.tsx
│   │
│   ├── services/            # API services
│   │   ├── api.ts           # Axios instance with interceptors
│   │   ├── authService.ts   # Authentication API calls
│   │   ├── xrayService.ts   # X-ray analysis API
│   │   ├── appointmentService.ts
│   │   ├── messageService.ts
│   │   └── communityService.ts
│   │
│   ├── context/             # React Context
│   │   └── AuthContext.tsx  # Authentication state management
│   │
│   ├── navigation/          # Navigation setup
│   │   └── AppNavigator.tsx # Stack & Tab navigators
│   │
│   └── config/              # Configuration
│       └── constants.ts     # Colors, API URL, app config
│
├── App.tsx                  # Root component
├── app.json                 # Expo configuration
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript config
```

## 🎨 Design System

### Colors
- **Primary**: `#3B82F6` (Blue)
- **Secondary**: `#8B5CF6` (Purple)
- **Success**: `#10B981` (Green)
- **Error**: `#EF4444` (Red)
- **Background**: `#0F172A` (Dark Slate)
- **Surface**: `#1E293B` (Lighter Slate)

### Typography
- **Titles**: 24-32px, Bold (700)
- **Headings**: 18-20px, Semi-Bold (600)
- **Body**: 14-16px, Regular (400)
- **Captions**: 12px, Regular (400)

## 🔧 Configuration

### Environment Variables

The app uses `src/config/constants.ts` for configuration:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://YOUR_IP:5000'           // Development
  : 'https://your-api.com';          // Production

export const APP_CONFIG = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,  // 10MB
};
```

### Backend Connection

Make sure your backend server is running:
```bash
cd .. # Go back to root directory
npm run dev # Start the backend server
```

The mobile app will connect to the same MongoDB database and use the same API endpoints.

## 📦 Key Dependencies

- **expo**: ^52.0.0 - React Native framework
- **@react-navigation**: ^7.0.11 - Navigation
- **axios**: ^1.7.9 - HTTP client
- **@react-native-async-storage/async-storage**: ^2.1.0 - Local storage
- **expo-image-picker**: ^16.0.5 - Camera & gallery access
- **expo-linear-gradient**: ^14.0.1 - Gradient backgrounds
- **react-hook-form**: ^7.55.0 - Form validation
- **zod**: ^3.24.2 - Schema validation
- **react-native-chart-kit**: ^6.12.0 - Progress charts

## 🔐 Security

- **Token Storage**: Uses secure AsyncStorage for JWT tokens
- **Auto Logout**: Automatically logs out on 401 responses
- **Password Security**: Masked password inputs
- **Image Validation**: File type and size validation before upload

## 🎯 API Endpoints Used

All endpoints connect to the existing backend:

### Authentication
- `POST /api/auth/signup` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP & create account
- `POST /api/auth/login` - Login
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### X-Ray Analysis
- `POST /api/ai/analyze-xray` - Upload & analyze
- `GET /api/ai/analyses` - Get all analyses
- `GET /api/ai/analyses/:id` - Get single analysis

### Appointments
- `GET /api/appointments/my-appointments` - List appointments
- `POST /api/appointments/book` - Book appointment
- `PUT /api/appointments/:id/reschedule` - Reschedule
- `DELETE /api/appointments/:id` - Cancel
- `GET /api/doctors/list` - Get doctors
- `GET /api/doctors/:id/available-slots` - Get time slots

### Messages
- `GET /api/messages/conversations` - List conversations
- `GET /api/messages/conversation/:userId` - Get messages
- `POST /api/messages/send` - Send message

### Community
- `GET /api/community/posts` - List posts
- `POST /api/community/posts` - Create post
- `GET /api/community/posts/:id/replies` - Get replies
- `POST /api/community/posts/:id/replies` - Create reply
- `POST /api/community/posts/:id/like` - Like post

## 🐛 Troubleshooting

### Cannot connect to backend

1. **Check your IP address**: Make sure you're using your computer's local IP, not `localhost`
2. **Check firewall**: Allow port 5000 in your firewall
3. **Same network**: Ensure your phone and computer are on the same WiFi network
4. **Backend running**: Verify the backend server is running on `http://localhost:5000`

### Camera not working

1. **Permissions**: Grant camera permissions in device settings
2. **iOS**: Add camera permission to `app.json`
3. **Android**: Permissions are already configured in `app.json`

### Build errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

## 📱 Testing

### Test User Accounts

Create a test patient account:
1. Open the app
2. Tap "Sign Up"
3. Enter your email (use a real email to receive OTP)
4. Complete the OTP verification
5. Start using the app!

### Test Features

1. **AI Analysis**: Upload a knee X-ray image (test images available in `attached_assets/`)
2. **Appointments**: Book an appointment with a doctor
3. **Community**: Create a post and interact with others
4. **Messages**: Send a message to a doctor

## 🚢 Building for Production

### iOS

```bash
expo build:ios
```

### Android

```bash
expo build:android
```

### App Store Submission

1. Update `app.json` with your app details
2. Create app icons and splash screen
3. Follow Expo's guide: https://docs.expo.dev/distribution/app-stores/

## 📝 Development Notes

### Adding New Screens

1. Create screen component in `src/screens/`
2. Add route to `AppNavigator.tsx`
3. Update param lists for TypeScript

### Adding New API Calls

1. Create service in `src/services/`
2. Add TypeScript interfaces
3. Use `apiClient` for authenticated requests

### Styling Guidelines

- Use constants from `src/config/constants.ts`
- Follow existing component patterns
- Use LinearGradient for primary buttons
- Maintain consistent spacing (8px grid)

## 🤝 Contributing

This mobile app is part of the KneeKlinic project. It shares the same backend, database, and API with the web application.

## 📄 License

MIT License - Same as the main KneeKlinic project

---

**Built with ❤️ for knee osteoarthritis patients**
