import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import { FiMenu, FiBell } from 'react-icons/fi';
import Sidebar from './Sidebar';

const Navbar = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const fetchCount = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        if (mounted) setUnreadCount(res.data.count);
      } catch (e) {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  if (!user) return null;

  return (
    <>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <nav
        className={`bg-white shadow-lg sticky top-0 z-20 transition-all duration-300
        ${sidebarOpen ? 'lg:ml-52' : 'lg:ml-16'}`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left section */}
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
              >
                <FiMenu className="h-6 w-6" />
              </button>
              <div className="ml-4 lg:ml-0 min-w-0">
                <h2 className="text-lg font-semibold text-gray-800 truncate">
                  {user.role === 'admin' ? 'Admin Dashboard' :
                   user.role === 'lecturer' ? 'Lecturer Dashboard' :
                   'Student Dashboard'}
                </h2>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Link
                  to="/notifications"
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors relative"
                >
                  <FiBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 h-4 w-4 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Profile */}
              <div className="relative">
                <button
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium truncate">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;