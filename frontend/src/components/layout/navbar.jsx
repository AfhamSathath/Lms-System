import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import { FiMenu, FiBell, FiUser, FiLogOut, FiSettings, FiChevronDown, FiHome } from 'react-icons/fi';
import Sidebar from './Sidebar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const profileMenuRef = useRef(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) return;
    
    let mounted = true;
    let intervalId;

    const fetchUnreadCount = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        const res = await api.get('/notifications/unread-count');
        if (mounted && res.data) {
          setUnreadCount(res.data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUnreadCount();
    intervalId = setInterval(fetchUnreadCount, 30000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (path) => {
    setShowProfileMenu(false);
    navigate(path);
  };

  const getDashboardTitle = () => {
    if (!user) return 'Dashboard';
    
    switch(user.role) {
      case 'admin':
        return 'Admin Dashboard';
      case 'lecturer':
        return 'Lecturer Dashboard';
      case 'student':
        return 'Student Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    
    switch(user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'lecturer':
        return '/lecturer/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/';
    }
  };

  const getProfilePath = () => {
    if (!user) return '/';
    
    switch(user.role) {
      case 'admin':
        return '/admin/profile';
      case 'lecturer':
        return '/lecturer/profile';
      case 'student':
        return '/student/profile';
      default:
        return '/profile';
    }
  };

 

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  // Calculate margin based on sidebar state and window width
  const getNavbarMargin = () => {
    if (typeof window === 'undefined') return '0';
    if (window.innerWidth < 1024) return '0';
    return sidebarOpen ? '16rem' : '4rem';
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <nav
        className="bg-white shadow-lg fixed top-0 right-0 z-30 transition-all duration-300"
        style={{ 
          left: getNavbarMargin(),
          width: `calc(100% - ${getNavbarMargin()})`
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between h-16 items-center">
            {/* Left section */}
            <div className="flex items-center flex-1 min-w-0">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden transition-colors"
                aria-label="Toggle sidebar"
              >
                <FiMenu className="h-5 w-5" />
              </button>
              
              {/* Dashboard Home Link */}
              <Link 
                to={getDashboardPath()}
                className="ml-2 lg:ml-0 flex items-center hover:text-purple-600 transition-colors group"
              >
                <FiHome className="h-4 w-4 text-gray-400 mr-2 hidden sm:block group-hover:text-purple-600 transition-colors" />
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate group-hover:text-purple-600 transition-colors">
                    {getDashboardTitle()}
                  </h2>
                  {user && (
                    <p className="text-xs text-gray-500 truncate">
                      Welcome back, {user.name}
                    </p>
                  )}
                </div>
              </Link>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {/* Notifications */}
              <div className="relative">
                <Link
                  to={`/${user.role}/notifications`}
                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded-lg transition-colors relative block"
                  aria-label="Notifications"
                >
                  <FiBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 h-5 min-w-[20px] text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Profile menu"
                  aria-expanded={showProfileMenu}
                >
                  <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-white font-medium text-sm">
                      {getInitials(user?.name)}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize truncate max-w-[120px]">
                      {user?.role}
                    </p>
                  </div>
                  <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 hidden lg:block flex-shrink-0 ${
                    showProfileMenu ? 'transform rotate-180' : ''
                  }`} />
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full capitalize">
                          {user?.role}
                        </span>
                        {user?.studentId && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                            ID: {user.studentId}
                          </span>
                        )}
                        {user?.lecturerId && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                            ID: {user.lecturerId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {/* Profile Link */}
                      <button
                        onClick={() => handleNavigation(getProfilePath())}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                      >
                        <FiUser className="mr-3 h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 text-left">Your Profile</span>
                        <span className="text-xs text-gray-400">{user?.role}</span>
                      </button>

                      

                      <div className="border-t border-gray-200 my-1"></div>

                      {/* Dashboard Link */}
                      <button
                        onClick={() => handleNavigation(getDashboardPath())}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                      >
                        <FiHome className="mr-3 h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 text-left">Dashboard</span>
                      </button>

                      {/* Notifications Link */}
                      <button
                        onClick={() => handleNavigation(`/${user.role}/notifications`)}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                      >
                        <FiBell className="mr-3 h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 text-left">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      <div className="border-t border-gray-200 my-1"></div>

                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiLogOut className="mr-3 h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 text-left">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div style={{ height: '4rem' }} />
    </>
  );
};

export default Navbar;