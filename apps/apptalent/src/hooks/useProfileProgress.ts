import { useState, useEffect } from 'react';

// Hook sementara untuk simulasi Progress Data
export function useProfileProgress() {
  const [progress, setProgress] = useState<number>(65); // Default 65 to show disable logic initially

  useEffect(() => {
    // In actual implementation, this would fetch from a profile Context or atom
    const saved = localStorage.getItem('orland-profile-progress');
    if (saved) {
      setProgress(parseInt(saved, 10));
    }
  }, []);

  return progress;
}
