import { ApiClient } from '@/lib/api/client';

// Mock constants
jest.mock('@/lib/constants', () => ({
  API_CONFIG: {
    baseUrl: 'http://localhost:8080',
  },
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
  ERROR_MESSAGES: {
    networkError: 'ネットワークエラーが発生しました',
    unauthorizedError: '認証が必要です',
    forbiddenError: 'アクセス権限がありません',
    notFoundError: 'データが見つかりません',
    validationError: '入力内容を確認してください',
    unknownError: '不明なエラーが発生しました',
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient({ baseUrl: 'https://api.test.com' });
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('initializes with default config', () => {
      const client = new ApiClient();
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('initializes with custom config', () => {
      const client = new ApiClient({ baseUrl: 'https://api.example.com' });
      expect(client).toBeInstanceOf(ApiClient);
    });
  });

  describe('setAccessToken', () => {
    it('sets access token', () => {
      apiClient.setAccessToken('test-token');
      // The token will be tested through requests
    });

    it('handles null token', () => {
      apiClient.setAccessToken(null);
      // Should not throw
    });
  });

  describe('GET requests', () => {
    it('makes a successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await apiClient.get('/test');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('includes query parameters', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiClient.get('/test', { page: 1, limit: 10 });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test?page=1&limit=10',
        expect.any(Object)
      );
    });

    it('includes authorization header when token is set', async () => {
      const token = 'test-token';
      apiClient.setAccessToken(token);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiClient.get('/test');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
    });
  });

  describe('POST requests', () => {
    it('makes a successful POST request', async () => {
      const mockData = { id: 1 };
      const postData = { name: 'Test' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockData,
      });

      const result = await apiClient.post('/test', postData);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(postData),
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('PUT requests', () => {
    it('makes a successful PUT request', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const putData = { name: 'Updated' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await apiClient.put('/test/1', putData);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(putData),
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('DELETE requests', () => {
    it('makes a successful DELETE request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiClient.delete('/test/1');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual({});
    });
  });

  describe('Error handling', () => {
    it('handles 401 Unauthorized error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Unauthorized');
    });

    it('handles 404 Not Found error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found', code: 'NOT_FOUND' }),
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Not found');
    });

    it('handles network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });

    it('handles 204 No Content response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiClient.get('/test');
      expect(result).toEqual({});
    });

    it('handles errors with invalid JSON response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(apiClient.get('/test')).rejects.toThrow();
    });
  });
});
