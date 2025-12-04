import React from 'react';
import { DialogConfig } from './types';

export type ShowDialogFunc = (config: Omit<DialogConfig, 'isOpen'>) => void;

export const DialogContext = React.createContext<ShowDialogFunc>(() => {
    console.warn("DialogContext not initialized");
});
