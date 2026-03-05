import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface RecordingContextValue {
  isRecording: boolean;
  setRecording: (active: boolean) => void;
}

const RecordingContext = createContext<RecordingContextValue | null>(null);

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [isRecording, setRecordingState] = useState(false);
  const setRecording = useCallback((active: boolean) => {
    setRecordingState(active);
  }, []);
  return (
    <RecordingContext.Provider value={{ isRecording, setRecording }}>
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const ctx = useContext(RecordingContext);
  if (!ctx) return { isRecording: false, setRecording: () => {} };
  return ctx;
}
