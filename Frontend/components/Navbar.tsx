"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { isAuthenticated, removeToken } from "@/lib/auth";
import { getCurrentUserRole } from "@/lib/jwt";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Boardings", href: "/boardings" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Check authentication status
    setAuthenticated(isAuthenticated());
    setIsOwner(getCurrentUserRole() === "owner");
    
    // Listen for storage changes (when token is set/removed)
    const handleStorageChange = () => {
      setAuthenticated(isAuthenticated());
      setIsOwner(getCurrentUserRole() === "owner");
    };
    window.addEventListener("storage", handleStorageChange);
    
    // Also check on mount and when component becomes visible
    const interval = setInterval(() => {
      setAuthenticated(isAuthenticated());
      setIsOwner(getCurrentUserRole() === "owner");
    }, 1000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    removeToken();
    setAuthenticated(false);
    setIsOwner(false);
    setAccountMenuOpen(false);
    window.location.href = "/";
  };

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileMenuOpen
          ? "bg-white/80 backdrop-blur-md border-b border-gray-200 py-3"
          : "bg-transparent py-5"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center relative z-50">
          <Image
            src="/logo/logo_transparent.png"
            alt="ANEXLK Logo"
            width={120}
            height={40}
            className="object-contain"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="relative px-4 py-2 text-sm font-medium text-brand-text hover:text-brand-accent transition-colors group"
            >
              {link.label}
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
          ))}
          {authenticated && isOwner && (
            <Link
              href="/owner-dashboard"
              className="relative px-4 py-2 text-sm font-medium text-brand-text hover:text-brand-accent transition-colors group"
            >
              Owner Dashboard
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {authenticated ? (
            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-accent text-white hover:bg-brand-accent/90 transition-colors shadow-lg"
                aria-label="Account menu"
              >
                <User size={20} />
              </button>
              {accountMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">Owner</p>
                    <p className="text-xs text-gray-500">Account</p>
                  </div>
                  {isOwner && (
                    <Link
                      href="/owner-dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-brand-text hover:text-brand-accent transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-brand-text text-white px-5 py-2.5 text-sm font-medium hover:bg-brand-accent transition-colors shadow-lg shadow-brand-text/20 hover:shadow-brand-accent/20"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden relative z-50 p-2 text-brand-text"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-x-0 top-0 bg-white border-b border-gray-200 p-4 pt-24 md:hidden shadow-xl"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-lg font-medium text-brand-text hover:text-brand-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {authenticated && isOwner && (
                <Link
                  href="/owner-dashboard"
                  className="text-lg font-medium text-brand-text hover:text-brand-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Owner Dashboard
                </Link>
              )}
              <hr className="border-gray-100" />
              {authenticated ? (
                <>
                  {isOwner && (
                    <Link
                      href="/owner-dashboard"
                      className="text-lg font-medium text-brand-text hover:text-brand-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left text-lg font-medium text-red-600 hover:text-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-lg font-medium text-brand-text hover:text-brand-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="text-lg font-medium text-brand-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </div>
      
      {/* Click outside to close account menu */}
      {accountMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setAccountMenuOpen(false)}
        />
      )}
    </motion.header>
  );
}
