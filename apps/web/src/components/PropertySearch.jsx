import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';

const PropertySearch = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsLoading(true);
    try {
      const response = await apiServerClient.fetch('/arcgis/search?kaek=' + encodeURIComponent(trimmedQuery));

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Η αναζήτηση απέτυχε ή δεν είναι διαθέσιμη η υπηρεσία.');
      }

      const data = await response.json();

      if (data.success && data.data) {
        toast.success('Το ακίνητο βρέθηκε επιτυχώς!');
        setQuery('');
        navigate(`/property/${data.data.kaek}`, { state: { propertyData: data.data } });
      } else {
        toast.error(data.error || 'Το ακίνητο δεν βρέθηκε. Ελέγξτε το ΚΑΕΚ.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.message || 'Σφάλμα κατά την αναζήτηση');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto">
      <div className="relative flex items-center w-full bg-white border-2 border-border rounded-full shadow-sm hover:shadow-md transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Αναζήτηση με ΚΑΕΚ..."
          className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 px-8 py-7 text-lg md:text-xl placeholder:text-black/50 text-black rounded-full"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-3 p-4 text-black hover:bg-black/5 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="Αναζήτηση"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 md:w-7 md:h-7 animate-spin" />
          ) : (
            <Search className="w-6 h-6 md:w-7 md:h-7" />
          )}
        </button>
      </div>
    </form>
  );
};

export default PropertySearch;
