import React, { createContext, useContext } from 'react';

export interface PrintModalContextType {
  hiddenColumns: string[];
  setHiddenColumns?: React.Dispatch<React.SetStateAction<string[]>>;
  toggleColumn?: (key: string, visible: boolean) => void;
}

export const PrintModalContext = createContext<PrintModalContextType>({
  hiddenColumns: [],
});

export const usePrintModalContext = () => useContext(PrintModalContext);
