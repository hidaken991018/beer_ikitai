'use client';

import React from 'react';

import { AppLayout } from '@/components/layout/AppLayout';

export default function VisitsLoading() {
  return (
    <AppLayout>
      <div className='max-w-6xl mx-auto'>
        {/* Header Skeleton */}
        <div className='mb-8'>
          <div className='bg-gray-200 rounded h-8 w-48 mb-2 animate-pulse' />
          <div className='bg-gray-200 rounded h-4 w-96 animate-pulse' />
        </div>

        {/* Statistics Cards Skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='border rounded-lg p-6 text-center'>
              <div className='bg-gray-200 rounded-full h-8 w-8 mx-auto mb-2 animate-pulse' />
              <div className='bg-gray-200 rounded h-6 w-12 mx-auto mb-2 animate-pulse' />
              <div className='bg-gray-200 rounded h-4 w-20 mx-auto animate-pulse' />
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className='mb-6 p-6 border rounded-lg'>
          <div className='bg-gray-200 rounded h-6 w-32 mb-4 animate-pulse' />
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='bg-gray-200 rounded h-10 animate-pulse' />
            <div className='bg-gray-200 rounded h-10 animate-pulse' />
            <div className='bg-gray-200 rounded h-10 animate-pulse' />
          </div>
        </div>

        {/* Visits List Skeleton */}
        <div className='space-y-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='border rounded-lg p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <div className='bg-gray-200 rounded h-5 w-48 mb-2 animate-pulse' />
                  <div className='bg-gray-200 rounded h-4 w-64 mb-2 animate-pulse' />
                  <div className='bg-gray-200 rounded h-4 w-32 animate-pulse' />
                </div>
                <div className='bg-gray-200 rounded h-8 w-20 animate-pulse' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
