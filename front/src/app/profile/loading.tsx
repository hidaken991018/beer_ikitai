'use client';

import React from 'react';

import { AppLayout } from '@/components/layout/AppLayout';

export default function ProfileLoading() {
  return (
    <AppLayout>
      <div className='max-w-4xl mx-auto'>
        {/* Header Skeleton */}
        <div className='mb-8'>
          <div className='bg-gray-200 rounded h-8 w-48 mb-2 animate-pulse' />
          <div className='bg-gray-200 rounded h-4 w-96 animate-pulse' />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Content Skeleton */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Basic Information Card */}
            <div className='border rounded-lg p-6'>
              <div className='flex justify-between items-center mb-4'>
                <div className='bg-gray-200 rounded h-6 w-32 animate-pulse' />
                <div className='bg-gray-200 rounded h-8 w-16 animate-pulse' />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <div className='bg-gray-200 rounded h-4 w-16 mb-2 animate-pulse' />
                  <div className='bg-gray-200 rounded h-10 animate-pulse' />
                </div>
                <div>
                  <div className='bg-gray-200 rounded h-4 w-20 mb-2 animate-pulse' />
                  <div className='bg-gray-200 rounded h-10 animate-pulse' />
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className='border rounded-lg p-6'>
              <div className='bg-gray-200 rounded h-6 w-32 mb-4 animate-pulse' />
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className='text-center p-4 bg-gray-50 rounded-lg'
                  >
                    <div className='bg-gray-200 rounded-full h-6 w-6 mx-auto mb-2 animate-pulse' />
                    <div className='bg-gray-200 rounded h-6 w-8 mx-auto mb-2 animate-pulse' />
                    <div className='bg-gray-200 rounded h-3 w-16 mx-auto animate-pulse' />
                  </div>
                ))}
              </div>
              <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <div className='bg-gray-200 rounded h-4 w-32 animate-pulse' />
                  <div className='bg-gray-200 rounded h-4 w-24 animate-pulse' />
                </div>
                <div className='flex justify-between items-center'>
                  <div className='bg-gray-200 rounded h-4 w-28 animate-pulse' />
                  <div className='bg-gray-200 rounded h-4 w-20 animate-pulse' />
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className='border rounded-lg p-6'>
              <div className='bg-gray-200 rounded h-6 w-32 mb-4 animate-pulse' />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className='bg-gray-200 rounded h-10 animate-pulse'
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className='space-y-6'>
            {/* Account Status Card */}
            <div className='border rounded-lg p-6'>
              <div className='bg-gray-200 rounded h-6 w-32 mb-4 animate-pulse' />
              <div className='space-y-3'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='flex items-center justify-between'>
                    <div className='bg-gray-200 rounded h-4 w-16 animate-pulse' />
                    <div className='bg-gray-200 rounded h-4 w-12 animate-pulse' />
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements Card */}
            <div className='border rounded-lg p-6'>
              <div className='bg-gray-200 rounded h-6 w-32 mb-4 animate-pulse' />
              <div className='space-y-3'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className='bg-gray-50 rounded p-2 flex items-center'
                  >
                    <div className='bg-gray-200 rounded h-4 w-4 mr-2 animate-pulse' />
                    <div className='bg-gray-200 rounded h-4 w-32 animate-pulse' />
                  </div>
                ))}
              </div>
            </div>

            {/* Account Actions Card */}
            <div className='border rounded-lg p-6'>
              <div className='bg-gray-200 rounded h-6 w-32 mb-4 animate-pulse' />
              <div className='space-y-3'>
                <div className='bg-gray-200 rounded h-10 animate-pulse' />
                <div className='bg-gray-200 rounded h-10 animate-pulse' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
