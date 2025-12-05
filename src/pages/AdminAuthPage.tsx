import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  linkWithCredential,
  sendEmailVerification
} from 'firebase/auth';
import { auth, db } from '../firebase.config';
import { doc, getDoc } from 'firebase/firestore';

type AuthMode = 'welcome' | 'login' | 'signup' | 'link-account' | 'verify-email';

// Email validation helper
const isValidEmail = (email: string): boolean => {
  // RFC 5322 simplified regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Block common dummy/test emails
  const dummyPatterns = [
    /^test@/i,
    /^demo@/i,
    /^fake@/i,
    /^dummy@/i,
    /^sample@/i,
    /example\.com$/i,
    /test\.com$/i,
    /localhost/i,
    /^\d+@/i, // Just numbers
  ];
  
  return !dummyPatterns.some(pattern => pattern.test(email));
};

export function AdminAuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Account linking state
  const [pendingCredential, setPendingCredential] = useState<any>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  
  // Email verification state
  const [verificationEmail, setVerificationEmail] = useState<string>('');

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const googleEmail = userCredential.user.email || '';
      
      console.log('✅ Google auth successful:', userCredential.user.uid, 'Email:', googleEmail);
      
      // Now route the user based on their status
      await routeUserAfterAuth(userCredential.user.uid);
      
    } catch (err: any) {
      console.error('❌ Google auth error:', err.code, err.message);
      
      // If account exists with different credential, offer account linking
      if (err.code === 'auth/account-exists-with-different-credential') {
        const pendingEmail = err.customData?.email;
        setPendingEmail(pendingEmail || '');
        setPendingCredential(err.credential);
        setMode('link-account');
        setError('');
        console.log('Account linking opportunity detected for:', pendingEmail);
      } else {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle account linking - connect Google to existing email/password account
  const handleLinkAccountViaEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    try {
      setLoading(true);
      
      // Sign in with email/password first
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      
      console.log('✅ Email/password login successful:', currentUser.uid);
      console.log('Now linking Google account to:', currentUser.email);
      
      // Now link the pending Google credential to this user
      if (pendingCredential) {
        await linkWithCredential(currentUser, pendingCredential);
        console.log('✅ Google account successfully linked to email/password account!');
        
        // Clear linking state
        setPendingCredential(null);
        setPendingEmail('');
        
        // Reset form
        setEmail('');
        setPassword('');
        
        // Route the user
        await routeUserAfterAuth(currentUser.uid);
      }
    } catch (err: any) {
      console.error('❌ Account linking error:', err.code, err.message);
      setError(err.message || 'Failed to link accounts');
    } finally {
      setLoading(false);
    }
  };

  // Handle account linking - create new account and link Google
  const handleLinkAccountViaSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      setError('❌ Please enter a valid email address. Test/dummy emails are not allowed.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      
      // Create new account with email/password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      
      console.log('✅ New account created:', currentUser.uid);
      console.log('Now linking Google account to new account');
      
      // Link the pending Google credential
      if (pendingCredential) {
        await linkWithCredential(currentUser, pendingCredential);
        console.log('✅ Google account successfully linked to new email/password account!');
        
        // Clear linking state
        setPendingCredential(null);
        setPendingEmail('');
        
        // Reset form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // Navigate to restaurant registration
        navigate('/admin/register-restaurant', {
          state: { userId: currentUser.uid, email: currentUser.email },
        });
      }
    } catch (err: any) {
      console.error('❌ Account creation/linking error:', err.code, err.message);
      setError(err.message || 'Failed to create and link accounts');
    } finally {
      setLoading(false);
    }
  };

  // Handle canceling account linking
  const handleCancelLinking = () => {
    setPendingCredential(null);
    setPendingEmail('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setMode('welcome');
  };

  // Handle checking email verification
  const handleCheckEmailVerification = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Reload user to get latest verification status
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('❌ Session expired. Please go back and sign up again.');
        return;
      }
      
      // Reload user data to get latest emailVerified status
      await currentUser.reload();
      
      if (currentUser.emailVerified) {
        console.log('✅ Email verified! Proceeding to restaurant registration...');
        // Email is verified, proceed to restaurant registration
        navigate('/admin/register-restaurant', {
          state: { userId: currentUser.uid, email: currentUser.email },
        });
      } else {
        setError('⏳ Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err: any) {
      console.error('Verification check error:', err);
      setError('❌ Error checking verification status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resending verification email
  const handleResendVerificationEmail = async () => {
    try {
      setLoading(true);
      setError('');
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('❌ Session expired. Please go back and sign up again.');
        return;
      }
      
      await sendEmailVerification(currentUser);
      setError(''); // Clear any previous errors
      console.log('✅ Verification email resent to:', currentUser.email);
      // Show success message (we'll use error state temporarily for feedback)
      setError('📧 Verification email resent! Check your inbox.'); // This will be shown as info, not error
    } catch (err: any) {
      console.error('Resend error:', err);
      setError('❌ Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to route user after successful authentication
  const routeUserAfterAuth = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role || 'restaurant-owner';
        
        // If master admin, go to master dashboard
        if (role === 'master-admin') {
          navigate('/admin/master-dashboard');
          return;
        }
        
        // If restaurant owner
        if (userData.restaurantCode) {
          // Check approval status
          const approvalStatus = userData.approvalStatus || 'approved';
          
          if (approvalStatus === 'pending') {
            // Show pending approval page
            navigate('/admin/pending-approval', {
              state: { restaurantCode: userData.restaurantCode, userId: uid },
            });
            return;
          }
          
          if (approvalStatus === 'rejected') {
            setError('Your registration was rejected. Please contact support.');
            return;
          }
          
          // If approved, go to regular dashboard
          navigate('/admin/dashboard');
          return;
        }
      }
      
      // User doesn't have a restaurant, go to registration
      const user = auth.currentUser;
      navigate('/admin/register-restaurant', {
        state: { userId: uid, email: user?.email },
      });
    } catch (err) {
      console.error('Error routing user:', err);
      setError('Error loading user profile. Please try again.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    // Validate email format and prevent dummy emails
    if (!isValidEmail(email)) {
      setError('❌ Please enter a valid email address (e.g., your.email@company.com). Test/dummy emails are not allowed.');
      return;
    }

    if (password.length < 6) {
      setError('🔐 Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('❌ Passwords do not match. Please try again.');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ SignUp successful:', userCredential.user.uid);
      
      // Send verification email
      console.log('📧 Sending verification email to:', email);
      await sendEmailVerification(userCredential.user);
      console.log('✅ Verification email sent!');
      
      // Store verification info and go to verification screen
      setVerificationEmail(email);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setMode('verify-email');
    } catch (err: any) {
      console.error('Signup error:', err.code, err.message);
      
      // Provide helpful error messages
      if (err.code === 'auth/email-already-in-use') {
        setError(
          '📧 This email is already registered!\n\n' +
          'Please go back and click "Login" to sign in, or use "Continue with Google".'
        );
      } else if (err.code === 'auth/invalid-email') {
        setError('❌ Please enter a valid email address');
      } else if (err.code === 'auth/weak-password') {
        setError('🔐 Password is too weak. Use at least 6 characters with a mix of letters and numbers.');
      } else {
        setError(err.message || 'SignUp failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      setError('❌ Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful:', userCredential.user.uid);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        console.log('⚠️ Email not verified yet');
        // Store email for verification and show verification screen
        setVerificationEmail(userCredential.user.email || email);
        setEmail('');
        setPassword('');
        setMode('verify-email');
        setError('📧 Please verify your email first. We\'ve sent a verification link to your inbox.');
        return;
      }
      
      // Route user using the same function
      await routeUserAfterAuth(userCredential.user.uid);
    } catch (err: any) {
      console.error('Login error:', err.code, err.message);
      
      // Provide helpful error messages based on specific error codes
      if (err.code === 'auth/user-not-found') {
        setError('📧 No account found with this email.\n\nPlease sign up first or use "Continue with Google".');
      } else if (err.code === 'auth/invalid-credential') {
        setError('❌ Email or password is incorrect.\n\nIf you signed up with Google, please use "Continue with Google" instead.');
      } else if (err.code === 'auth/wrong-password') {
        setError('🔐 Password is incorrect. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('⏱️ Too many failed login attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Welcome Screen */}
        {mode === 'welcome' && (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <h1 className="text-4xl font-bold text-orange-700 mb-2">🍽️ Menu Cards</h1>
            <p className="text-gray-600 mb-8">Admin Portal</p>

            <div className="space-y-4">
              <button
                onClick={() => setMode('login')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🔓 Login
              </button>
              <button
                onClick={() => setMode('signup')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                📝 Sign Up
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </div>

            <p className="text-gray-500 text-sm mt-6">
              New to Menu Cards? Create an account to manage your restaurant menu.
            </p>
          </div>
        )}

        {/* Login Screen */}
        {mode === 'login' && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🔓 Login</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 whitespace-pre-line text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                {loading ? '⏳ Logging in...' : '🔓 Login'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                💡 <strong>Tip:</strong> You can use either email/password or Google sign-in with the same Gmail account. They work interchangeably!
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </form>

            <button
              onClick={() => setMode('welcome')}
              className="w-full mt-4 text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              ← Back
            </button>
          </div>
        )}

        {/* SignUp Screen */}
        {mode === 'signup' && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📝 Sign Up</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 whitespace-pre-line text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                {loading ? '⏳ Creating account...' : '📝 Sign Up'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                💡 <strong>Tip:</strong> You can use either email/password or Google sign-in with the same Gmail account. They work interchangeably!
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </form>

            <button
              onClick={() => setMode('welcome')}
              className="w-full mt-4 text-green-600 hover:text-green-700 font-medium text-sm"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Account Linking Screen */}
        {mode === 'link-account' && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🔗 Link Accounts</h2>
            <p className="text-gray-600 text-sm mb-6">
              An account already exists with {pendingEmail}. You can:
            </p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 whitespace-pre-line text-sm">
                {error}
              </div>
            )}

            {/* Option 1: Sign in with existing email/password */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Option 1: Link to Existing Account</h3>
              <p className="text-sm text-gray-600 mb-4">
                Sign in with your existing email and password to link your Google account
              </p>

              <form onSubmit={handleLinkAccountViaEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={pendingEmail}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  {loading ? '⏳ Linking...' : '🔗 Link Existing Account'}
                </button>
              </form>
            </div>

            {/* Option 2: Create new account and link */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Option 2: Create New Account</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create a new account with email and password, then link your Google account
              </p>

              <form onSubmit={handleLinkAccountViaSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  {loading ? '⏳ Creating & Linking...' : '📝 Create & Link Account'}
                </button>
              </form>
            </div>

            <button
              onClick={handleCancelLinking}
              disabled={loading}
              className="w-full mt-4 text-red-600 hover:text-red-700 font-medium text-sm disabled:text-gray-400"
            >
              ✕ Cancel
            </button>
          </div>
        )}

        {/* Email Verification Screen */}
        {mode === 'verify-email' && (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📧 Verify Your Email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification link to:<br/>
              <span className="font-semibold text-gray-800">{verificationEmail}</span>
            </p>

            {error && (
              <div className={`border px-4 py-3 rounded mb-4 whitespace-pre-line text-sm ${
                error.includes('resent') || error.includes('📧')
                  ? 'bg-green-100 border-green-400 text-green-700'
                  : 'bg-red-100 border-red-400 text-red-700'
              }`}>
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-900 mb-3">
                <strong>📝 What to do:</strong>
              </p>
              <ol className="list-decimal list-inside text-sm text-blue-900 space-y-2">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the "Verify Email" button in the email</li>
                <li>Come back here and click "I've Verified My Email"</li>
              </ol>
            </div>

            <button
              onClick={handleCheckEmailVerification}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-3"
            >
              {loading ? '⏳ Checking...' : '✅ I\'ve Verified My Email'}
            </button>

            <button
              onClick={handleResendVerificationEmail}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors mb-3"
            >
              {loading ? '⏳ Resending...' : '📮 Resend Verification Email'}
            </button>

            <button
              onClick={() => {
                setVerificationEmail('');
                setMode('welcome');
                setError('');
              }}
              disabled={loading}
              className="w-full text-red-600 hover:text-red-700 font-medium text-sm disabled:text-gray-400"
            >
              ← Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
