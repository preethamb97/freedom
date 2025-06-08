import React from 'react';
import { Input as AntInput } from 'antd';

const { TextArea, Password } = AntInput;

const Input = ({ 
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  rows = 4,
  size = 'middle',
  ...props 
}) => {
  const getInputClass = () => {
    let baseClass = 'w-full transition-all duration-200 ';
    
    // Touch-friendly sizing
    if (size === 'large') {
      baseClass += 'min-h-[48px] text-base ';
    } else if (size === 'middle') {
      baseClass += 'min-h-[44px] text-sm sm:text-base ';
    } else {
      baseClass += 'min-h-[40px] text-sm ';
    }
    
    return `${baseClass} ${className}`;
  };

  if (type === 'textarea') {
    return (
      <TextArea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        size={size}
        className={getInputClass()}
        {...props}
      />
    );
  }

  if (type === 'password') {
    return (
      <Password
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        size={size}
        className={getInputClass()}
        {...props}
      />
    );
  }

  return (
    <AntInput
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      size={size}
      className={getInputClass()}
      {...props}
    />
  );
};

export default Input; 