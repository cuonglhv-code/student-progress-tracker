import { useState, useEffect } from 'react';
import { studentService } from '../services/students';

export function useStudents(classId?: string) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = classId 
        ? await studentService.getStudentsByClass(classId)
        : await studentService.getAllStudents();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch students'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classId]);

  return { students, loading, error, refresh: fetchData };
}
