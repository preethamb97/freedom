import React from 'react';
import { Layout, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header = ({ title = 'Freedom' }) => {
  return (
    <AntHeader className="bg-white shadow-sm border-b border-gray-200 px-6">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center space-x-3">
          <LockOutlined className="text-2xl text-primary" />
          <Title level={3} className="mb-0 text-gray-800">
            {title}
          </Title>
        </div>
      </div>
    </AntHeader>
  );
};

export default Header; 