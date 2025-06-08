import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Header from '../organisms/Header';
import Sidebar from '../organisms/Sidebar';
import DataViewer from '../molecules/DataViewer';
import Button from '../atoms/Button';
import { useAuth } from '../hooks/useAuth';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { encryptionAPI, dataAPI } from '../services/api';
import { notification } from 'antd';

const ITEMS_PER_PAGE = 10;

const ViewPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [encryptions, setEncryptions] = useState([]);
  const [data, setData] = useState([]);
  const [encryptionsLoading, setEncryptionsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentEncryption, setCurrentEncryption] = useState('');
  const [currentEncryptionKey, setCurrentEncryptionKey] = useState('');
  const [currentOffset, setCurrentOffset] = useState(0);
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

  useEffect(() => {
    fetchEncryptions();
  }, []);

  const fetchEncryptions = async () => {
    try {
      setEncryptionsLoading(true);
      const response = await encryptionAPI.getAll();
      setEncryptions(response.data.encryptions || []);
    } catch (error) {
      console.error('Failed to fetch encryptions:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch encryptions',
      });
    } finally {
      setEncryptionsLoading(false);
    }
  };

  const fetchData = useCallback(async (encryptionId, encryptionKey, reset = false) => {
    try {
      setDataLoading(true);
      const requestOffset = reset ? 0 : currentOffset;
      
      const response = await dataAPI.retrieve(encryptionId, {
        passphrase: encryptionKey,
        offset: requestOffset,
        limit: ITEMS_PER_PAGE
      });
      const responseData = response.data;
      const newData = responseData.data || [];
      const totalCount = responseData.total || 0;
      
      if (reset) {
        setData(newData);
        setCurrentOffset(ITEMS_PER_PAGE);
      } else {
        setData(prev => [...prev, ...newData]);
        setCurrentOffset(prev => prev + ITEMS_PER_PAGE);
      }
      
      // Check if there's more data to load
      const newHasMore = (reset ? ITEMS_PER_PAGE : currentOffset + ITEMS_PER_PAGE) < totalCount;
      setHasMore(newHasMore);
      
      setCurrentEncryption(encryptionId);
      setCurrentEncryptionKey(encryptionKey);
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      const errorMessage = error.response?.data?.message || 'Failed to decrypt data. Please check your encryption key.';
      notification.error({
        message: 'Access Failed',
        description: errorMessage,
      });
      
      // Reset data on error
      if (reset) {
        setData([]);
        setCurrentOffset(0);
        setHasMore(false);
      }
    } finally {
      setDataLoading(false);
    }
  }, [currentOffset]);

  const fetchMoreData = useCallback(async () => {
    if (currentEncryption && currentEncryptionKey && hasMore && !dataLoading) {
      await fetchData(currentEncryption, currentEncryptionKey, false);
    }
  }, [currentEncryption, currentEncryptionKey, hasMore, dataLoading, fetchData]);

  useInfiniteScroll(fetchMoreData);

  const handleGoHome = () => {
    navigate('/home');
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
        title="View Encrypted Data" 
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
                  Decrypt and View Data
                </h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Select an encryption and enter your 64-digit encryption key to view decrypted data
                </p>
              </div>
              
              <Button
                variant="ghost"
                icon={<ArrowLeftOutlined />}
                onClick={handleGoHome}
                size="large"
                className="w-full sm:w-auto"
              >
                <span className="hidden xs:inline">Back to Home</span>
                <span className="xs:hidden">Back</span>
              </Button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
              <DataViewer
                encryptions={encryptions}
                data={data}
                onFetchData={fetchData}
                onLoadMore={fetchMoreData}
                loading={dataLoading}
                encryptionsLoading={encryptionsLoading}
                hasMore={hasMore}
              />
            </div>
          </div>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default ViewPage; 