import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone } from 'lucide-react';

const quickLinks = [
  { name: 'About', href: '/#about' },
  { name: 'Executives', href: '/#executives' },
  { name: 'Staff', href: '/staff' },
  { name: 'Announcements', href: '/announcements' },
  { name: 'Events', href: '/events' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/namsn.png" alt="NAMSN Logo" width={44} height={44} className="h-11 w-11 rounded-full bg-primary-foreground" />
              <span className="font-display text-lg font-semibold">NAMSN FUNAAB</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-primary-foreground/75 leading-relaxed">
              Empowering education through innovative technology solutions.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground/60">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/80 hover:text-accent transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground/60">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                <span className="min-w-0 break-words">
                  Department of Mathematics, College of Physical Sciences,
                  <br />
                  Federal University of Agriculture, Abeokuta, Ogun State
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-accent" />
                <span className="min-w-0 break-words">info@mathematics.funaab.edu.ng</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-accent" />
                <span className="min-w-0 break-words">+234 (0) 800 000 0000</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/15 pt-6 text-center text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} NAMSN FUNAAB. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
