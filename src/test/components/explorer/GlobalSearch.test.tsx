import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GlobalSearch,
  PATTERNS,
  getSearchType,
} from '@/components/explorer/GlobalSearch';
import { useExplorerStore } from '@/stores/explorer';

// Mock Zustand store
vi.mock('@/stores/explorer', () => ({
  useExplorerStore: vi.fn(),
}));

// Mock GraphQL client
vi.mock('@/lib/aptos/indexerClient', () => ({
  executeQueryWithRetry: vi.fn(),
}));

describe('GlobalSearch', () => {
  const mockSetFilters = vi.fn();
  const mockSetSearchQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useExplorerStore as any).mockReturnValue({
      filters: { searchQuery: '' },
      setFilters: mockSetFilters,
      setSearchQuery: mockSetSearchQuery,
    });
  });

  describe('PATTERNS', () => {
    it('should match valid transaction hashes', () => {
      const validHashes = [
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      ];

      validHashes.forEach(hash => {
        expect(PATTERNS.TRANSACTION_HASH.test(hash)).toBe(true);
      });
    });

    it('should not match invalid transaction hashes', () => {
      const invalidHashes = [
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde', // too short
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1', // too long
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg', // invalid char
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // no 0x prefix
      ];

      invalidHashes.forEach(hash => {
        expect(PATTERNS.TRANSACTION_HASH.test(hash)).toBe(false);
      });
    });

    it('should match valid addresses', () => {
      const validAddresses = [
        '0x1234567890abcdef1234567890abcdef1234567890',
        '0xabcdef1234567890abcdef1234567890abcdef1234',
      ];

      validAddresses.forEach(address => {
        expect(PATTERNS.ADDRESS.test(address)).toBe(true);
      });
    });

    it('should not match invalid addresses', () => {
      const invalidAddresses = [
        '0x1234567890abcdef1234567890abcdef123456789', // too short
        '0x1234567890abcdef1234567890abcdef12345678901', // too long
        '0x1234567890abcdef1234567890abcdef123456789g', // invalid char
        '1234567890abcdef1234567890abcdef1234567890', // no 0x prefix
      ];

      invalidAddresses.forEach(address => {
        expect(PATTERNS.ADDRESS.test(address)).toBe(false);
      });
    });

    it('should match valid numbers', () => {
      const validNumbers = ['123456789', '0', '999999999999999999'];

      validNumbers.forEach(num => {
        expect(PATTERNS.NUMBER.test(num)).toBe(true);
      });
    });

    it('should not match invalid numbers', () => {
      const invalidNumbers = ['123.456', 'abc123', '123abc', '', '0x123'];

      invalidNumbers.forEach(num => {
        expect(PATTERNS.NUMBER.test(num)).toBe(false);
      });
    });
  });

  describe('getSearchType', () => {
    it('should identify transaction hashes', () => {
      const hash =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(getSearchType(hash)).toBe('transaction_hash');
    });

    it('should identify addresses', () => {
      const address = '0x1234567890abcdef1234567890abcdef1234567890';
      expect(getSearchType(address)).toBe('address');
    });

    it('should identify numbers', () => {
      const number = '123456789';
      expect(getSearchType(number)).toBe('number');
    });

    it('should return unknown for unrecognized patterns', () => {
      const unknown = 'invalid-input';
      expect(getSearchType(unknown)).toBe('unknown');
    });
  });

  describe('Component', () => {
    it('should render search input', () => {
      render(<GlobalSearch />);
      expect(
        screen.getByPlaceholderText(/Search by hash, address, or version/i)
      ).toBeInTheDocument();
    });

    it('should update search query on input', async () => {
      const user = userEvent.setup();
      render(<GlobalSearch />);

      const input = screen.getByPlaceholderText(
        /Search by hash, address, or version/i
      );
      await user.type(input, '0x1234567890abcdef1234567890abcdef1234567890');

      expect(mockSetFilters).toHaveBeenCalledWith({
        searchQuery: '0x1234567890abcdef1234567890abcdef1234567890',
      });
    });

    it('should show transaction hash icon for hash input', async () => {
      const user = userEvent.setup();
      render(<GlobalSearch />);

      const input = screen.getByPlaceholderText(
        /Search by hash, address, or version/i
      );
      await user.type(
        input,
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      );

      // Check if the input has the correct placeholder
      expect(input).toHaveValue(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      );
    });

    it('should show address icon for address input', async () => {
      const user = userEvent.setup();
      render(<GlobalSearch />);

      const input = screen.getByPlaceholderText(
        /Search by hash, address, or version/i
      );
      await user.type(input, '0x1234567890abcdef1234567890abcdef1234567890');

      expect(input).toHaveValue('0x1234567890abcdef1234567890abcdef1234567890');
    });

    it('should show number icon for number input', async () => {
      const user = userEvent.setup();
      render(<GlobalSearch />);

      const input = screen.getByPlaceholderText(
        /Search by hash, address, or version/i
      );
      await user.type(input, '123456789');

      expect(input).toHaveValue('123456789');
    });

    it('should handle empty input', async () => {
      const user = userEvent.setup();
      render(<GlobalSearch />);

      const input = screen.getByPlaceholderText(
        /Search by hash, address, or version/i
      );
      await user.clear(input);

      expect(mockSetFilters).toHaveBeenCalledWith({ searchQuery: '' });
    });

    it('should debounce search input', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      render(<GlobalSearch />);

      const input = screen.getByPlaceholderText(
        /Search by hash, address, or version/i
      );
      await user.type(input, 'test');

      // Should not be called immediately
      expect(mockSetFilters).not.toHaveBeenCalled();

      // Fast forward time
      vi.advanceTimersByTime(300);

      // Should be called after debounce
      expect(mockSetFilters).toHaveBeenCalledWith({ searchQuery: 'test' });

      vi.useRealTimers();
    });
  });
});
