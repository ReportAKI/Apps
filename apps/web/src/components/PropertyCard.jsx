import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building2, Tag } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PropertyCard = ({ property }) => {
  const imageUrl = property.image 
    ? (property.collectionId ? pb.files.getUrl(property, property.image) : property.image) 
    : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600';

  const typeMap = {
    apartment: { label: 'Διαμέρισμα', color: 'bg-blue-100 text-blue-800' },
    house: { label: 'Μονοκατοικία', color: 'bg-emerald-100 text-emerald-800' },
    commercial: { label: 'Επαγγελματικός', color: 'bg-purple-100 text-purple-800' },
    land: { label: 'Οικόπεδο', color: 'bg-amber-100 text-amber-800' },
  };

  const propertyType = typeMap[property.propertyType?.toLowerCase()] || { 
    label: property.propertyType || 'Ακίνητο', 
    color: 'bg-gray-100 text-gray-800' 
  };

  const formattedPrice = property.price 
    ? new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(property.price)
    : 'Τιμή μη διαθέσιμη';

  return (
    <Link to={`/property/${property.id}`} className="block h-full group">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-border/50 bg-card flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img 
            src={imageUrl} 
            alt={`Ακίνητο στην περιοχή ${property.address || 'Άγνωστη'}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4">
            <Badge className={`${propertyType.color} border-none shadow-sm px-3 py-1 font-semibold`}>
              {propertyType.label}
            </Badge>
          </div>
          {property.kaek && (
            <div className="absolute bottom-4 left-4">
              <Badge variant="secondary" className="bg-black/70 hover:bg-black/80 text-white border-none shadow-sm backdrop-blur-sm">
                ΚΑΕΚ: {property.kaek}
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-5 flex flex-col flex-1">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2 leading-tight">
              {property.title || property.address || 'Ακίνητο χωρίς τίτλο'}
            </h3>
            
            <div className="flex items-start gap-2 text-muted-foreground mb-4">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm line-clamp-2 leading-relaxed">
                {property.address || 'Άγνωστη τοποθεσία'}
              </p>
            </div>

            {property.urbanPlanning?.area && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>{property.urbanPlanning.area} τ.μ.</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              <span className="text-2xl font-extrabold text-foreground tracking-tight">
                {formattedPrice}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PropertyCard;
