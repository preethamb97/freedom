import React, { useEffect } from 'react';
import { Layout, Card, Typography, Spin } from 'antd';
import { GoogleOutlined, LockOutlined } from '@ant-design/icons';
import Button from '../atoms/Button';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../services/firebase';
import { trackEngagement } from '../utils/seoHelpers';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const LandingPage = () => {
  const { signIn, loading } = useAuth();

  // Track landing page interactions
  useEffect(() => {
    // Track page load
    trackEvent('landing_page_loaded', {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`
    });

    // Track time spent on page
    const startTime = Date.now();
    
    return () => {
      const timeSpent = Date.now() - startTime;
      trackEngagement('landing_page_time_spent', {
        duration_seconds: Math.round(timeSpent / 1000),
        duration_ms: timeSpent
      });
    };
  }, []);

  const handleSignInClick = () => {
    // Track sign-in button click
    trackEvent('sign_in_button_clicked', {
      page: 'landing',
      button_location: 'main_cta',
      timestamp: new Date().toISOString()
    });
    
    signIn();
  };

  const handleFeatureInteraction = (feature) => {
    trackEngagement('feature_viewed', {
      feature_name: feature,
      page: 'landing'
    });
  };

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Content className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-xl">
          <div className="text-center space-y-6">
            <header className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-primary bg-opacity-10 p-4 rounded-full">
                  <LockOutlined className="text-4xl text-primary" />
                </div>
              </div>
              
              <Title level={1} className="mb-2" style={{ fontSize: '1.75rem' }}>
                Freedom
              </Title>
              
              <Title level={2} className="mb-2" style={{ fontSize: '1.25rem', fontWeight: 'normal' }}>
                Secure AES-256 Encrypted Data Storage
              </Title>
              
              <Paragraph className="text-gray-600">
                Protect your sensitive data with military-grade AES-256-GCM encryption. Store and manage encrypted information with complete privacy using 64-character encryption keys. Your data remains secure with zero-knowledge architecture.
              </Paragraph>
            </header>

            <section className="space-y-4">
              <div 
                className="bg-gray-50 p-4 rounded-lg text-left"
                onMouseEnter={() => handleFeatureInteraction('security_features')}
              >
                <Title level={3} className="mb-2" style={{ fontSize: '1.1rem' }}>Security Features:</Title>
                <ul className="space-y-1 text-sm text-gray-600" role="list">
                  <li 
                    onMouseEnter={() => handleFeatureInteraction('aes_256_encryption')}
                  >
                    • <strong>AES-256-GCM encryption</strong> - Military-grade security
                  </li>
                  <li 
                    onMouseEnter={() => handleFeatureInteraction('64_char_keys')}
                  >
                    • <strong>64-character alphanumeric keys</strong> - Maximum protection
                  </li>
                  <li 
                    onMouseEnter={() => handleFeatureInteraction('zero_knowledge')}
                  >
                    • <strong>Zero-knowledge architecture</strong> - Complete privacy
                  </li>
                  <li 
                    onMouseEnter={() => handleFeatureInteraction('rate_limiting')}
                  >
                    • <strong>Rate limiting protection</strong> - Brute-force prevention
                  </li>
                  <li 
                    onMouseEnter={() => handleFeatureInteraction('end_to_end_encryption')}
                  >
                    • <strong>End-to-end encryption</strong> - Data never exposed
                  </li>
                </ul>
              </div>

              {loading ? (
                <div className="py-4">
                  <Spin size="large" tip="Signing in..." />
                </div>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  icon={<GoogleOutlined />}
                  onClick={handleSignInClick}
                  className="w-full h-12"
                  aria-label="Sign in with Google to access Freedom encrypted storage"
                  onMouseEnter={() => handleFeatureInteraction('sign_in_button_hover')}
                >
                  Sign in with Google
                </Button>
              )}
            </section>

            <footer>
            <Paragraph className="text-xs text-gray-500">
              By signing in, you agree to our secure data handling practices. 
                Your data is encrypted with AES-256 and only accessible with your unique 64-character encryption key.
                <br />
                <strong>Freedom</strong> - Where privacy meets security.
            </Paragraph>
            </footer>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default LandingPage; 