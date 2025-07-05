import {
  signIn,
  signUp,
  confirmSignUp,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  resetPassword,
  confirmResetPassword,
  updatePassword,
  updateUserAttributes,
} from 'aws-amplify/auth';

import type {
  LoginCredentials,
  RegisterCredentials,
  ConfirmSignUpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
  CognitoUser,
} from '@/types/auth';

export class CognitoAuthService {
  async login(credentials: LoginCredentials) {
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: credentials.email,
        password: credentials.password,
      });

      if (isSignedIn) {
        const user = await this.getCurrentUser();
        return { user, nextStep };
      }

      return { user: null, nextStep };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(credentials: RegisterCredentials) {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: credentials.email,
        password: credentials.password,
        options: {
          userAttributes: {
            email: credentials.email,
            given_name: credentials.givenName,
            family_name: credentials.familyName,
          },
        },
      });

      return { isSignUpComplete, userId, nextStep };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async confirmSignUp(input: ConfirmSignUpInput) {
    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: input.email,
        confirmationCode: input.confirmationCode,
      });

      return { isSignUpComplete, nextStep };
    } catch (error) {
      console.error('Confirm sign up error:', error);
      throw error;
    }
  }

  async forgotPassword(input: ForgotPasswordInput) {
    try {
      const { nextStep } = await resetPassword({
        username: input.email,
      });

      return { nextStep };
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(input: ResetPasswordInput) {
    try {
      await confirmResetPassword({
        username: input.email,
        confirmationCode: input.confirmationCode,
        newPassword: input.newPassword,
      });
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async changePassword(input: ChangePasswordInput) {
    try {
      await updatePassword({
        oldPassword: input.oldPassword,
        newPassword: input.newPassword,
      });
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  async updateProfile(input: UpdateProfileInput) {
    try {
      const attributes: Record<string, string> = {};

      if (input.givenName) attributes.given_name = input.givenName;
      if (input.familyName) attributes.family_name = input.familyName;
      if (input.picture) attributes.picture = input.picture;

      await updateUserAttributes({
        userAttributes: attributes,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<CognitoUser | null> {
    try {
      const { username } = await getCurrentUser();
      const session = await fetchAuthSession();

      if (!session.tokens?.idToken) {
        return null;
      }

      const idTokenPayload = session.tokens?.idToken?.payload as Record<
        string,
        unknown
      >;

      return {
        sub: username,
        email: (idTokenPayload.email as string) || '',
        email_verified: (idTokenPayload.email_verified as boolean) || false,
        preferred_username: idTokenPayload.preferred_username as
          | string
          | undefined,
        given_name: idTokenPayload.given_name as string | undefined,
        family_name: idTokenPayload.family_name as string | undefined,
        picture: idTokenPayload.picture as string | undefined,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async getTokens() {
    try {
      const session = await fetchAuthSession();

      return {
        accessToken: session.tokens?.accessToken?.toString() || null,
        idToken: session.tokens?.idToken?.toString() || null,
        refreshToken: null, // Refresh token not available in tokens object
      };
    } catch (error) {
      console.error('Get tokens error:', error);
      return {
        accessToken: null,
        idToken: null,
        refreshToken: null,
      };
    }
  }

  async refreshSession() {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      return session.tokens !== undefined;
    } catch (error) {
      console.error('Refresh session error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cognitoAuthService = new CognitoAuthService();
