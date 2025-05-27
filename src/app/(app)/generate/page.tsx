
"use client";

import { useUserRole } from '@/contexts/UserRoleContext';
import { NoviceGeneratorView } from '@/components/NoviceGeneratorView';
import { ProfessionalGeneratorView } from '@/components/ProfessionalGeneratorView';
import { ImageEditorGeneratorView } from '@/components/ImageEditorGeneratorView'; // Added
import { LoadingSpinner } from '@/components/LoadingSpinner'; 

export default function GeneratePage() {
  const { userRole, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-grow">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!userRole) {
    // This case should ideally be handled by the AppLayout redirecting to '/',
    // but as a fallback:
    return (
      <div className="flex items-center justify-center flex-grow">
        <p>Please select a role on the homepage.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {userRole === 'novice' ? <NoviceGeneratorView /> : 
       userRole === 'professional' ? <ProfessionalGeneratorView /> :
       userRole === 'imageEditor' ? <ImageEditorGeneratorView /> : // Added condition
       <p>Invalid role selected.</p> 
      }
    </div>
  );
}
