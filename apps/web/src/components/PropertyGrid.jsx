import React from 'react';
import { Home, Frown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PropertyCard from './PropertyCard.jsx';

const PropertyGrid = ({ properties, isLoading, error, onRetry, sortOption, onSortChange }) => {
  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 px-4 text-center bg-muted/30 rounded-3xl border border-dashed border-border">
        <Frown className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">Σφάλμα φόρτωσης</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {error.message || 'Υπήρξε ένα πρόβλημα κατά τη φόρτωση των αποτελεσμάτων. Παρακαλώ προσπαθήστε ξανά.'}
        </p>
        <Button onClick={onRetry} variant="default">
          Δοκιμάστε ξανά
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col space-y-4">
              <Skeleton className="h-[250px] w-full rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-1/3 mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 px-4 text-center bg-muted/30 rounded-3xl border border-dashed border-border">
        <Home className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">Δεν βρέθηκαν αποτελέσματα</h3>
        <p className="text-muted-foreground max-w-md">
          Δοκιμάστε να προσαρμόσετε τα φίλτρα αναζήτησης ή να διευρύνετε την περιοχή για να δείτε περισσότερα ακίνητα.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-lg font-medium text-foreground">
          Βρέθηκαν <span className="font-bold">{properties.length}</span> ακίνητα
        </h2>
        
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Ταξινόμηση ανά:
          </span>
          <Select value={sortOption} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Επιλογή..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Νεότερα</SelectItem>
              <SelectItem value="price_asc">Τιμή (Αύξουσα)</SelectItem>
              <SelectItem value="price_desc">Τιμή (Φθίνουσα)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
};

export default PropertyGrid;
