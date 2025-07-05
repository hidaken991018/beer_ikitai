import { Amplify } from 'aws-amplify';

import { COGNITO_CONFIG } from '@/lib/constants';
import type { AmplifyConfig } from '@/types/auth';

// Amplify configuration for AWS Cognito
const amplifyConfig: AmplifyConfig = {
  Auth: {
    Cognito: {
      region: COGNITO_CONFIG.region,
      userPoolId: COGNITO_CONFIG.userPoolId,
      userPoolClientId: COGNITO_CONFIG.userPoolWebClientId,
    },
  },
};

// Initialize Amplify with configuration
export function configureAmplify() {
  try {
    Amplify.configure(amplifyConfig);
    console.log('Amplify configured successfully');
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
    throw error;
  }
}

// Validate required configuration
export function validateAmplifyConfig(): boolean {
  const { region, userPoolId, userPoolWebClientId } = COGNITO_CONFIG;

  if (!region || !userPoolId || !userPoolWebClientId) {
    console.error('Missing required Cognito configuration:', {
      region: !!region,
      userPoolId: !!userPoolId,
      userPoolWebClientId: !!userPoolWebClientId,
    });
    return false;
  }

  return true;
}

// Get current Amplify configuration
export function getAmplifyConfig(): AmplifyConfig {
  return amplifyConfig;
}

export { amplifyConfig };
export default amplifyConfig;
