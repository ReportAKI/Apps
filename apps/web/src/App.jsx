import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from './components/ScrollToTop.jsx';
import { SearchProvider } from './contexts/SearchContext.jsx';
import HomePage from './pages/HomePage.jsx';
import PropertyReportPage from './pages/PropertyReportPage.jsx';
import ExportPage from './pages/ExportPage.jsx';
import SearchResultsPage from './pages/SearchResultsPage.jsx';

console.log('Toaster component:', Toaster);

function App() {
  return (
    <Router>
      <SearchProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/property/:id" element={<PropertyReportPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
        <Toaster />
      </SearchProvider>
    </Router>
  );
}

export default App;