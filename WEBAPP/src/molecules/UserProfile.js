import React from 'react';
import { Card, Avatar, Typography } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import Button from '../atoms/Button';

const { Title, Text } = Typography;

const UserProfile = ({ user, onSignOut }) => {
  return (
    <Card className="w-full">
      <div className="flex flex-col items-center space-y-3 sm:space-y-4">
        <Avatar 
          size={56} 
          src={user?.photo} 
          icon={<UserOutlined />}
          className="border-2 border-primary sm:w-16 sm:h-16"
        />
        
        <div className="text-center">
          <Title level={4} className="mb-1 text-sm sm:text-base">
            {user?.name || 'Unknown User'}
          </Title>
          <Text type="secondary" className="text-xs sm:text-sm break-all">
            {user?.email || 'No email'}
          </Text>
        </div>
        
        <Button
          variant="ghost"
          icon={<LogoutOutlined />}
          onClick={onSignOut}
          className="w-full text-sm"
          size="middle"
        >
          Sign Out
        </Button>
      </div>
    </Card>
  );
};

export default UserProfile; 