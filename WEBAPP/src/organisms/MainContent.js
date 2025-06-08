import React, { useState, useEffect } from 'react';
import { Layout, Space, notification } from 'antd';
import EncryptionForm from '../molecules/EncryptionForm';
import DataForm from '../molecules/DataForm';
import { encryptionAPI, dataAPI } from '../services/api';

const { Content } = Layout;

const MainContent = () => {
  const [encryptions, setEncryptions] = useState([]);
  const [encryptionsLoading, setEncryptionsLoading] = useState(false);
  const [encryptionFormLoading, setEncryptionFormLoading] = useState(false);
  const [dataFormLoading, setDataFormLoading] = useState(false);

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

  const handleCreateEncryption = async (name, encryptionKey) => {
    try {
      setEncryptionFormLoading(true);
      await encryptionAPI.create({
        name,
        encryptionKey
      });
      
      notification.success({
        message: 'Encryption Created',
        description: `"${name}" has been created successfully`,
      });
      
      await fetchEncryptions();
    } catch (error) {
      console.error('Error creating encryption:', error);
      notification.error({
        message: 'Creation Failed',
        description: error.response?.data?.message || 'Failed to create encryption',
      });
    } finally {
      setEncryptionFormLoading(false);
    }
  };

  const handleStoreData = async (encryptionId, text, encryptionKey) => {
    try {
      setDataFormLoading(true);
      await dataAPI.store({
        encryption_id: encryptionId,
        text,
        encryptionKey
      });
      
      notification.success({
        message: 'Data Stored',
        description: 'Your data has been encrypted and stored successfully',
      });
    } catch (error) {
      console.error('Error storing data:', error);
      notification.error({
        message: 'Storage Failed',
        description: error.response?.data?.message || 'Failed to store data',
      });
    } finally {
      setDataFormLoading(false);
    }
  };

  return (
    <Content className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Space direction="vertical" size="large" className="w-full">
          <EncryptionForm
            onSubmit={handleCreateEncryption}
            loading={encryptionFormLoading}
          />
          
          <DataForm
            encryptions={encryptions}
            encryptionsLoading={encryptionsLoading}
            onSubmit={handleStoreData}
            loading={dataFormLoading}
          />
        </Space>
      </div>
    </Content>
  );
};

export default MainContent; 