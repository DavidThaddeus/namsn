'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, MapPin, Phone } from 'lucide-react';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const fieldClassName =
  'border-0 bg-muted shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-0';

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Online submission isn't wired up to a backend yet — be upfront about that
    // rather than pretending the message was sent somewhere.
    toast(
      'Online submission isn’t available yet — please reach us directly using the email or phone number below.',
      { icon: '✉️' }
    );
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border bg-muted/40 py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="font-display text-4xl font-bold text-foreground">Get in Touch</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Have a question? We&apos;d love to hear from you.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">Visit Us</h3>
                  <p className="mt-1 text-muted-foreground">
                    Department of Mathematics
                    <br />
                    College of Physical Sciences
                    <br />
                    Federal University of Agriculture
                    <br />
                    Abeokuta, Ogun State, Nigeria
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">Call Us</h3>
                  <p className="mt-1 text-muted-foreground">+234 (0) 800 000 0000</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">Email Us</h3>
                  <p className="mt-1 text-muted-foreground">info@mathematics.funaab.edu.ng</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your name"
                  required
                  className={fieldClassName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  required
                  className={fieldClassName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="Your message..."
                  required
                  className={fieldClassName}
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Send Message
              </Button>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
