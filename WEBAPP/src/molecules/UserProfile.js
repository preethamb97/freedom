import React from 'react';
import { Card, Avatar, Typography } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import Button from '../atoms/Button';

const { Title, Text } = Typography;

const UserProfile = ({ user, onSignOut }) => {
  return (
    <Card className="w-full max-w-sm">
      <div className="flex flex-col items-center space-y-4">
        <Avatar 
          size={64} 
          src={user?.photo} 
          icon={<UserOutlined />}
          className="border-2 border-primary"
        />
        
        <div className="text-center">
          <Title level={4} className="mb-1">
            {user?.name || 'Unknown User'}
          </Title>
          <Text type="secondary" className="text-sm">
            {user?.email || 'No email'}
          </Text>
        </div>
        
        <Button
          variant="ghost"
          icon={<LogoutOutlined />}
          onClick={onSignOut}
          className="w-full"
        >
          Sign Out
        </Button>
      </div>
    </Card>
  );
};

export default UserProfile; 