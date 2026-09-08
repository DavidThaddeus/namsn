'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/#about' },
  { name: 'Executives', href: '/#executives' },
  { name: 'Announcements', href: '/announcements' },
  { name: 'Events', href: '/events' },
  { name: 'Contact', href: '/contact' },
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 py-3" onClick={() => setIsOpen(false)}>
          <Image src="/namsn.png" alt="NAMSN Logo" width={44} height={44} className="h-11 w-11" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold text-primary">NAMSN</span>
            <span className="text-xs tracking-wide text-muted-foreground">FUNAAB Chapter</span>
          </span>
        </Link>

        <nav className="hidden lg:flex lg:items-center lg:gap-1">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-foreground/70 hover:text-primary'
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <Button variant="outline" asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/auth/register">Register</Link>
          </Button>
        </div>

        <button
          type="button"
          className="text-foreground lg:hidden"
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="flex flex-col px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'rounded-md px-2 py-2.5 text-sm font-medium',
                  pathname === link.href ? 'text-primary' : 'text-foreground/70'
                )}
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-3 flex gap-3 border-t border-border pt-3">
              <Button variant="outline" asChild className="flex-1">
                <Link href="/auth/login" onClick={() => setIsOpen(false)}>Login</Link>
              </Button>
              <Button asChild className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/auth/register" onClick={() => setIsOpen(false)}>Register</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
