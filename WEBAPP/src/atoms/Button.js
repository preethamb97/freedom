import React from 'react';
import { Button as AntButton } from 'antd';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'middle', 
  loading = false,
  className = '',
  ...props 
}) => {
  const getButtonType = () => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'default';
      case 'danger':
        return 'primary';
      case 'ghost':
        return 'default';
      default:
        return 'primary';
    }
  };

  const getButtonClass = () => {
    let baseClass = 'transition-all duration-200 ';
    
    // Touch-friendly sizing
    if (size === 'large') {
      baseClass += 'min-h-[48px] px-6 py-3 text-base ';
    } else if (size === 'middle') {
      baseClass += 'min-h-[44px] px-4 py-2 text-sm sm:text-base ';
    } else {
      baseClass += 'min-h-[40px] px-3 py-1 text-sm ';
    }
    
    if (variant === 'danger') {
      baseClass += 'bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600 ';
    } else if (variant === 'ghost') {
      baseClass += 'border-gray-300 text-gray-600 hover:text-primary hover:border-primary ';
    }
    
    return `${baseClass} ${className}`;
  };

  return (
    <AntButton
      type={getButtonType()}
      size={size}
      loading={loading}
      className={getButtonClass()}
      {...props}
    >
      {children}
    </AntButton>
  );
};

export default Button; 