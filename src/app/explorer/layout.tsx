import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aptos Explorer - Yield AI',
  description:
    'Explore Aptos blockchain transactions, accounts, and tokens with real-time data',
  keywords: 'aptos, blockchain, explorer, transactions, accounts, tokens',
};

export default function ExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                Aptos Explorer
              </h1>
              <p className='text-sm text-gray-600 mt-1'>
                Explore the Aptos blockchain with real-time data
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <div className='px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full'>
                Mainnet
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        {children}
      </div>
    </div>
  );
}
