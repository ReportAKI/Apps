import React from 'react';
import { Link } from 'react-router-dom';
import ContactDialog from '@/components/ContactDialog';

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-200">
      <div className="w-full px-4 py-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 text-center">
          <ContactDialog />
          <p className="text-sm text-black/60">
            © 2026 ReportAKI
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
