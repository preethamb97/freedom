import React from 'react';
import { Select as AntSelect } from 'antd';

const { Option } = AntSelect;

const Select = ({ 
  options = [],
  placeholder = 'Select an option',
  value,
  onChange,
  className = '',
  loading = false,
  size = 'middle',
  ...props 
}) => {
  const getSelectClass = () => {
    let baseClass = 'w-full transition-all duration-200 ';
    
    // Touch-friendly sizing
    if (size === 'large') {
      baseClass += 'min-h-[48px] ';
    } else if (size === 'middle') {
      baseClass += 'min-h-[44px] ';
    } else {
      baseClass += 'min-h-[40px] ';
    }
    
    return `${baseClass} ${className}`;
  };

  return (
    <AntSelect
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      loading={loading}
      size={size}
      className={getSelectClass()}
      {...props}
    >
      {options.map((option) => (
        <Option key={option.value} value={option.value}>
          {option.label}
        </Option>
      ))}
    </AntSelect>
  );
};

export default Select; 