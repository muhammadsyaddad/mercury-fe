import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const Layout: React.FC = () => {
  const { user, logout, hasAnyRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { 
      name: 'Operations', 
      icon: '📊', 
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: [UserRole.USER, UserRole.STAFF, UserRole.REVIEWER, UserRole.MANAGER, UserRole.ADMIN] },
        { name: 'Cameras', href: '/cameras', icon: '📹', roles: [UserRole.STAFF, UserRole.REVIEWER, UserRole.MANAGER, UserRole.ADMIN] },
        { name: 'History', href: '/history', icon: '📋', roles: [UserRole.STAFF, UserRole.REVIEWER, UserRole.MANAGER, UserRole.ADMIN] },
        { name: 'Waste Review', href: '/reviewed', icon: '✅', roles: [UserRole.REVIEWER, UserRole.MANAGER, UserRole.ADMIN] },
        { name: 'Trays', href: '/trays', icon: '🍽️', roles: [UserRole.MANAGER, UserRole.ADMIN] },
      ]
    },
    {
      name: 'Financial Analytics',
      icon: '💰',
      items: [
        { name: 'Executive Dashboard', href: '/executive', icon: '📈', roles: [UserRole.MANAGER, UserRole.ADMIN] },
        { name: 'Menu Management', href: '/menu', icon: '📖', roles: [UserRole.MANAGER, UserRole.ADMIN] },
        { name: 'Pricing Management', href: '/pricing', icon: '💵', roles: [UserRole.MANAGER, UserRole.ADMIN] },
        { name: 'Waste Targets', href: '/targets', icon: '🎯', roles: [UserRole.MANAGER, UserRole.ADMIN] },
        { name: 'Restaurant Metrics', href: '/restaurant-metrics', icon: '📊', roles: [UserRole.MANAGER, UserRole.ADMIN] },
      ]
    },
    { 
      name: 'Administration', 
      icon: '⚙️', 
      items: [
        { name: 'Users', href: '/users', icon: '👥', roles: [UserRole.ADMIN] },
        { name: 'Settings', href: '/settings', icon: '⚙️', roles: [UserRole.MANAGER, UserRole.ADMIN] },
      ]
    },
  ];

  // Filter navigation sections and items based on user roles
  const filteredNavigation = navigation.map(section => ({
    ...section,
    items: section.items.filter(item => hasAnyRole(item.roles))
  })).filter(section => section.items.length > 0);

  // Get all navigation items in flat structure for current page detection
  const allNavItems = navigation.flatMap(section => section.items);
  const currentPageName = allNavItems.find(item => item.href === location.pathname)?.name || 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Waste Detection</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-4">
            {filteredNavigation.map((section) => (
              <div key={section.name}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.name}
                </h3>
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        location.pathname === item.href
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
        desktopSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        <div className="flex flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            {!desktopSidebarCollapsed && (
              <h1 className="text-xl font-bold text-gray-900">Waste Detection</h1>
            )}
            <button
              onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
              className={`text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 ${
                desktopSidebarCollapsed ? 'mx-auto' : 'ml-auto'
              }`}
              title={desktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg 
                className={`h-5 w-5 transition-transform duration-300 ${
                  desktopSidebarCollapsed ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-4">
            {filteredNavigation.map((section) => (
              <div key={section.name}>
                {!desktopSidebarCollapsed && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.name}
                  </h3>
                )}
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        location.pathname === item.href
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      } ${desktopSidebarCollapsed ? 'justify-center' : ''}`}
                      title={desktopSidebarCollapsed ? item.name : ''}
                    >
                      <span className={`text-lg ${desktopSidebarCollapsed ? '' : 'mr-3'}`}>{item.icon}</span>
                      {!desktopSidebarCollapsed && item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${
        desktopSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-900 lg:hidden"
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="ml-4 text-2xl font-bold text-gray-900 lg:ml-0">
                {currentPageName}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              
              <div className="relative">
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;