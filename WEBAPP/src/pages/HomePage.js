import React, { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleViewData = () => {
    navigate('/view');
  };

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <Layout className="min-h-screen">
      <Header 
        showMobileMenu={isMobile} 
        onMenuClick={handleMenuClick}
      />
      
      <Layout>
        <Sidebar 
          user={user} 
          onSignOut={signOut}
          isMobile={isMobile}
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
        />
        
        <Layout className={`${isMobile ? '' : 'lg:ml-0'}`}>
          <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center max-w-4xl mx-auto space-y-3 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                  Encryption Management
                </h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Create new encryptions and store encrypted data securely
                </p>
              </div>
              
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={handleViewData}
                size="large"
                className="w-full sm:w-auto"
              >
                <span className="hidden xs:inline">View Data</span>
                <span className="xs:hidden">View</span>
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