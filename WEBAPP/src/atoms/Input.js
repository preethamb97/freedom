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
  ...props 
}) => {
  const baseClass = 'w-full';

  if (type === 'textarea') {
    return (
      <TextArea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`${baseClass} ${className}`}
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
        className={`${baseClass} ${className}`}
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
      className={`${baseClass} ${className}`}
      {...props}
    />
  );
};

export default Input; 