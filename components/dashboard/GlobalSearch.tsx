'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import styles from './GlobalSearch.module.css';
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  type: 'navigation' | 'stat' | 'content';
  title: string;
  subtitle?: string;
  href: string;
}

interface GlobalSearchProps {
  onSearch?: (query: string) => void;
  results?: SearchResult[];
  isLoading?: boolean;
}

export function GlobalSearch({ onSearch, results: propResults, isLoading: propIsLoading }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [internalResults, setInternalResults] = useState<SearchResult[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Use prop results if provided, otherwise use internal state
  const results = propResults || internalResults;
  const isLoading = propIsLoading !== undefined ? propIsLoading : internalLoading;

  useEffect(() => {
    if (query && onSearch) {
      onSearch(query);
    } else if (query && !onSearch) {
      // Use internal API call if no onSearch prop provided
      const fetchResults = async () => {
        setInternalLoading(true);
        try {
          const response = await fetch(`/api/dashboard/search?q=${encodeURIComponent(query)}`);
          const data = await response.json();
          setInternalResults(data.results || []);
        } catch (error) {
          console.error('Search error:', error);
          setInternalResults([]);
        } finally {
          setInternalLoading(false);
        }
      };

      const debounceTimer = setTimeout(fetchResults, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [query, onSearch]);

  useEffect(() => {
    setShowResults(isFocused && query.length > 0 && results.length > 0);
  }, [isFocused, query, results]);

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay to allow click on results
    setTimeout(() => setIsFocused(false), 200);
  };

  const handleResultClick = (result: SearchResult) => {
    setQuery('');
    setShowResults(false);
    window.location.href = result.href;
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className={styles.container}>
      <div
        className={`${styles.search} ${isFocused ? styles.focused : ''}`}
        data-testid="global-search"
      >
        <Search size={18} className={styles.icon} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search dashboard..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={styles.input}
          data-testid="search-input"
        />
      </div>

      {showResults && (
        <div ref={resultsRef} className={styles.results} data-testid="search-results">
          {isLoading ? (
            <div className={styles.loading}>Searching...</div>
          ) : (
            <>
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type} className={styles.category}>
                  <div className={styles.categoryTitle}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                  {items.map((result) => (
                    <Button 
                      key={result.id}
                      variant="primary" 
                      onClick={() => handleResultClick(result)}
                      data-testid={`search-result-${result.id}`}
                    >
                      <div className={styles.resultTitle}>{result.title}</div>
                      {result.subtitle && (
                        <div className={styles.resultSubtitle}>{result.subtitle}</div>
                      )}
                    </Button>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
