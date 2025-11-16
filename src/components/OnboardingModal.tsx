import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Onboarding from '@/pages/Onboarding';

export default function OnboardingModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const open = params.get('onboarding') === '1';

  const close = () => {
    // Remove onboarding param
    const p = new URLSearchParams(location.search);
    p.delete('onboarding');
    const search = p.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) close(); }}>
      <DialogContent aria-describedby="onboarding-desc">
        <span id="onboarding-desc" className="sr-only">
          Complete onboarding to set up your nutrition profile. This dialog cannot be dismissed until finished.
        </span>
        <Onboarding />
      </DialogContent>
    </Dialog>
  );
}
