import React, { useState, useCallback, useEffect } from 'react';
import { Form, Select, Input, Button, Card, Alert, Tooltip, Empty, Spin, Checkbox } from 'antd';
import { SaveOutlined, InfoCircleOutlined, EyeTwoTone, EyeInvisibleOutlined, StarOutlined, StarFilled } from '@ant-design/icons';

const { TextArea } = Input;

const DataForm = ({ encryptions, onSubmit, loading, encryptionsLoading }) => {
  const [form] = Form.useForm();
  const [selectedEncryption, setSelectedEncryption] = useState(null);
  const [text, setText] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [showKey, setShowKey] = useState(false);
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

  // Validate encryption key
  const validateEncryptionKey = useCallback((key) => {
    if (!key) return false;
    return /^[a-zA-Z0-9]{64}$/.test(key);
  }, []);

  const handleEncryptionChange = (value) => {
    setSelectedEncryption(value);
    form.setFieldsValue({ encryption: value });
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

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      
      if (!validateEncryptionKey(encryptionKey)) {
        form.setFields([{
          name: 'encryptionKey',
          errors: ['Please enter a valid 64-character encryption key (letters and numbers only)']
        }]);
        return;
      }

      await onSubmit(selectedEncryption, text, encryptionKey);
      
      // Reset form but keep default encryption selected
      form.resetFields();
      setText('');
      setEncryptionKey('');
      
      // Restore default encryption if it exists
      const defaultEncryptionId = localStorage.getItem('defaultEncryptionId');
      if (defaultEncryptionId) {
        const defaultEncryption = encryptions.find(enc => enc.encryption_id.toString() === defaultEncryptionId);
        if (defaultEncryption) {
          setSelectedEncryption(defaultEncryption.encryption_id);
          form.setFieldsValue({ encryption: defaultEncryption.encryption_id });
        }
      } else {
        setSelectedEncryption(null);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const isFormValid = selectedEncryption && text.trim() && validateEncryptionKey(encryptionKey);

  const getSelectedEncryptionName = () => {
    if (!selectedEncryption) return '';
    const encryption = encryptions.find(enc => enc.encryption_id === selectedEncryption);
    return encryption ? encryption.name : '';
  };

  return (
    <Card title="Store Encrypted Data" className="w-full">
      <Alert
        message="Secure Data Storage"
        description="Your 64-character encryption key is required to encrypt and store data. Make sure you have it saved securely."
        type="info"
        showIcon
        className="mb-6"
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
        <Form.Item
          label="Select Encryption"
          name="encryption"
          rules={[
            { required: true, message: 'Please select an encryption' }
          ]}
        >
          <Select
            placeholder="Choose an encryption to store data in"
            value={selectedEncryption}
            onChange={handleEncryptionChange}
            loading={encryptionsLoading}
            disabled={encryptionsLoading}
            options={encryptions.map(enc => ({
              value: enc.encryption_id,
              label: `${enc.name} (Created: ${new Date(enc.created_at).toLocaleDateString()})`
            }))}
            notFoundContent={
              encryptionsLoading ? (
                <div className="text-center py-2">
                  <Spin size="small" />
                  <span className="ml-2">Loading encryptions...</span>
                </div>
              ) : encryptions.length === 0 ? (
                <Empty 
                  description="No encryptions available. Create an encryption first." 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                />
              ) : null
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
          label="Data to Encrypt"
          name="text"
          rules={[
            { required: true, message: 'Please enter text to encrypt' },
            { min: 1, message: 'Text cannot be empty' },
            { max: 10000, message: 'Text is too long (max 10,000 characters)' }
          ]}
        >
          <TextArea
            rows={6}
            placeholder="Enter the text you want to encrypt and store securely..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            showCount
            maxLength={10000}
          />
        </Form.Item>

        <Form.Item
          label={
            <span>
              64-Character Encryption Key
              <Tooltip title="Enter the same 64-character encryption key you used when creating this encryption">
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
            placeholder="Enter 64-character encryption key for the selected encryption"
            value={encryptionKey}
            onChange={(e) => setEncryptionKey(e.target.value)}
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
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
            size="large"
            className="w-full"
            disabled={!isFormValid || encryptionsLoading}
          >
            Encrypt and Store Data
          </Button>
        </Form.Item>
      </Form>

      <Alert
        message="Security Reminders"
        description={
          <ul className="mt-2 text-sm">
            <li>• Your encryption key is needed to access this data later</li>
            <li>• Data is encrypted client-side before being sent to the server</li>
            <li>• Without the correct encryption key, the data cannot be decrypted</li>
            <li>• Keep your encryption key safe and private</li>
          </ul>
        }
        type="warning"
        className="mt-4"
      />
    </Card>
  );
};

export default DataForm; 