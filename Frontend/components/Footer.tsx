"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Instagram, Linkedin, Github, Mail, MapPin, Phone } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { getCurrentUserRole } from "@/lib/jwt";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Boardings", href: "/boardings" },
  { label: "About Us", href: "/about" },
  { label: "Contact Support", href: "/contact" },
];

export default function Footer() {
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"student" | "owner" | null>(null);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setUserRole(getCurrentUserRole());
    
    // Listen for storage changes
    const handleStorageChange = () => {
      setAuthenticated(isAuthenticated());
      setUserRole(getCurrentUserRole());
    };
    window.addEventListener("storage", handleStorageChange);
    
    // Check periodically for auth changes
    const interval = setInterval(() => {
      setAuthenticated(isAuthenticated());
      setUserRole(getCurrentUserRole());
    }, 1000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  return (
    <footer className="bg-[#111111] text-gray-300 border-t border-gray-800">
      <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="block">
              <div className="relative h-10 w-32">
                <Image
                  src="/logo/logo_transparent.png"
                  alt="ANEXLK Logo"
                  fill
                  className="object-contain object-left brightness-0 invert"
                />
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              The modern solution for finding your next boarding space. Safe, verified, and easy to use.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://www.instagram.com/nemitha_prs/"
                className="rounded-full bg-white/5 p-2 transition-colors hover:bg-brand-accent hover:text-white"
              >
                <Instagram size={18} />
              </Link>
              <Link
                href="https://www.linkedin.com/in/nemitha-prabashwara-5aaa9b376/"
                className="rounded-full bg-white/5 p-2 transition-colors hover:bg-brand-accent hover:text-white"
              >
                <Linkedin size={18} />
              </Link>
              <Link
                href="https://github.com/Nemitha-prs"
                className="rounded-full bg-white/5 p-2 transition-colors hover:bg-brand-accent hover:text-white"
              >
                <Github size={18} />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-white">Platform</h3>
            <ul className="space-y-4">
              {footerLinks.slice(0, 2).map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-brand-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
              {authenticated && userRole === "owner" && (
                <li>
                  <Link href="/owner-dashboard" className="text-sm transition-colors hover:text-brand-accent">
                    Owner Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-white">Support</h3>
            <ul className="space-y-4">
              {footerLinks.slice(3).map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-brand-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/privacy" className="text-sm transition-colors hover:text-brand-accent">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm transition-colors hover:text-brand-accent">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-white">Contact</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="shrink-0 text-brand-accent" />
                <span>Matara , Sri Lanka</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="shrink-0 text-brand-accent" />
                <span>+94 77 9898 273</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="shrink-0 text-brand-accent" />
                <span>nemithaprs@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Anexlk. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}