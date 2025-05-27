import { Palette } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AppLogo({ size = 'md', className }: AppLogoProps) {
  const textSizeClasses: Record<NonNullable<AppLogoProps['size']>, string> = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };
  const iconSizeClasses: Record<NonNullable<AppLogoProps['size']>, string> = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)} aria-label="Flatify AI Home">
      <Palette className={cn(iconSizeClasses[size], "text-primary group-hover:text-accent transition-colors")} />
      <span className={cn("font-semibold text-foreground group-hover:text-accent transition-colors", textSizeClasses[size])}>
        Flatify AI
      </span>
    </Link>
  );
}
