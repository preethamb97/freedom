import React from 'react';
import { Layout } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import UserProfile from '../molecules/UserProfile';

const { Sider } = Layout;

const Sidebar = ({ user, onSignOut, collapsed = false, isMobile = false, isOpen = false, onClose }) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div 
            className="mobile-overlay fixed inset-0 bg-black bg-opacity-50 z-[999] lg:hidden"
            onClick={handleOverlayClick}
          />
        )}
        
        {/* Mobile Sidebar */}
        <div
          className={`
            fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gray-50 border-r border-gray-200 z-[1000] 
            transform transition-transform duration-300 ease-in-out lg:hidden
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Mobile Close Button */}
          <div className="flex justify-end p-4 border-b border-gray-200">
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-200 transition-colors"
              aria-label="Close menu"
            >
              <CloseOutlined className="text-lg text-gray-600" />
            </button>
          </div>
          
          {/* Mobile Content */}
          <div className="p-4">
            <UserProfile user={user} onSignOut={onSignOut} />
          </div>
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <Sider 
      width={300} 
      className="bg-gray-50 border-r border-gray-200 min-h-screen hidden lg:block"
      collapsible={false}
      collapsed={collapsed}
      breakpoint="lg"
      collapsedWidth={0}
    >
      <div className="p-6">
        <UserProfile user={user} onSignOut={onSignOut} />
      </div>
    </Sider>
  );
};

export default Sidebar; 