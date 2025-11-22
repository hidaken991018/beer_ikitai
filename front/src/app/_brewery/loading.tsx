'use client';

import React from 'react';

import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingCard } from '@/components/ui/loading';

export default function BreweryLoading() {
  return (
    <AppLayout>
      <div className='max-w-6xl mx-auto'>
        {/* Header Skeleton */}
        <div className='mb-8'>
          <div className='bg-gray-200 rounded h-8 w-48 mb-2 animate-pulse' />
          <div className='bg-gray-200 rounded h-4 w-96 animate-pulse' />
        </div>

        {/* Search and Filters Skeleton */}
        <div className='mb-6 p-6 border rounded-lg'>
          <div className='bg-gray-200 rounded h-6 w-32 mb-4 animate-pulse' />
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='bg-gray-200 rounded h-10 animate-pulse' />
            <div className='bg-gray-200 rounded h-10 animate-pulse' />
            <div className='bg-gray-200 rounded h-10 animate-pulse' />
          </div>
        </div>

        {/* Brewery Cards Grid Skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {Array.from({ length: 9 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
