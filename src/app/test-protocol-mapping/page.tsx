"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import protocolsList from "@/lib/data/protocolsList.json";

export default function TestProtocolMappingPage() {
  // Function to get protocol name by address
  const getProtocolNameByAddress = (address: string): string => {
    if (!address || address === 'Unknown' || address.startsWith('Pool/Validator ID:') || address.startsWith('DEX/Pool ID:') || address.startsWith('ID:')) {
      return address;
    }
    
    // Normalize address (remove 0x prefix if present, ensure lowercase)
    const normalizedAddress = address.toLowerCase().replace(/^0x/, '');
    
    // Find protocol by contract address
    const protocol = protocolsList.find(p => {
      const protocolWithContract = p as any;
      const hasContract = protocolWithContract.contract && typeof protocolWithContract.contract === 'string';
      
      if (!hasContract) {
        return false;
      }
      
      // Normalize contract address
      const normalizedContract = protocolWithContract.contract.toLowerCase().replace(/^0x/, '');
      return normalizedContract === normalizedAddress;
    });
    
    if (protocol) {
      return `${protocol.name} (${address.substring(0, 6)}...${address.substring(address.length - 4)})`;
    }
    
    // If no exact match found, return the original address
    return address;
  };

  const testAddresses = [
    '0xc0c240c870606a5cb3150795e2d0dfff9f1f7456', // Hyperion
    'c0c240c870606a5cb3150795e2d0dfff9f1f7456', // Hyperion without 0x
    '0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6', // Joule
    '2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6', // Joule without 0x
    '0xc6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba', // Echelon
    'c6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba', // Echelon without 0x
    '0x378d5ba871c3d1bdf477a617f997f23d9e0702de97a02f42925b44fa3abc9866', // Meso Finance
    '378d5ba871c3d1bdf477a617f997f23d9e0702de97a02f42925b44fa3abc9866', // Meso Finance without 0x
    '0x9ad235f7d685b26a6b42ea960aaecbe3a5df46fc344b4300a259a7bef985459b', // Auro Finance
    '9ad235f7d685b26a6b42ea960aaecbe3a5df46fc344b4300a259a7bef985459b', // Auro Finance without 0x
    '0xb36527754eb54d7ff55daf13bcb54b42b88ec484bd6f0e3b2e0d1db169de6451', // Amnis Finance
    'b36527754eb54d7ff55daf13bcb54b42b88ec484bd6f0e3b2e0d1db169de6451', // Amnis Finance without 0x
    '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a', // Unknown
    '111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a', // Unknown without 0x
    'Pool/Validator ID: 74090850', // Pool ID
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Protocol Mapping Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Protocols List:</h3>
              <div className="bg-gray-50 p-4 rounded text-sm">
                {protocolsList.map((protocol: any, index) => (
                  <div key={index} className="mb-2">
                    <strong>{protocol.name}:</strong> {protocol.contract || 'NO CONTRACT ADDRESS'}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Test Results:</h3>
              <div className="space-y-2">
                {testAddresses.map((address, index) => (
                  <div key={index} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{address}</span>
                    <span className="text-gray-500">→</span>
                    <span className="font-medium">{getProtocolNameByAddress(address)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={() => {
                console.log('=== Protocol Mapping Test ===');
                console.log('Protocols List:', protocolsList);
                
                // Log all protocol addresses
                console.log('=== All Protocol Addresses ===');
                protocolsList.forEach((protocol: any) => {
                  if (protocol.contract) {
                    console.log(`${protocol.name}: ${protocol.contract}`);
                  } else {
                    console.log(`${protocol.name}: NO CONTRACT ADDRESS`);
                  }
                });
                
                console.log('=== Testing Addresses ===');
                testAddresses.forEach(address => {
                  const result = getProtocolNameByAddress(address);
                  console.log(`${address} -> ${result}`);
                });
              }}
              variant="outline"
            >
              Log to Console
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 