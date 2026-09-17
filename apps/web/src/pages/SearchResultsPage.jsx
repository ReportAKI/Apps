import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import FilterSidebar from '@/components/FilterSidebar.jsx';
import PropertyGrid from '@/components/PropertyGrid.jsx';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('newest');

  const fetchProperties = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const searchPayload = {
        location: searchParams.get('location') || '',
        propertyType: searchParams.get('propertyType') || '',
        priceMin: searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined,
        priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
        yearMin: searchParams.get('yearMin') ? Number(searchParams.get('yearMin')) : undefined,
        yearMax: searchParams.get('yearMax') ? Number(searchParams.get('yearMax')) : undefined,
        sort: sortOption
      };

      Object.keys(searchPayload).forEach(key => {
        if (searchPayload[key] === undefined || searchPayload[key] === '') {
          delete searchPayload[key];
        }
      });

      const response = await apiServerClient.fetch('/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchPayload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Αποτυχία φόρτωσης δεδομένων αναζήτησης');
      }

      const data = await response.json();
      
      let sortedData = [...(Array.isArray(data) ? data : (data.items || []))];
      
      if (sortOption === 'price_asc') {
        sortedData.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sortOption === 'price_desc') {
        sortedData.sort((a, b) => (b.price || 0) - (a.price || 0));
      } else {
        sortedData.sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0));
      }

      setProperties(sortedData);

    } catch (err) {
      console.error('Search error:', err);
      setError(err);
      toast.error(err.message || 'Υπήρξε σφάλμα κατά την αναζήτηση');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [searchParams, sortOption]);

  const handleSortChange = (newSort) => {
    setSortOption(newSort);
  };

  return (
    <>
      <Helmet>
        <title>Αποτελέσματα Αναζήτησης - ReportAKI</title>
        <meta name="description" content="Περιηγηθείτε στα αποτελέσματα αναζήτησης ακινήτων." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />

        <main className="flex-1 w-full bg-[#fafafa]">
          <div className="bg-primary/5 py-8 md:py-12 border-b border-border/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                Αναζήτηση Ακινήτων
              </h1>
              <p className="mt-3 text-muted-foreground max-w-2xl text-lg">
                Βρείτε το ιδανικό ακίνητο με βάση τα κριτήρια που σας ενδιαφέρουν.
              </p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              
              <aside className="w-full lg:w-[320px] flex-shrink-0">
                <FilterSidebar />
              </aside>

              <section className="flex-1 min-w-0">
                <PropertyGrid 
                  properties={properties}
                  isLoading={isLoading}
                  error={error}
                  onRetry={fetchProperties}
                  sortOption={sortOption}
                  onSortChange={handleSortChange}
                />
              </section>

            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default SearchResultsPage;
