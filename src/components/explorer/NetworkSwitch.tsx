'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useExplorerStore, type Network } from '@/stores/explorer';
import { Globe, Wifi, WifiOff } from 'lucide-react';

const networkConfig = {
  mainnet: {
    label: 'Mainnet',
    color: 'bg-green-500',
    icon: Wifi,
    description: 'Production network',
  },
  testnet: {
    label: 'Testnet',
    color: 'bg-yellow-500',
    icon: Wifi,
    description: 'Testing network',
  },
  devnet: {
    label: 'Devnet',
    color: 'bg-red-500',
    icon: WifiOff,
    description: 'Development network',
  },
};

export function NetworkSwitch() {
  const { network, setNetwork } = useExplorerStore();
  const config = networkConfig[network];

  return (
    <div className='flex items-center gap-3'>
      <div className='flex items-center gap-2'>
        <Globe className='h-4 w-4 text-muted-foreground' />
        <span className='text-sm font-medium text-muted-foreground'>
          Network:
        </span>
      </div>

      <Select
        value={network}
        onValueChange={(value: Network) => setNetwork(value)}
      >
        <SelectTrigger className='w-[180px]'>
          <SelectValue>
            <div className='flex items-center gap-2'>
              <Badge
                variant='secondary'
                className={`${config.color} text-white`}
              >
                <config.icon className='h-3 w-3 mr-1' />
                {config.label}
              </Badge>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(networkConfig).map(([key, networkInfo]) => (
            <SelectItem key={key} value={key}>
              <div className='flex items-center gap-2'>
                <Badge
                  variant='secondary'
                  className={`${networkInfo.color} text-white`}
                >
                  <networkInfo.icon className='h-3 w-3 mr-1' />
                  {networkInfo.label}
                </Badge>
                <span className='text-xs text-muted-foreground'>
                  {networkInfo.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
