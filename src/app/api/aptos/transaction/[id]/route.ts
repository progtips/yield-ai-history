import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id;
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Fetch transaction details from Aptos Indexer API
    const response = await fetch(
      `https://indexer.mainnet.aptoslabs.com/v1/transactions/by_version/${transactionId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.statusText}`);
    }

    const transactionData = await response.json();

    // Transform the data to match our interface
    const transformedTransaction = {
      id: transactionData.version,
      version: transactionData.version,
      timestamp: transactionData.timestamp,
      type: transactionData.type,
      status: transactionData.success ? 'success' : 'failed',
      gas_used: transactionData.gas_used,
      gas_unit_price: transactionData.gas_unit_price,
      max_gas_amount: transactionData.max_gas_amount,
      expiration_timestamp_secs: transactionData.expiration_timestamp_secs,
      sender: transactionData.sender,
      sequence_number: transactionData.sequence_number,
      success: transactionData.success,
      vm_status: transactionData.vm_status,
      payload: {
        type: transactionData.payload?.type || 'unknown',
        function: transactionData.payload?.function || '',
        type_arguments: transactionData.payload?.type_arguments || [],
        arguments: transactionData.payload?.arguments || [],
      },
      events: transactionData.events?.map((event: any) => ({
        type: event.type,
        data: event.data,
      })) || [],
      changes: transactionData.changes?.map((change: any) => ({
        type: change.type,
        address: change.address,
        state_key_hash: change.state_key_hash,
        data: change.data,
      })) || [],
    };

    return NextResponse.json(transformedTransaction);
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction details' },
      { status: 500 }
    );
  }
} 