import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, SlidersHorizontal, RefreshCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const currentYear = new Date().getFullYear();

const FilterSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || 'all');
  const [priceRange, setPriceRange] = useState([
    Number(searchParams.get('priceMin')) || 0,
    Number(searchParams.get('priceMax')) || 1000000
  ]);
  const [yearRange, setYearRange] = useState([
    Number(searchParams.get('yearMin')) || 1900,
    Number(searchParams.get('yearMax')) || currentYear
  ]);

  useEffect(() => {
    setLocation(searchParams.get('location') || '');
    setPropertyType(searchParams.get('propertyType') || 'all');
    setPriceRange([
      Number(searchParams.get('priceMin')) || 0,
      Number(searchParams.get('priceMax')) || 1000000
    ]);
    setYearRange([
      Number(searchParams.get('yearMin')) || 1900,
      Number(searchParams.get('yearMax')) || currentYear
    ]);
  }, [searchParams]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    
    if (location.trim()) params.set('location', location.trim());
    if (propertyType && propertyType !== 'all') params.set('propertyType', propertyType);
    
    if (priceRange[0] > 0) params.set('priceMin', priceRange[0].toString());
    if (priceRange[1] < 1000000) params.set('priceMax', priceRange[1].toString());
    
    if (yearRange[0] > 1900) params.set('yearMin', yearRange[0].toString());
    if (yearRange[1] < currentYear) params.set('yearMax', yearRange[1].toString());

    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setLocation('');
    setPropertyType('all');
    setPriceRange([0, 1000000]);
    setYearRange([1900, currentYear]);
    setSearchParams(new URLSearchParams());
  };

  const formatPrice = (val) => new Intl.NumberFormat('el-GR').format(val) + ' €';

  return (
    <Card className="border-border/60 shadow-sm bg-card sticky top-24">
      <CardHeader className="pb-4 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          Φίλτρα Αναζήτησης
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-8 pt-6">
        <div className="space-y-3">
          <Label htmlFor="location" className="text-foreground font-medium">Τοποθεσία</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="π.χ. Αθήνα, Κέντρο" 
              className="pl-9 bg-background border-border focus-visible:ring-primary/20 text-foreground"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="property-type" className="text-foreground font-medium">Τύπος Ακινήτου</Label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger id="property-type" className="bg-background border-border text-foreground">
              <SelectValue placeholder="Όλοι οι τύποι" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Όλοι οι τύποι</SelectItem>
              <SelectItem value="apartment">Διαμέρισμα</SelectItem>
              <SelectItem value="house">Μονοκατοικία</SelectItem>
              <SelectItem value="commercial">Επαγγελματικός Χώρος</SelectItem>
              <SelectItem value="land">Οικόπεδο</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-foreground font-medium">Τιμή</Label>
          </div>
          <Slider 
            min={0} 
            max={1000000} 
            step={10000} 
            value={priceRange} 
            onValueChange={setPriceRange}
            className="my-4"
          />
          <div className="flex items-center justify-between gap-4">
            <div className="w-full">
              <span className="text-xs text-muted-foreground mb-1 block">Από</span>
              <Input 
                type="number" 
                value={priceRange[0]} 
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="h-8 text-sm text-foreground bg-background"
              />
            </div>
            <div className="w-full">
              <span className="text-xs text-muted-foreground mb-1 block">Έως</span>
              <Input 
                type="number" 
                value={priceRange[1]} 
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="h-8 text-sm text-foreground bg-background"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-foreground font-medium">Έτος Κατασκευής</Label>
          <Slider 
            min={1900} 
            max={currentYear} 
            step={1} 
            value={yearRange} 
            onValueChange={setYearRange}
            className="my-4"
          />
          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span>{yearRange[0]}</span>
            <span>{yearRange[1]}</span>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-3 border-t border-border/50">
          <Button onClick={handleApplyFilters} className="w-full font-semibold">
            Εφαρμογή Φίλτρων
          </Button>
          <Button onClick={handleResetFilters} variant="outline" className="w-full gap-2 border-border/60 hover:bg-muted text-foreground">
            <RefreshCcw className="w-4 h-4" />
            Επαναφορά
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterSidebar;
