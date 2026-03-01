import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const PasswordInput = ({ 
  name, 
  value, 
  onChange, 
  placeholder = 'Enter password',
  required = false,
  className = '',
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10 ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
        tabIndex="-1"
      >
        {showPassword ? (
          <FiEyeOff className="h-5 w-5" />
        ) : (
          <FiEye className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;