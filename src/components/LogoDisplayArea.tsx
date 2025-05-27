"use client";

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download, ImageOff } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface LogoDisplayAreaProps {
  logoSrc: string | null;
  isLoading: boolean;
  businessName?: string; 
}

export function LogoDisplayArea({ logoSrc, isLoading, businessName = "logo" }: LogoDisplayAreaProps) {
  
  const downloadLogo = () => {
    if (!logoSrc) return;
    const link = document.createElement('a');
    link.href = logoSrc;
    // Sanitize businessName for use in filename
    const safeFileName = businessName.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    link.download = `${safeFileName}_flatify_ai.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="shadow-lg w-full">
      <CardContent className="p-6 flex flex-col items-center justify-center aspect-square min-h-[300px] relative">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <LoadingSpinner size="xl" />
            <p>Generating your masterpiece...</p>
          </div>
        ) : logoSrc ? (
          <>
            <Image
              src={logoSrc}
              alt={businessName ? `${businessName} Logo` : "Generated Logo"}
              width={400}
              height={400}
              className="object-contain max-w-full max-h-[calc(100%-60px)] rounded-md"
              data-ai-hint="logo design"
            />
            <Button 
              onClick={downloadLogo} 
              className="absolute bottom-4 right-4"
              variant="outline"
              size="icon"
              aria-label="Download logo"
            >
              <Download className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <ImageOff className="w-16 h-16 mb-4" />
            <h3 className="text-lg font-semibold">Your Logo Will Appear Here</h3>
            <p className="text-sm">Fill in the details and click "Generate Logo" to start.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
