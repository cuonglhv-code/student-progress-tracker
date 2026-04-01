import { useState, useEffect } from 'react';
import { classService } from '../services/classes';

export function useClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await classService.getAllClasses();
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch classes'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return { classes, loading, error, refresh: fetchClasses };
}
