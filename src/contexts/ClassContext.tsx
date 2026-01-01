import React, { createContext, useContext, useState, useEffect } from 'react';

interface ClassInfo {
  id: number;
  name: string;
  school_year: string;
}

interface ClassContextType {
  selectedClass: ClassInfo | null;
  setSelectedClass: (cls: ClassInfo | null) => void;
}

const ClassContext = createContext<ClassContextType>({} as any);

export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedClass, setClassState] = useState<ClassInfo | null>(() => {
    const saved = localStorage.getItem('currentClass');
    return saved ? JSON.parse(saved) : null;
  });

  const setSelectedClass = (cls: ClassInfo | null) => {
    setClassState(cls);
    if (cls) localStorage.setItem('currentClass', JSON.stringify(cls));
    else localStorage.removeItem('currentClass');
  };

  return (
    <ClassContext.Provider value={{ selectedClass, setSelectedClass }}>
      {children}
    </ClassContext.Provider>
  );
};

export const useClass = () => useContext(ClassContext);
