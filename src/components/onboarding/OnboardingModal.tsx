import React from 'react';
import Onboarding from '@/pages/Onboarding';

// Full-screen overlay for onboarding
export default function OnboardingModal() {
  return (
    <div className='fixed inset-0 z-50 bg-background flex items-center justify-center p-0 w-full h-full'>
      <div className='w-full h-full flex items-center justify-center'>
        <Onboarding />
      </div>
    </div>
  );
}
