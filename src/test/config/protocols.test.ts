import { describe, it, expect } from 'vitest';
import {
  detectProtocolByModule,
  detectProtocolByAddress,
  detectOperationByPayload,
  getProtocolByModule,
  getProtocolByAddress,
  getOperationByPayload,
  isProtocolAddress,
  isProtocolModule,
  getProtocolColor,
  getOperationColor,
} from '@/config/protocols';

describe('Protocol Detection', () => {
  describe('detectProtocolByModule', () => {
    it('should detect Amnis protocol', () => {
      const moduleId = '0x111ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::amnis::stake';
      expect(detectProtocolByModule(moduleId)).toBe('amnis');
    });

    it('should detect Auro protocol', () => {
      const moduleId = '0x222ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::auro::staking';
      expect(detectProtocolByModule(moduleId)).toBe('auro');
    });

    it('should detect Echelon protocol', () => {
      const moduleId = '0x333ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::echelon::lending';
      expect(detectProtocolByModule(moduleId)).toBe('echelon');
    });

    it('should detect Hyperion protocol', () => {
      const moduleId = '0x444ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::hyperion::swap';
      expect(detectProtocolByModule(moduleId)).toBe('hyperion');
    });

    it('should return unknown for unrecognized modules', () => {
      const moduleId = '0x999::unknown::function';
      expect(detectProtocolByModule(moduleId)).toBe('unknown');
    });

    it('should be case insensitive', () => {
      const moduleId = '0x111AE3E5BC36A301611D2B0109D4E6B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B::AMNIS::STAKE';
      expect(detectProtocolByModule(moduleId)).toBe('amnis');
    });
  });

  describe('detectProtocolByAddress', () => {
    it('should detect Amnis address', () => {
      const address = '0x111ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b';
      expect(detectProtocolByAddress(address)).toBe('amnis');
    });

    it('should detect Auro address', () => {
      const address = '0x222ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b';
      expect(detectProtocolByAddress(address)).toBe('auro');
    });

    it('should return unknown for unrecognized addresses', () => {
      const address = '0x9999999999999999999999999999999999999999999999999999999999999999';
      expect(detectProtocolByAddress(address)).toBe('unknown');
    });

    it('should be case insensitive', () => {
      const address = '0x111AE3E5BC36A301611D2B0109D4E6B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B';
      expect(detectProtocolByAddress(address)).toBe('amnis');
    });
  });

  describe('detectOperationByPayload', () => {
    it('should detect deposit operations', () => {
      const payload = { function: '0x1::coin::deposit' };
      expect(detectOperationByPayload(payload)).toBe('deposit');
    });

    it('should detect withdraw operations', () => {
      const payload = { function: '0x1::coin::withdraw' };
      expect(detectOperationByPayload(payload)).toBe('withdraw');
    });

    it('should detect swap operations', () => {
      const payload = { function: '0x1::dex::swap' };
      expect(detectOperationByPayload(payload)).toBe('swap');
    });

    it('should detect stake operations', () => {
      const payload = { function: '0x1::staking::stake' };
      expect(detectOperationByPayload(payload)).toBe('stake');
    });

    it('should detect unstake operations', () => {
      const payload = { function: '0x1::staking::unstake' };
      expect(detectOperationByPayload(payload)).toBe('unstake');
    });

    it('should detect claim operations', () => {
      const payload = { function: '0x1::rewards::claim' };
      expect(detectOperationByPayload(payload)).toBe('claim');
    });

    it('should detect borrow operations', () => {
      const payload = { function: '0x1::lending::borrow' };
      expect(detectOperationByPayload(payload)).toBe('borrow');
    });

    it('should detect repay operations', () => {
      const payload = { function: '0x1::lending::repay' };
      expect(detectOperationByPayload(payload)).toBe('repay');
    });

    it('should detect transfer operations', () => {
      const payload = { function: '0x1::coin::transfer' };
      expect(detectOperationByPayload(payload)).toBe('transfer');
    });

    it('should return unknown for unrecognized operations', () => {
      const payload = { function: '0x1::unknown::function' };
      expect(detectOperationByPayload(payload)).toBe('unknown');
    });

    it('should handle null/undefined payload', () => {
      expect(detectOperationByPayload(null)).toBe('unknown');
      expect(detectOperationByPayload(undefined)).toBe('unknown');
      expect(detectOperationByPayload({})).toBe('unknown');
    });

    it('should be case insensitive', () => {
      const payload = { function: '0x1::COIN::DEPOSIT' };
      expect(detectOperationByPayload(payload)).toBe('deposit');
    });
  });

  describe('Utility Functions', () => {
    it('should get protocol by module', () => {
      const moduleId = '0x111ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::amnis::stake';
      const protocol = getProtocolByModule(moduleId);
      expect(protocol.type).toBe('amnis');
      expect(protocol.displayName).toBe('Amnis');
    });

    it('should get protocol by address', () => {
      const address = '0x111ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b';
      const protocol = getProtocolByAddress(address);
      expect(protocol.type).toBe('amnis');
      expect(protocol.displayName).toBe('Amnis');
    });

    it('should get operation by payload', () => {
      const payload = { function: '0x1::coin::deposit' };
      const operation = getOperationByPayload(payload);
      expect(operation.type).toBe('deposit');
      expect(operation.displayName).toBe('Deposit');
    });

    it('should check if address is protocol', () => {
      const amnisAddress = '0x111ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b';
      const unknownAddress = '0x9999999999999999999999999999999999999999999999999999999999999999';
      
      expect(isProtocolAddress(amnisAddress)).toBe(true);
      expect(isProtocolAddress(unknownAddress)).toBe(false);
    });

    it('should check if module is protocol', () => {
      const amnisModule = '0x111ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::amnis::stake';
      const unknownModule = '0x999::unknown::function';
      
      expect(isProtocolModule(amnisModule)).toBe(true);
      expect(isProtocolModule(unknownModule)).toBe(false);
    });

    it('should get protocol color', () => {
      expect(getProtocolColor('amnis')).toBe('bg-blue-500');
      expect(getProtocolColor('auro')).toBe('bg-purple-500');
      expect(getProtocolColor('unknown')).toBe('bg-gray-400');
    });

    it('should get operation color', () => {
      expect(getOperationColor('deposit')).toBe('bg-green-500');
      expect(getOperationColor('withdraw')).toBe('bg-red-500');
      expect(getOperationColor('unknown')).toBe('bg-gray-400');
    });
  });
});
