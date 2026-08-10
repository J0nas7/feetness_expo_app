import React from 'react';

const DEFAULT_DELAY = 400;
const DEFAULT_INTERVAL = 100;

export const useRepeatPress = (callback: () => void, delay = DEFAULT_DELAY, interval = DEFAULT_INTERVAL) => {
    const callbackRef = React.useRef(callback);
    const delayTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const repeatTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);
    const didRepeat = React.useRef(false);
    callbackRef.current = callback;

    const clearTimers = React.useCallback(() => {
        if (delayTimer.current) clearTimeout(delayTimer.current);
        if (repeatTimer.current) clearInterval(repeatTimer.current);
        delayTimer.current = null;
        repeatTimer.current = null;
    }, []);

    React.useEffect(() => clearTimers, [clearTimers]);

    const onPressIn = React.useCallback(() => {
        didRepeat.current = false;
        clearTimers();
        delayTimer.current = setTimeout(() => {
            didRepeat.current = true;
            callbackRef.current();
            repeatTimer.current = setInterval(() => callbackRef.current(), interval);
        }, delay);
    }, [clearTimers, delay, interval]);

    const onPressOut = React.useCallback(() => clearTimers(), [clearTimers]);
    const onPress = React.useCallback(() => {
        if (!didRepeat.current) callbackRef.current();
    }, []);

    return { onPress, onPressIn, onPressOut };
};
