# StudentAuthForm Component Documentation

## Overview
The `StudentAuthForm` component provides a unified interface for student authentication, supporting both manual registration/login and Google OAuth integration.

## File Location
`src/components/auth/StudentAuthForm.jsx`

## Dependencies
```json
{
  "@react-oauth/google": "^2.x.x",
  "react-router-dom": "^6.x.x",
  "lucide-react": "^0.x.x"
}
```

## Environment Variables Required
```env
VITE_API_BASE=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

## Component Structure

### State Management
```jsx
const [activeTab, setActiveTab] = useState('signup'); // 'login' or 'signup'
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [formData, setFormData] = useState({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
});
```

### Form Fields

#### Login Form
- **Email**: Required, email validation
- **Password**: Required, toggle visibility

#### Signup Form
- **First Name**: Required, text input
- **Last Name**: Required, text input
- **Email**: Required, email validation
- **Password**: Required, toggle visibility
- **Confirm Password**: Required, must match password

## API Integration

### Backend Endpoints Used
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/googleAuth` - Google OAuth authentication

### Request/Response Format

#### Registration Request
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "student"
}
```

#### Login Request
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "student"
}
```

#### Success Response
```json
{
  "success": true,
  "data": {
    "access_token": "jwt-token-here",
    "refresh_token": "refresh-token-here",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "student",
      "email_verified": false,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

## Authentication Flow

### Manual Registration
1. User fills signup form
2. Form validation (client-side)
3. `handleSignupSubmit()` called
4. `auth.register(payload)` sends POST to `/api/auth/register`
5. `storeSession(res.data)` stores tokens in localStorage
6. Navigate to `/dashboard`

### Manual Login
1. User fills login form
2. `handleLoginSubmit()` called
3. `auth.login(email, password, 'student')` sends POST to `/api/auth/login`
4. `storeSession(res)` stores tokens in localStorage
5. Navigate to `/dashboard`

### Google OAuth
1. User clicks Google login button
2. Google OAuth popup/redirect
3. `onSuccess` callback receives credential
4. `auth.googleAuth(google_token, 'student')` sends POST to `/api/auth/googleAuth`
5. `storeSession(res.data)` stores tokens in localStorage
6. Navigate to `/dashboard`

## Token Storage
Tokens are stored in localStorage:
- `pc_access_token`: JWT access token
- `pc_refresh_token`: Refresh token for token renewal
- `pc_user`: User profile data

## Error Handling
- Network errors: Displayed as alerts
- Validation errors: Handled by backend
- Authentication errors: Shown to user via alert

## Styling
- Uses Tailwind CSS classes
- Dark theme (gray-800 background)
- Responsive design
- Form validation states
- Loading states for buttons

## Usage Example

```jsx
import StudentAuthForm from './components/auth/StudentAuthForm';

function App() {
  return (
    <div>
      <StudentAuthForm />
    </div>
  );
}
```

## Testing Checklist

### Manual Testing
- [ ] Signup form validation works
- [ ] Login form validation works
- [ ] Password visibility toggle works
- [ ] Tab switching works
- [ ] Google OAuth button appears
- [ ] Form submission shows loading state
- [ ] Success redirects to dashboard
- [ ] Error messages display correctly

### Backend Integration Testing
- [ ] Registration creates user in database
- [ ] Login returns valid tokens
- [ ] Google OAuth works (if configured)
- [ ] CORS headers present
- [ ] Error responses handled properly

### Database Verification
```sql
-- Check if user was created
SELECT * FROM users WHERE email = 'test@example.com';

-- Check user sessions
SELECT * FROM sessions WHERE user_id = 1;

-- Check user profile
SELECT u.*, tp.* FROM users u 
LEFT JOIN tutor_profiles tp ON u.id = tp.user_id 
WHERE u.email = 'test@example.com';
```

## Troubleshooting

### Common Issues

1. **CORS Error**
   - Check backend CORS configuration
   - Verify `VITE_API_BASE` matches backend URL

2. **JWT Secret Error**
   - Ensure `.env` file exists in backend/
   - Check `JWT_SECRET` is set and not default

3. **Database Connection Error**
   - Verify Docker container is running
   - Check database credentials in `.env`
   - Ensure schema is loaded

4. **Google OAuth Not Working**
   - Verify `VITE_GOOGLE_CLIENT_ID` is set
   - Check Google OAuth configuration
   - Ensure backend Google auth endpoint exists

### Debug Steps
1. Check browser DevTools → Network tab
2. Verify request URLs and headers
3. Check response status and body
4. Verify tokens in localStorage
5. Check backend logs

## Security Considerations
- Passwords are hashed on backend (Argon2ID)
- JWT tokens have expiration
- CORS is properly configured
- Input validation on both client and server
- HTTPS recommended for production

## Future Enhancements
- Email verification flow
- Password reset functionality
- Remember me option
- Social login providers (Facebook, GitHub)
- Two-factor authentication
- Account lockout after failed attempts