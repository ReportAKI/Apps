import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext(null);

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('address');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  const clearSelectedProperty = () => {
    setSelectedProperty(null);
  };

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searchType,
        setSearchType,
        searchResults,
        setSearchResults,
        selectedProperty,
        setSelectedProperty,
        isLoading,
        setIsLoading,
        error,
        setError,
        clearSearch,
        clearSelectedProperty,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
};