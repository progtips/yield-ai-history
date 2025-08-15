import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aptos Explorer - Yield AI',
  description: 'Explore Aptos blockchain transactions, accounts, and tokens with real-time data',
  keywords: 'aptos, blockchain, explorer, transactions, accounts, tokens',
};

export default function ExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Aptos Explorer</h1>
          <p className="text-muted-foreground">
            Explore the Aptos blockchain with real-time transaction data, account information, and token details.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
