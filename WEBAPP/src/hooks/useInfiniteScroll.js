import { useState, useEffect, useCallback } from 'react';

export const useInfiniteScroll = (fetchMoreData) => {
  const [isFetching, setIsFetching] = useState(false);

  const fetchMoreItems = useCallback(async () => {
    await fetchMoreData();
    setIsFetching(false);
  }, [fetchMoreData]);

  useEffect(() => {
    if (!isFetching) return;
    fetchMoreItems();
  }, [isFetching, fetchMoreItems]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || isFetching) return;
      setIsFetching(true);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFetching]);

  return [isFetching, setIsFetching];
}; 