'use client';

import { useState, useEffect } from 'react';

export default function useLocalStorage(key : string, initialValue : string) {

    const [value, setValue] = useState(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);

            return item !== null
                ? JSON.parse(item)
                : initialValue;

        } catch (error) {
            console.error(`Error reading localStorage key "${key}"`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(
                key,
                JSON.stringify(value)
            );
        } catch (error) {
            console.error(`Error saving localStorage key "${key}"`, error);
        }
    }, [key, value]);

    const remove = () => {
        try {
            window.localStorage.removeItem(key);
            setValue(initialValue);
        } catch (error) {
            console.error(error);
        }
    };

    return {
        value,
        setValue,
        remove
    };
}