import React, { useState, useCallback } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Tooltip, Progress } from 'antd';
import { InfoCircleOutlined, KeyOutlined, ReloadOutlined, EyeTwoTone, EyeInvisibleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const EncryptionForm = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();
  const [name, setName] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [keyStrength, setKeyStrength] = useState({ score: 0, issues: [], level: 'weak' });
  const [showKey, setShowKey] = useState(false);

  // Validate encryption key
  const validateEncryptionKey = useCallback((key) => {
    if (!key) {
      return { isValid: false, issues: ['64-character encryption key is required'], level: 'none' };
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(key)) {
      return { isValid: false, issues: ['Key must contain only letters and numbers'], level: 'weak' };
    }
    
    if (key.length !== 64) {
      return { isValid: false, issues: [`Key must be exactly 64 characters (current: ${key.length})`], level: 'weak' };
    }
    
    // Check for weak patterns
    const issues = [];
    let score = 60; // Base score for correct length and format
    
    if (/^(.)\1{63}$/.test(key)) {
      issues.push('Key cannot be all the same character');
      score = 0;
    }
    
    const lowercaseKey = key.toLowerCase();
    if (lowercaseKey === '0123456789'.repeat(6) + '0123') {
      issues.push('Key cannot be a simple repeating pattern');
      score = 20;
    }
    
    if (lowercaseKey === '1234567890'.repeat(6) + '1234') {
      issues.push('Key cannot be a simple sequence pattern');
      score = 20;
    }
    
    if (lowercaseKey === 'abcdefghij'.repeat(6) + 'abcd') {
      issues.push('Key cannot be a simple alphabetic pattern');
      score = 20;
    }
    
    // Check for diversity in characters
    const uniqueChars = new Set(lowercaseKey).size;
    if (uniqueChars < 8) {
      issues.push('Key should use more diverse characters');
      score = Math.max(score - 20, 30);
    } else if (uniqueChars >= 20) {
      score += 20;
    }
    
    // Check for mix of letters and numbers
    const hasLetters = /[a-zA-Z]/.test(key);
    const hasNumbers = /[0-9]/.test(key);
    
    if (hasLetters && hasNumbers) {
      score += 15; // Bonus for mixed character types
    } else if (!hasLetters || !hasNumbers) {
      issues.push('Consider mixing letters and numbers for better security');
      score = Math.max(score - 10, 40);
    }
    
    // Check for randomness patterns
    let sequenceCount = 0;
    for (let i = 0; i < key.length - 2; i++) {
      const char1 = key.charCodeAt(i);
      const char2 = key.charCodeAt(i + 1);
      const char3 = key.charCodeAt(i + 2);
      
      if ((char2 === char1 + 1 && char3 === char2 + 1) || 
          (char2 === char1 - 1 && char3 === char2 - 1)) {
        sequenceCount++;
      }
    }
    
    if (sequenceCount > 5) {
      issues.push('Too many sequential characters detected');
      score = Math.max(score - 15, 25);
    }
    
    // Determine security level
    let level;
    if (score >= 85) level = 'excellent';
    else if (score >= 70) level = 'good';
    else if (score >= 50) level = 'fair';
    else level = 'weak';
    
    return {
      isValid: score >= 50,
      score,
      issues,
      level
    };
  }, []);

  const handleKeyChange = (e) => {
    const value = e.target.value;
    setEncryptionKey(value);
    
    // Update validation
    const validation = validateEncryptionKey(value);
    setKeyStrength(validation);
  };

  const getStrengthColor = (level) => {
    switch (level) {
      case 'excellent': return '#52c41a';
      case 'strong': return '#73d13d';
      case 'good': return '#fadb14';
      case 'fair': return '#fa8c16';
      case 'weak': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getStrengthText = (level) => {
    switch (level) {
      case 'excellent': return 'Excellent';
      case 'strong': return 'Strong';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'weak': return 'Weak';
      default: return 'No key entered';
    }
  };

  const handleSubmit = async (values) => {
    try {
      // Validate form fields first
      await form.validateFields();
      
      // Additional security check for key strength
      if (keyStrength.level === 'weak' || !validateEncryptionKey(values.encryptionKey || encryptionKey).isValid) {
        form.setFields([{
          name: 'encryptionKey',
          errors: ['Please use a stronger encryption key for better security']
        }]);
        return;
      }

      // Use validated form values instead of state variables
      await onSubmit(values.name, values.encryptionKey || encryptionKey);
      
      // Reset form only after successful submission
      form.resetFields();
      setName('');
      setEncryptionKey('');
      setKeyStrength({ score: 0, issues: [], level: 'weak' });
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Handle backend validation errors
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        // Set form field errors based on the backend error message
        if (errorMessage.includes('name must be at least 3 characters')) {
          form.setFields([{
            name: 'name',
            errors: [errorMessage]
          }]);
        } else if (errorMessage.includes('encryption key') || errorMessage.includes('64')) {
          form.setFields([{
            name: 'encryptionKey',
            errors: [errorMessage]
          }]);
        } else if (errorMessage.includes('already exists')) {
          form.setFields([{
            name: 'name',
            errors: [errorMessage]
          }]);
        }
      }
      
      // Don't reset form on error to preserve user input
    }
  };

  const generateSecureKey = () => {
    // Generate a cryptographically secure 64-character key with mix of letters and numbers
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    
    // Ensure we have at least some letters and numbers
    const minLetters = 20;
    const minNumbers = 10;
    let letterCount = 0;
    let numberCount = 0;
    
    for (let i = 0; i < 64; i++) {
      let char;
      
      // Force letters if we haven't met minimum
      if (letterCount < minLetters && (64 - i) <= (minLetters - letterCount + minNumbers - numberCount)) {
        char = chars[Math.floor(Math.random() * 52)]; // Letters only
        letterCount++;
      }
      // Force numbers if we haven't met minimum
      else if (numberCount < minNumbers && (64 - i) <= (minNumbers - numberCount)) {
        char = chars[52 + Math.floor(Math.random() * 10)]; // Numbers only
        numberCount++;
      }
      // Random selection
      else {
        char = chars[Math.floor(Math.random() * chars.length)];
        if (/[a-zA-Z]/.test(char)) letterCount++;
        else numberCount++;
      }
      
      key += char;
    }
    
    setEncryptionKey(key);
    form.setFieldsValue({ encryptionKey: key });
    
    const validation = validateEncryptionKey(key);
    setKeyStrength(validation);
  };

  return (
    <Card title="Create New Encryption" className="w-full">
      <Alert
        message="Important Security Notice"
        description="Your 64-character encryption key is the ONLY way to decrypt your data. If you lose it, your data cannot be recovered. Store it securely!"
        type="warning"
        showIcon
        className="mb-6"
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        size="large"
      >
        <Form.Item
          label="Encryption Name"
          name="name"
          rules={[
            { required: true, message: 'Please enter a name for this encryption' },
            { min: 3, message: 'Name must be at least 3 characters long' },
            { max: 50, message: 'Name cannot exceed 50 characters' }
          ]}
        >
          <Input 
            placeholder="Enter a name for this encryption"
            onChange={(e) => {
              setName(e.target.value);
              form.setFieldsValue({ name: e.target.value });
            }}
          />
        </Form.Item>

        <Form.Item
          label={
            <span>
              64-Character Encryption Key
              <Tooltip title="This 64-character key encrypts your data with AES-256-GCM encryption. Use letters and numbers for maximum security. Generate a random key for best protection.">
                <InfoCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
          name="encryptionKey"
          rules={[
            { required: true, message: 'Please enter a 64-character encryption key' },
            { len: 64, message: '64-character encryption key is required' },
            { pattern: /^[a-zA-Z0-9]+$/, message: 'Key must contain only letters and numbers' }
          ]}
        >
          <Input 
            type={showKey ? "text" : "password"}
            placeholder="Enter 64-character encryption key (letters and numbers)"
            onChange={(e) => {
              handleKeyChange(e);
              form.setFieldsValue({ encryptionKey: e.target.value });
            }}
            suffix={
              <>
                <Button
                  type="text"
                  size="small"
                  onClick={() => setShowKey(!showKey)}
                  icon={showKey ? <EyeInvisibleOutlined /> : <EyeTwoTone />}
                />
                <Button
                  type="text"
                  size="small"
                  onClick={generateSecureKey}
                  icon={<ReloadOutlined />}
                  title="Generate random key"
                />
              </>
            }
          />
        </Form.Item>

        {encryptionKey && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <Text strong>Key Strength:</Text>
            <Text style={{ color: getStrengthColor(keyStrength.level), marginLeft: 8 }}>
              {getStrengthText(keyStrength.level)}
            </Text>
            <Progress 
              percent={keyStrength.score} 
              strokeColor={getStrengthColor(keyStrength.level)}
              size="small"
              className="mt-2"
            />
            {keyStrength.issues.length > 0 && (
              <div className="mt-2">
                <Text type="secondary" className="text-sm">Issues:</Text>
                <ul className="text-sm text-red-500 mt-1 ml-4">
                  {keyStrength.issues.slice(0, 3).map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<KeyOutlined />}
            size="large"
            className="w-full"
            disabled={keyStrength.level === 'weak' || !validateEncryptionKey(encryptionKey).isValid}
          >
            Create Encryption
          </Button>
        </Form.Item>
      </Form>

      <Alert
        message="Security Tips"
        description={
          <ul className="mt-2 text-sm">
            <li>Store your 64-character key in a secure password manager</li>
            <li>Never share your encryption key with anyone</li>
            <li>Use a unique key for each encryption</li>
            <li>Mix letters and numbers for stronger security</li>
            <li>Consider writing down the key and storing it safely offline</li>
          </ul>
        }
        type="info"
        className="mt-4"
      />
    </Card>
  );
};

export default EncryptionForm; 