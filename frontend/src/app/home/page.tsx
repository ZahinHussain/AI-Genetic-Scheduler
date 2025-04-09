"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const HomePage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        // First try to get user from localStorage
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        
        // Verify authentication with the server
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } else {
          // Not authenticated, redirect to login
          router.push('/signin');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/signin');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // Redirect to login
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header/Navigation */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Genetic Scheduler</h1>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-gray-600">Welcome, {user.email}</span>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions Card */}
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <h3 className="font-medium text-blue-800 mb-2">Quick Actions</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/schedule/new" className="text-blue-600 hover:text-blue-800">
                    Create New Schedule
                  </Link>
                </li>
                <li>
                  <Link href="/projects" className="text-blue-600 hover:text-blue-800">
                    Manage Projects
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-blue-600 hover:text-blue-800">
                    Edit Profile
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Recent Activity Card */}
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <h3 className="font-medium text-green-800 mb-2">Recent Activity</h3>
              <p className="text-gray-600">No recent activity to display.</p>
            </div>
            
            {/* Stats Card */}
            <div className="bg-purple-50 p-4 rounded-lg shadow">
              <h3 className="font-medium text-purple-800 mb-2">Statistics</h3>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-600">Projects</p>
                  <p className="text-2xl font-bold text-purple-700">0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Schedules</p>
                  <p className="text-2xl font-bold text-purple-700">0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tasks</p>
                  <p className="text-2xl font-bold text-purple-700">0</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Server Status Section */}
          <div className="mt-8 bg-gray-50 p-4 rounded-lg shadow">
            <h3 className="font-medium text-gray-800 mb-2">Server Status</h3>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Backend server is online</span>
            </div>
            <div className="mt-2">
              <ServerPingTest />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Component to test the server ping
const ServerPingTest: React.FC = () => {
  const [pingResponse, setPingResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePing = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ping');
      if (response.ok) {
        const data = await response.json();
        setPingResponse(data.message);
      } else {
        const textResponse = await response.text();
        setPingResponse(`Failed: ${response.status} - ${textResponse}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setPingResponse(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={handlePing}
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
      >
        Test Connection
      </button>
      {isLoading && <span className="ml-2 text-sm text-gray-600">Testing...</span>}
      {pingResponse && <div className="mt-1 text-sm text-gray-800">{pingResponse}</div>}
    </div>
  );
};

export default HomePage;