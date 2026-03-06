import React from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiUsers, FiTrendingUp, FiClock, FiAward, FiShield, FiArrowRight, FiGithub, FiMail } from 'react-icons/fi';

const Landing = () => {
  const features = [
    {
      icon: FiBook,
      title: 'Course Management',
      description: 'Organize and manage courses with advanced scheduling and content delivery.'
    },
    {
      icon: FiUsers,
      title: 'Collaborative Learning',
      description: 'Connect students and educators for an interactive learning experience.'
    },
    {
      icon: FiTrendingUp,
      title: 'Performance Analytics',
      description: 'Track progress with detailed performance metrics and grade analysis.'
    },
    {
      icon: FiClock,
      title: 'Flexible Scheduling',
      description: 'Create and manage flexible timetables that work for everyone.'
    },
    {
      icon: FiAward,
      title: 'Grading System',
      description: 'Comprehensive grading with automatic GPA calculations and transcripts.'
    },
    {
      icon: FiShield,
      title: 'Secure Access',
      description: 'Role-based access control ensuring data security and privacy.'
    },
  ];

  const stats = [

  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <img src="/esn.webp" alt="Logo" className="h-8 w-8" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
               Trincomalee Campus , Eastern University Sri Lanka
              </span>
            </div>
            <div className="flex items-center space-x-4">

              <Link
                to="/login"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-72 left-1/3 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                  Modern Learning
                  <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Management System
                  </span>
                </h1><br></br>
                <p className="mt-6 text-xl text-gray-600">
                  Streamline education with our comprehensive LMS platform. Connect students, lecturers, and administrators in one powerful ecosystem.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">


              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Illustration: student collage */}
            {/* Right Image */}
            <div className="flex justify-center lg:justify-end">
              <img
                src="/uni.webp"   // change if your file name is different
                alt="University Students"
                className="w-72 lg:w-96 xl:w-[420px] 
               rounded-3xl 
               shadow-xl 
               border border-gray-100
               hover:scale-105 
               transition-all duration-500"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Everyone
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to manage learning effectively
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const IconComponent = feature.icon;
              return (
                <div key={idx} className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>



      {/* CTA Section */}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <img src="/esn.webp" alt="Logo" className="h-6 w-10" />
                </div>
                <span className="font-bold text-white"> Trincomalee Campus , Eastern University Sri Lanka</span>
              </div>
              <p className="text-sm text-gray-400">
                Empowering education through technology.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-center">
                  <FiMail className="mr-2 h-4 w-4" />
                  support@tclms.com
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400">
                © 2026 Trincomalee Campus , Eastern University Sri Lanka. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FiGithub className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
