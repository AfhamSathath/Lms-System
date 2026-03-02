import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import { FiMenu, FiBell, FiUser, FiLogOut, FiChevronDown, FiHome } from 'react-icons/fi';
import Sidebar from './Sidebar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) return;

    let mounted = true;
   

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

  const getDashboardPath = () => {
    if (!user) return '/';
    switch(user.role){
      case 'admin': return '/admin/dashboard';
      case 'lecturer': return '/lecturer/dashboard';
      case 'student': return '/student/dashboard';
      default: return '/';
    }
  };

  const getProfilePath = () => {
    if (!user) return '/';
    switch(user.role){
      case 'admin': return '/admin/profile';
      case 'lecturer': return '/lecturer/profile';
      case 'student': return '/student/profile';
      default: return '/profile';
    }
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'U';

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
        style={{ left: getNavbarMargin(), width: `calc(100% - ${getNavbarMargin()})` }}
      >
        <div className="px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between h-16 items-center">
            {/* Left */}
            <div className="flex items-center flex-1 min-w-0">
              <button onClick={toggleSidebar} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden">
                <FiMenu className="h-5 w-5" />
              </button>

              <Link to={getDashboardPath()} className="ml-2 flex items-center hover:text-purple-600 transition-colors">
                <FiHome className="h-4 w-4 text-gray-400 mr-2 hidden sm:block" />
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                    Dashboard
                  </h2>
                  <p className="text-xs text-gray-500 truncate">Welcome back, {user.name}</p>
                </div>
              </Link>
            </div>

            {/* Right */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Notifications */}
              <div className="relative">
                <Link to={`/${user.role}/notifications`} className="p-2 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded-lg relative block">
                  <FiBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 h-5 min-w-[20px] text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Profile */}
              <div className="relative" ref={profileMenuRef}>
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center space-x-2 p-1.5 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded-lg">
                  <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">{getInitials(user.name)}</span>
                  </div>
                  <FiChevronDown className={`h-4 w-4 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                    <button onClick={() => handleNavigation(getProfilePath())} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600">
                      <FiUser className="mr-3 h-4 w-4" /> Your Profile
                    </button>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <FiLogOut className="mr-3 h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div style={{ height: '4rem' }} />
    </>
  );
};

export default Navbar;