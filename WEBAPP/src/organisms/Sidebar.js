import React from 'react';
import { Layout } from 'antd';
import UserProfile from '../molecules/UserProfile';

const { Sider } = Layout;

const Sidebar = ({ user, onSignOut, collapsed = false }) => {
  return (
    <Sider 
      width={300} 
      className="bg-gray-50 border-r border-gray-200 min-h-screen"
      collapsible={false}
      collapsed={collapsed}
    >
      <div className="p-6">
        <UserProfile user={user} onSignOut={onSignOut} />
      </div>
    </Sider>
  );
};

export default Sidebar; 