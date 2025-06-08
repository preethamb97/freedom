import React from 'react';
import { Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import Header from '../organisms/Header';
import Sidebar from '../organisms/Sidebar';
import MainContent from '../organisms/MainContent';
import Button from '../atoms/Button';
import { EyeOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

const HomePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleViewData = () => {
    navigate('/view');
  };

  return (
    <Layout className="min-h-screen">
      <Header />
      
      <Layout>
        <Sidebar user={user} onSignOut={signOut} />
        
        <Layout>
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex justify-between items-center max-w-4xl mx-auto">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  Encryption Management
                </h2>
                <p className="text-gray-600 mt-1">
                  Create new encryptions and store encrypted data securely
                </p>
              </div>
              
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={handleViewData}
                size="large"
              >
                View Data
              </Button>
            </div>
          </div>
          
          <MainContent />
        </Layout>
      </Layout>
    </Layout>
  );
};

export default HomePage; 