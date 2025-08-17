import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  GlobalSearch,
  getSearchType,
  PATTERNS,
} from '@/components/explorer/GlobalSearch';
import { useExplorerStore } from '@/stores/explorer';
import { executeQueryWithRetry } from '@/lib/aptos/indexerClient';

// Мокаем зависимости
jest.mock('@/stores/explorer');
jest.mock('@/lib/aptos/indexerClient');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockUseExplorerStore = useExplorerStore as jest.MockedFunction<
  typeof useExplorerStore
>;
const mockExecuteQueryWithRetry = executeQueryWithRetry as jest.MockedFunction<
  typeof executeQueryWithRetry
>;

describe('GlobalSearch', () => {
  beforeEach(() => {
    mockUseExplorerStore.mockReturnValue({
      setFilters: jest.fn(),
      filters: { searchQuery: '' },
      network: 'mainnet',
      setNetwork: jest.fn(),
      resetFilters: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
      cache: {},
      setCache: jest.fn(),
      getCache: jest.fn(),
      clearCache: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PATTERNS', () => {
    describe('TRANSACTION_HASH', () => {
      it('должен соответствовать полному хэшу транзакции', () => {
        const validHash =
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        expect(PATTERNS.TRANSACTION_HASH.test(validHash)).toBe(true);
      });

      it('не должен соответствовать неполному хэшу', () => {
        const invalidHash = '0x1234567890abcdef';
        expect(PATTERNS.TRANSACTION_HASH.test(invalidHash)).toBe(false);
      });

      it('не должен соответствовать хэшу без 0x', () => {
        const invalidHash =
          '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        expect(PATTERNS.TRANSACTION_HASH.test(invalidHash)).toBe(false);
      });

      it('не должен соответствовать хэшу с неверными символами', () => {
        const invalidHash =
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg';
        expect(PATTERNS.TRANSACTION_HASH.test(invalidHash)).toBe(false);
      });
    });

    describe('ADDRESS', () => {
      it('должен соответствовать валидному адресу', () => {
        const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
        expect(PATTERNS.ADDRESS.test(validAddress)).toBe(true);
      });

      it('должен соответствовать длинному адресу', () => {
        const longAddress =
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        expect(PATTERNS.ADDRESS.test(longAddress)).toBe(true);
      });

      it('не должен соответствовать короткому адресу', () => {
        const shortAddress = '0x1234567890';
        expect(PATTERNS.ADDRESS.test(shortAddress)).toBe(false);
      });

      it('не должен соответствовать адресу без 0x', () => {
        const invalidAddress = '1234567890abcdef1234567890abcdef12345678';
        expect(PATTERNS.ADDRESS.test(invalidAddress)).toBe(false);
      });
    });

    describe('VERSION_OR_HEIGHT', () => {
      it('должен соответствовать числу', () => {
        expect(PATTERNS.VERSION_OR_HEIGHT.test('123456789')).toBe(true);
        expect(PATTERNS.VERSION_OR_HEIGHT.test('0')).toBe(true);
        expect(PATTERNS.VERSION_OR_HEIGHT.test('999999999')).toBe(true);
      });

      it('не должен соответствовать строке с буквами', () => {
        expect(PATTERNS.VERSION_OR_HEIGHT.test('123abc')).toBe(false);
        expect(PATTERNS.VERSION_OR_HEIGHT.test('abc123')).toBe(false);
        expect(PATTERNS.VERSION_OR_HEIGHT.test('abc')).toBe(false);
      });

      it('не должен соответствовать пустой строке', () => {
        expect(PATTERNS.VERSION_OR_HEIGHT.test('')).toBe(false);
      });
    });

    describe('PARTIAL_HASH', () => {
      it('должен соответствовать частичному хэшу', () => {
        expect(PATTERNS.PARTIAL_HASH.test('0x12345678')).toBe(true);
        expect(PATTERNS.PARTIAL_HASH.test('0x1234567890abcdef')).toBe(true);
      });

      it('не должен соответствовать короткому хэшу', () => {
        expect(PATTERNS.PARTIAL_HASH.test('0x1234567')).toBe(false);
      });

      it('не должен соответствовать хэшу без 0x', () => {
        expect(PATTERNS.PARTIAL_HASH.test('12345678')).toBe(false);
      });
    });
  });

  describe('getSearchType', () => {
    it('должен определять тип транзакции для полного хэша', () => {
      const hash =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(getSearchType(hash)).toBe('transaction');
    });

    it('должен определять тип версии для больших чисел', () => {
      expect(getSearchType('1234567890')).toBe('version');
      expect(getSearchType('9999999999')).toBe('version');
    });

    it('должен определять тип блока для меньших чисел', () => {
      expect(getSearchType('123')).toBe('block');
      expect(getSearchType('999999')).toBe('block');
    });

    it('должен определять тип адреса для валидного адреса', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      expect(getSearchType(address)).toBe('address');
    });

    it('должен определять тип транзакции для частичного хэша', () => {
      const partialHash = '0x12345678';
      expect(getSearchType(partialHash)).toBe('transaction');
    });

    it('должен возвращать unknown для невалидного ввода', () => {
      expect(getSearchType('invalid')).toBe('unknown');
      expect(getSearchType('')).toBe('unknown');
      expect(getSearchType('   ')).toBe('unknown');
    });
  });

  describe('Компонент GlobalSearch', () => {
    it('должен рендериться с правильным placeholder', () => {
      render(<GlobalSearch />);
      expect(
        screen.getByPlaceholderText(
          /Search by hash, address, version, or block height/
        )
      ).toBeInTheDocument();
    });

    it('должен изменять placeholder при вводе хэша', async () => {
      render(<GlobalSearch />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, {
        target: {
          value:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Search by transaction hash/)
        ).toBeInTheDocument();
      });
    });

    it('должен изменять placeholder при вводе адреса', async () => {
      render(<GlobalSearch />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, {
        target: { value: '0x1234567890abcdef1234567890abcdef12345678' },
      });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Search by address/)
        ).toBeInTheDocument();
      });
    });

    it('должен изменять placeholder при вводе числа', async () => {
      render(<GlobalSearch />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '1234567890' } });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Search by version number/)
        ).toBeInTheDocument();
      });
    });

    it('должен выполнять поиск транзакции при вводе хэша', async () => {
      mockExecuteQueryWithRetry.mockResolvedValue({
        transactions: [
          {
            hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          },
        ],
      });

      render(<GlobalSearch />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, {
        target: {
          value:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      });

      await waitFor(() => {
        expect(mockExecuteQueryWithRetry).toHaveBeenCalledWith(
          expect.stringContaining('TransactionByHash'),
          {
            hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          }
        );
      });
    });

    it('должен выполнять поиск версии при вводе большого числа', async () => {
      mockExecuteQueryWithRetry.mockResolvedValue({
        transactions: [{ version: '1234567890' }],
      });

      render(<GlobalSearch />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '1234567890' } });

      await waitFor(() => {
        expect(mockExecuteQueryWithRetry).toHaveBeenCalledWith(
          expect.stringContaining('TransactionByVersion'),
          { version: 1234567890 }
        );
      });
    });

    it('должен выполнять поиск адреса при вводе адреса', async () => {
      mockExecuteQueryWithRetry.mockResolvedValue({
        transactions: [
          { sender: '0x1234567890abcdef1234567890abcdef12345678' },
        ],
      });

      render(<GlobalSearch />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, {
        target: { value: '0x1234567890abcdef1234567890abcdef12345678' },
      });

      await waitFor(() => {
        expect(mockExecuteQueryWithRetry).toHaveBeenCalledWith(
          expect.stringContaining('AccountTransactions'),
          { address: '0x1234567890abcdef1234567890abcdef12345678', limit: 1 }
        );
      });
    });

    it('должен показывать статус "Found" при успешном поиске', async () => {
      mockExecuteQueryWithRetry.mockResolvedValue({
        transactions: [
          {
            hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          },
        ],
      });

      render(<GlobalSearch />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, {
        target: {
          value:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Found')).toBeInTheDocument();
      });
    });

    it('должен показывать статус "Not found" при неуспешном поиске', async () => {
      mockExecuteQueryWithRetry.mockResolvedValue({
        transactions: [],
      });

      render(<GlobalSearch />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, {
        target: {
          value:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Not found')).toBeInTheDocument();
      });
    });

    it('должен показывать ошибку при сбое запроса', async () => {
      mockExecuteQueryWithRetry.mockRejectedValue(new Error('Network error'));

      render(<GlobalSearch />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, {
        target: {
          value:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Search failed')).toBeInTheDocument();
      });
    });

    it('должен быть отключен при невалидном вводе', () => {
      render(<GlobalSearch />);
      const searchButton = screen.getByRole('button', { name: /search/i });
      expect(searchButton).toBeDisabled();
    });

    it('должен быть активен при валидном вводе', async () => {
      mockExecuteQueryWithRetry.mockResolvedValue({
        transactions: [
          {
            hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          },
        ],
      });

      render(<GlobalSearch />);
      const input = screen.getByRole('textbox');
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(input, {
        target: {
          value:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      });

      await waitFor(() => {
        expect(searchButton).not.toBeDisabled();
      });
    });
  });
});
