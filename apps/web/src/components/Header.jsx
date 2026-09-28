import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container-custom flex items-center justify-between py-4 px-6">
        <Link 
          to="/" 
          className="flex items-center gap-3 group transition-transform duration-300 hover:scale-[1.02]"
          title="Επιστροφή στην αρχική σελίδα"
        >
          <img 
            src="https://reportaki-cdn.app.com/45f011b9-0635-496d-8858-8464e9cc5f92/ee5f4a6be9f67cc11efac18386da90d7.png" 
            alt="Report AKI Logo" 
            className="h-12 w-auto object-contain"
          />
        </Link>

        <div className="hidden md:flex flex-col items-center text-center">
          <h1 className="text-lg font-bold text-foreground">Report AKI</h1>
          <p className="text-xs text-muted-foreground font-medium">
            Πολεοδομικά & Γεωχωρικά Δεδομένα Ακινήτων
          </p>
        </div>

        <div className="w-12" />
      </div>
    </header>
  );
};

export default Header;