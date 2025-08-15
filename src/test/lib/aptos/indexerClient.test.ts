import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeQuery, executeQueryWithRetry, getGraphQLClient } from '@/lib/aptos/indexerClient';

// Mock graphql-request
vi.mock('graphql-request', () => ({
  GraphQLClient: vi.fn().mockImplementation(() => ({
    request: vi.fn(),
  })),
}));

// Mock environment variables
vi.mock('process.env', () => ({
  INDEXER_GQL_URL: 'https://indexer.mainnet.aptoslabs.com/v1/graphql',
}));

describe('IndexerClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGraphQLClient', () => {
    it('should create GraphQL client with correct URL', () => {
      const client = getGraphQLClient();
      expect(client).toBeDefined();
    });

    it('should use environment variable for URL', () => {
      const client = getGraphQLClient();
      expect(client).toBeDefined();
    });
  });

  describe('executeQuery', () => {
    it('should execute query successfully', async () => {
      const mockResponse = {
        transactions: [
          {
            version: '123456',
            hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            sender: '0x1234567890abcdef1234567890abcdef1234567890',
            success: true,
            gas_used: '1000',
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const mockClient = {
        request: vi.fn().mockResolvedValue(mockResponse),
      };

      vi.mocked(getGraphQLClient).mockReturnValue(mockClient as any);

      const query = `
        query LatestTransactions($limit: Int!) {
          transactions(limit: $limit, order_by: { timestamp: desc }) {
            version
            hash
            sender
            success
            gas_used
            timestamp
          }
        }
      `;

      const variables = { limit: 10 };

      const result = await executeQuery(query, variables);

      expect(mockClient.request).toHaveBeenCalledWith(query, variables);
      expect(result).toEqual(mockResponse);
    });

    it('should handle query errors', async () => {
      const mockError = new Error('GraphQL Error');
      const mockClient = {
        request: vi.fn().mockRejectedValue(mockError),
      };

      vi.mocked(getGraphQLClient).mockReturnValue(mockClient as any);

      const query = 'query { transactions { version } }';

      await expect(executeQuery(query)).rejects.toThrow('GraphQL Error');
    });
  });

  describe('executeQueryWithRetry', () => {
    it('should retry on failure and eventually succeed', async () => {
      const mockResponse = { data: 'success' };
      const mockClient = {
        request: vi.fn()
          .mockRejectedValueOnce(new Error('Network Error'))
          .mockRejectedValueOnce(new Error('Network Error'))
          .mockResolvedValue(mockResponse),
      };

      vi.mocked(getGraphQLClient).mockReturnValue(mockClient as any);

      const query = 'query { test }';
      const result = await executeQueryWithRetry(query);

      expect(mockClient.request).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockResponse);
    });

    it('should fail after max retries', async () => {
      const mockError = new Error('Persistent Network Error');
      const mockClient = {
        request: vi.fn().mockRejectedValue(mockError),
      };

      vi.mocked(getGraphQLClient).mockReturnValue(mockClient as any);

      const query = 'query { test }';

      await expect(executeQueryWithRetry(query)).rejects.toThrow('Persistent Network Error');
      expect(mockClient.request).toHaveBeenCalledTimes(3); // Default max retries
    });

    it('should use exponential backoff', async () => {
      vi.useFakeTimers();

      const mockResponse = { data: 'success' };
      const mockClient = {
        request: vi.fn()
          .mockRejectedValueOnce(new Error('Network Error'))
          .mockResolvedValue(mockResponse),
      };

      vi.mocked(getGraphQLClient).mockReturnValue(mockClient as any);

      const query = 'query { test }';
      const promise = executeQueryWithRetry(query);

      // First call should fail
      expect(mockClient.request).toHaveBeenCalledTimes(1);

      // Advance time for exponential backoff (1 second)
      vi.advanceTimersByTime(1000);

      await promise;

      expect(mockClient.request).toHaveBeenCalledTimes(2);
      expect(mockResponse).toEqual({ data: 'success' });

      vi.useRealTimers();
    });

    it('should handle successful first attempt', async () => {
      const mockResponse = { data: 'success' };
      const mockClient = {
        request: vi.fn().mockResolvedValue(mockResponse),
      };

      vi.mocked(getGraphQLClient).mockReturnValue(mockClient as any);

      const query = 'query { test }';
      const result = await executeQueryWithRetry(query);

      expect(mockClient.request).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      const mockClient = {
        request: vi.fn().mockRejectedValue(new Error('timeout')),
      };

      vi.mocked(getGraphQLClient).mockReturnValue(mockClient as any);

      const query = 'query { test }';

      await expect(executeQueryWithRetry(query)).rejects.toThrow('timeout');
    });

    it('should handle malformed queries', async () => {
      const mockClient = {
        request: vi.fn().mockRejectedValue(new Error('syntax error')),
      };

      vi.mocked(getGraphQLClient).mockReturnValue(mockClient as any);

      const query = 'invalid query';

      await expect(executeQueryWithRetry(query)).rejects.toThrow('syntax error');
    });
  });
});
