import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, Card, Typography, Alert, Tooltip, List, Empty, Spin, Checkbox } from 'antd';
import { EyeOutlined, InfoCircleOutlined, EyeTwoTone, EyeInvisibleOutlined, ReloadOutlined, StarOutlined, StarFilled } from '@ant-design/icons';

const { Title } = Typography;

const DataViewer = ({ encryptions, data, loading, onFetchData, onLoadMore, hasMore, encryptionsLoading }) => {
  const [form] = Form.useForm();
  const [selectedEncryption, setSelectedEncryption] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [isDefaultEncryption, setIsDefaultEncryption] = useState(false);

  // Load default encryption on component mount and when encryptions change
  useEffect(() => {
    if (encryptions.length > 0) {
      const defaultEncryptionId = localStorage.getItem('defaultEncryptionId');
      if (defaultEncryptionId && !selectedEncryption) {
        const defaultEncryption = encryptions.find(enc => enc.encryption_id.toString() === defaultEncryptionId);
        if (defaultEncryption) {
          setSelectedEncryption(defaultEncryption.encryption_id);
          form.setFieldsValue({ encryption: defaultEncryption.encryption_id });
          setIsDefaultEncryption(true);
        }
      }
    }
  }, [encryptions, form, selectedEncryption]);

  // Check if current selection is the default
  useEffect(() => {
    const defaultEncryptionId = localStorage.getItem('defaultEncryptionId');
    setIsDefaultEncryption(selectedEncryption && selectedEncryption.toString() === defaultEncryptionId);
  }, [selectedEncryption]);

  const handleEncryptionChange = (value) => {
    setSelectedEncryption(value);
    form.setFieldsValue({ encryption: value });
    setHasValidated(false);
  };

  const handleDefaultCheckboxChange = (e) => {
    const checked = e.target.checked;
    if (checked && selectedEncryption) {
      // Set as default
      localStorage.setItem('defaultEncryptionId', selectedEncryption.toString());
      setIsDefaultEncryption(true);
    } else {
      // Remove default
      localStorage.removeItem('defaultEncryptionId');
      setIsDefaultEncryption(false);
    }
  };

  const handleValidateAndFetch = async () => {
    try {
      await form.validateFields();
      await onFetchData(selectedEncryption, encryptionKey, true); // true for reset
      setHasValidated(true);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleLoadMore = () => {
    if (hasValidated && selectedEncryption && encryptionKey) {
      onFetchData(selectedEncryption, encryptionKey, false); // false for append
    }
  };

  const validateEncryptionKey = (key) => {
    return key && /^[a-zA-Z0-9]{64}$/.test(key);
  };

  const getSelectedEncryptionName = () => {
    if (!selectedEncryption) return '';
    const encryption = encryptions.find(enc => enc.encryption_id === selectedEncryption);
    return encryption ? encryption.name : '';
  };

  const isFormValid = selectedEncryption && validateEncryptionKey(encryptionKey);

  if (encryptionsLoading) {
    return (
      <Card title="View Encrypted Data" className="w-full">
        <div className="text-center py-8">
          <Spin size="large" tip="Loading encryptions..." />
        </div>
      </Card>
    );
  }

  return (
    <Card title="View Encrypted Data" className="w-full">
      <Alert
        message="Data Access"
        description="Select an encryption and enter the 64-character encryption key to view decrypted data."
        type="info"
        showIcon
        className="mb-6"
      />

      <Form form={form} layout="vertical" size="large">
        <Form.Item
          label="Select Encryption"
          name="encryption"
          rules={[
            { required: true, message: 'Please select an encryption' }
          ]}
        >
          <Select
            placeholder="Choose an encryption to view data from"
            value={selectedEncryption}
            onChange={handleEncryptionChange}
            options={encryptions.map(enc => ({
              value: enc.encryption_id,
              label: `${enc.name} (Created: ${new Date(enc.created_at).toLocaleDateString()})`
            }))}
            loading={encryptionsLoading}
            notFoundContent={encryptions.length === 0 ? 
              <Empty description="No encryptions found" image={Empty.PRESENTED_IMAGE_SIMPLE} /> : 
              null
            }
          />
        </Form.Item>

        {selectedEncryption && (
          <Form.Item>
            <Checkbox
              checked={isDefaultEncryption}
              onChange={handleDefaultCheckboxChange}
              className="flex items-center"
            >
              <span className="flex items-center">
                {isDefaultEncryption ? (
                  <StarFilled className="text-yellow-500 mr-1" />
                ) : (
                  <StarOutlined className="text-gray-400 mr-1" />
                )}
                Set "{getSelectedEncryptionName()}" as default encryption
              </span>
            </Checkbox>
            <div className="text-xs text-gray-500 mt-1 ml-6">
              {isDefaultEncryption 
                ? "This encryption will be automatically selected next time" 
                : "Check to make this your default encryption choice"
              }
            </div>
          </Form.Item>
        )}

        <Form.Item
          label={
            <span>
              64-Character Encryption Key
              <Tooltip title="Enter the encryption key for the selected encryption to decrypt and view the data">
                <InfoCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
          name="encryptionKey"
          rules={[
            { required: true, message: 'Please enter the 64-character encryption key' },
            { len: 64, message: 'Encryption key must be exactly 64 characters' },
            { pattern: /^[a-zA-Z0-9]+$/, message: 'Key must contain only letters and numbers' }
          ]}
        >
          <Input
            type={showKey ? "text" : "password"}
            placeholder="Enter 64-character encryption key to decrypt data"
            value={encryptionKey}
            onChange={(e) => {
              setEncryptionKey(e.target.value);
              setHasValidated(false);
            }}
            suffix={
              <Button
                type="text"
                size="small"
                onClick={() => setShowKey(!showKey)}
                icon={showKey ? <EyeInvisibleOutlined /> : <EyeTwoTone />}
              />
            }
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            onClick={handleValidateAndFetch}
            loading={loading}
            icon={<EyeOutlined />}
            size="large"
            className="w-full"
            disabled={!isFormValid}
          >
            Decrypt and View Data
          </Button>
        </Form.Item>
      </Form>

      {hasValidated && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <Title level={5}>Decrypted Data</Title>
            <Button
              type="default"
              onClick={handleValidateAndFetch}
              icon={<ReloadOutlined />}
              size="small"
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Spin size="large" tip="Decrypting data..." />
            </div>
          ) : data && data.length > 0 ? (
            <div>
              <List
                dataSource={data}
                renderItem={(item, index) => (
                  <List.Item key={item.data_id || index}>
                    <Card size="small" className="w-full">
                      <div className="whitespace-pre-wrap break-words">
                        {item.text}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Created: {new Date(item.created_at).toLocaleString()}
                        {item.updated_at && item.updated_at !== item.created_at && (
                          <span className="ml-2">
                            Updated: {new Date(item.updated_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
              
              {hasMore && (
                <div className="text-center mt-4">
                  <Button
                    type="default"
                    onClick={handleLoadMore}
                    loading={loading}
                    disabled={!hasValidated}
                  >
                    Load More Data
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Empty
              description="No encrypted data found for this encryption"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      )}

      <Alert
        message="Security Information"
        description={
          <ul className="mt-2 text-sm">
            <li>Data is decrypted client-side for viewing</li>
            <li>Your encryption key never leaves your browser</li>
            <li>Incorrect keys will result in failed decryption</li>
            <li>Refresh the page to clear decrypted data from memory</li>
          </ul>
        }
        type="warning"
        className="mt-4"
      />
    </Card>
  );
};

export default DataViewer; 