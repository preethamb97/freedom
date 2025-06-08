import React from 'react';
import { Layout, Typography } from 'antd';
import { LockOutlined, MenuOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header = ({ title = 'Freedom', onMenuClick, showMobileMenu = false }) => {
  return (
    <AntHeader className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile Menu Button */}
          {showMobileMenu && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <MenuOutlined className="text-lg text-gray-600" />
            </button>
          )}
          
          <LockOutlined className="text-xl sm:text-2xl text-primary" />
          <Title 
            level={3} 
            className="mb-0 text-gray-800 text-base sm:text-lg md:text-xl"
            style={{ margin: 0, fontSize: 'inherit' }}
          >
            {title}
          </Title>
        </div>
        
        {/* Additional header content can go here */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Future: User avatar or additional controls */}
        </div>
      </div>
    </AntHeader>
  );
};

export default Header; 