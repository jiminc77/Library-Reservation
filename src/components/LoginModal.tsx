import { useState } from 'react';
import { libraryApi } from '@/lib/api';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await libraryApi.login(userId, password);
      if (response.success) {
        localStorage.setItem('accessToken', response.accessToken);
        // Fetch user details
        const accountResponse = await libraryApi.getAccount();
        console.log('Account Response:', accountResponse);
        
        if (accountResponse) {
          // The API structure for getAccount seems to return the user object directly in 'result' or 'data'
          // Based on api.ts: return response.data.data;
          // So accountResponse IS the data object.
          // Let's check if it has user_nm directly or if it's nested.
          const userData = accountResponse.result || accountResponse;
          console.log('User Data extracted:', userData);

          if (userData) {
            onLoginSuccess(userData);
            onClose();
          } else {
            console.error('Could not extract user data from:', accountResponse);
            setError('Failed to fetch user details.');
          }
        } else {
          console.error('Account response missing:', accountResponse);
          setError('Failed to fetch user details.');
        }
      } else {
        console.error('Login failed:', response);
        setError(response.message || 'Login failed. Please check your ID and Password.');
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-xl p-10 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Login to GIST Library</h2>
          <p className="text-gray-500 mt-2">Please enter your student ID and password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
              Student ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-gray-50 focus:bg-white transition-all"
              placeholder="Enter your Student ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-gray-50 focus:bg-white transition-all"
              placeholder="Enter your Password"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold text-lg transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 mt-2"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
