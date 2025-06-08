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
  ...props 
}) => {
  return (
    <AntSelect
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      loading={loading}
      className={`w-full ${className}`}
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