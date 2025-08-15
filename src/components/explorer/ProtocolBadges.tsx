"use client";

import { Badge } from '@/components/ui/badge';
import { 
  getProtocolByModule, 
  getProtocolByAddress, 
  getOperationByPayload,
  ProtocolType,
  OperationType,
  Protocol,
  Operation
} from '@/config/protocols';

interface ProtocolBadgeProps {
  moduleId?: string;
  address?: string;
  protocolType?: ProtocolType;
  className?: string;
}

interface OperationBadgeProps {
  payload?: any;
  operationType?: OperationType;
  className?: string;
}

interface ProtocolOperationBadgesProps {
  moduleId?: string;
  address?: string;
  payload?: any;
  className?: string;
}

// Компонент для отображения бейджа протокола
export function ProtocolBadge({ 
  moduleId, 
  address, 
  protocolType, 
  className = "" 
}: ProtocolBadgeProps) {
  let protocol: Protocol;
  
  if (protocolType) {
    // Если передан тип протокола напрямую
    protocol = getProtocolByAddress(protocolType);
  } else if (moduleId) {
    // Определяем по модулю
    protocol = getProtocolByModule(moduleId);
  } else if (address) {
    // Определяем по адресу
    protocol = getProtocolByAddress(address);
  } else {
    protocol = getProtocolByAddress('unknown');
  }

  return (
    <Badge 
      variant="secondary" 
      className={`${protocol.color} text-white hover:${protocol.color} ${className}`}
      title={protocol.description}
    >
      {protocol.displayName}
    </Badge>
  );
}

// Компонент для отображения бейджа операции
export function OperationBadge({ 
  payload, 
  operationType, 
  className = "" 
}: OperationBadgeProps) {
  let operation: Operation;
  
  if (operationType) {
    // Если передан тип операции напрямую
    operation = getOperationByPayload({ function: operationType });
  } else if (payload) {
    // Определяем по payload
    operation = getOperationByPayload(payload);
  } else {
    operation = getOperationByPayload({ function: 'unknown' });
  }

  return (
    <Badge 
      variant="outline" 
      className={`${operation.color} text-white border-${operation.color.replace('bg-', '')} hover:${operation.color} ${className}`}
      title={operation.description}
    >
      {operation.displayName}
    </Badge>
  );
}

// Компонент для отображения обоих бейджей (протокол + операция)
export function ProtocolOperationBadges({ 
  moduleId, 
  address, 
  payload, 
  className = "" 
}: ProtocolOperationBadgesProps) {
  const protocol = moduleId 
    ? getProtocolByModule(moduleId) 
    : address 
    ? getProtocolByAddress(address) 
    : getProtocolByAddress('unknown');

  const operation = payload 
    ? getOperationByPayload(payload) 
    : getOperationByPayload({ function: 'unknown' });

  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <ProtocolBadge 
        moduleId={moduleId} 
        address={address} 
        className="text-xs"
      />
      <OperationBadge 
        payload={payload} 
        className="text-xs"
      />
    </div>
  );
}

// Компонент для отображения только протокола (компактный)
export function CompactProtocolBadge({ 
  moduleId, 
  address, 
  protocolType, 
  className = "" 
}: ProtocolBadgeProps) {
  let protocol: Protocol;
  
  if (protocolType) {
    protocol = getProtocolByAddress(protocolType);
  } else if (moduleId) {
    protocol = getProtocolByModule(moduleId);
  } else if (address) {
    protocol = getProtocolByAddress(address);
  } else {
    protocol = getProtocolByAddress('unknown');
  }

  return (
    <Badge 
      variant="outline" 
      className={`${protocol.color} text-white border-${protocol.color.replace('bg-', '')} text-xs px-2 py-0.5 ${className}`}
      title={protocol.description}
    >
      {protocol.displayName}
    </Badge>
  );
}

// Компонент для отображения только операции (компактный)
export function CompactOperationBadge({ 
  payload, 
  operationType, 
  className = "" 
}: OperationBadgeProps) {
  let operation: Operation;
  
  if (operationType) {
    operation = getOperationByPayload({ function: operationType });
  } else if (payload) {
    operation = getOperationByPayload(payload);
  } else {
    operation = getOperationByPayload({ function: 'unknown' });
  }

  return (
    <Badge 
      variant="outline" 
      className={`${operation.color} text-white border-${operation.color.replace('bg-', '')} text-xs px-2 py-0.5 ${className}`}
      title={operation.description}
    >
      {operation.displayName}
    </Badge>
  );
}

// Компонент для отображения протокола с иконкой
export function ProtocolBadgeWithIcon({ 
  moduleId, 
  address, 
  protocolType, 
  className = "" 
}: ProtocolBadgeProps) {
  let protocol: Protocol;
  
  if (protocolType) {
    protocol = getProtocolByAddress(protocolType);
  } else if (moduleId) {
    protocol = getProtocolByModule(moduleId);
  } else if (address) {
    protocol = getProtocolByAddress(address);
  } else {
    protocol = getProtocolByAddress('unknown');
  }

  // Иконки для протоколов (можно расширить)
  const getProtocolIcon = (type: ProtocolType) => {
    switch (type) {
      case 'amnis':
        return '🔵';
      case 'auro':
        return '🟣';
      case 'echelon':
        return '🟢';
      case 'hyperion':
        return '🟠';
      case 'joule':
        return '🟡';
      case 'tapp':
        return '🔴';
      case 'aries':
        return '🟦';
      case 'meso':
        return '🩷';
      case 'panora':
        return '🩵';
      case 'aptos':
        return '⚫';
      default:
        return '❓';
    }
  };

  return (
    <Badge 
      variant="secondary" 
      className={`${protocol.color} text-white hover:${protocol.color} ${className}`}
      title={protocol.description}
    >
      <span className="mr-1">{getProtocolIcon(protocol.type)}</span>
      {protocol.displayName}
    </Badge>
  );
}

// Компонент для отображения операции с иконкой
export function OperationBadgeWithIcon({ 
  payload, 
  operationType, 
  className = "" 
}: OperationBadgeProps) {
  let operation: Operation;
  
  if (operationType) {
    operation = getOperationByPayload({ function: operationType });
  } else if (payload) {
    operation = getOperationByPayload(payload);
  } else {
    operation = getOperationByPayload({ function: 'unknown' });
  }

  // Иконки для операций
  const getOperationIcon = (type: OperationType) => {
    switch (type) {
      case 'deposit':
        return '📥';
      case 'withdraw':
        return '📤';
      case 'swap':
        return '🔄';
      case 'stake':
        return '🔒';
      case 'unstake':
        return '🔓';
      case 'claim':
        return '🎁';
      case 'borrow':
        return '💳';
      case 'repay':
        return '💰';
      case 'liquidate':
        return '⚡';
      case 'transfer':
        return '➡️';
      case 'mint':
        return '🪙';
      case 'burn':
        return '🔥';
      case 'create_pool':
        return '🏊';
      case 'add_liquidity':
        return '➕';
      case 'remove_liquidity':
        return '➖';
      case 'vote':
        return '🗳️';
      case 'propose':
        return '📋';
      case 'execute':
        return '▶️';
      default:
        return '❓';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`${operation.color} text-white border-${operation.color.replace('bg-', '')} hover:${operation.color} ${className}`}
      title={operation.description}
    >
      <span className="mr-1">{getOperationIcon(operation.type)}</span>
      {operation.displayName}
    </Badge>
  );
}
