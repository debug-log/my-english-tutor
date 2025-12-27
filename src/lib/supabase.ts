import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate URL format
const isValidUrl = (url: string) => {
    try {
        return url.startsWith('http://') || url.startsWith('https://');
    } catch {
        return false;
    }
};

if (!isValidUrl(supabaseUrl)) {
    console.warn('Invalid Supabase URL provided. Please check NEXT_PUBLIC_SUPABASE_URL in .env.local');
}

export const supabase = createClient(
    isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key'
);

// Instrument Supabase for Debug Logging
const originalFrom = supabase.from.bind(supabase);
supabase.from = (table: string) => {
    const queryBuilder = originalFrom(table);

    // Proxy the 'select', 'insert', 'update', 'delete' to capture the final promise
    const proxyBuilder = new Proxy(queryBuilder, {
        get(target, prop, receiver) {
            const originalValue = Reflect.get(target, prop, receiver);

            // If it's a function (like .select(), .insert(), etc.), wrap it
            if (typeof originalValue === 'function') {
                return (...args: any[]) => {
                    const result = originalValue.apply(target, args);

                    // If the result is a Promise-like object (meaning it's the end of the chain or can be awaited),
                    // we might need to intercept 'then' to log results. 
                    // However, Supabase builders are also thenables.

                    // To keep it simple but effective: we overwrite the 'then' of the returned builder
                    // to inspect the data when it resolves.
                    if (result && typeof result.then === 'function') {
                        const originalThen = result.then.bind(result);
                        result.then = (onFulfilled: any, onRejected: any) => {
                            return originalThen((response: any) => {
                                // LOG RESPONSE HERE
                                if (typeof window !== 'undefined') {
                                    import('./debug-store').then(({ useDebugStore }) => {
                                        const { isEnabled, addLog } = useDebugStore.getState();
                                        if (isEnabled) {
                                            if (response.error) {
                                                addLog('error', `Supabase Error [${table}]`, response.error);
                                            } else {
                                                const dataSummary = Array.isArray(response.data)
                                                    ? `Fetched ${response.data.length} rows`
                                                    : 'Operation successful';
                                                addLog('success', `Supabase Response [${table}]: ${dataSummary}`, {
                                                    data: response.data,
                                                    status: response.status,
                                                    statusText: response.statusText
                                                });
                                            }
                                        }
                                    });
                                }

                                if (onFulfilled) return onFulfilled(response);
                                return response;
                            }, onRejected);
                        };
                    }
                    return result;
                };
            }
            return originalValue;
        }
    });

    if (typeof window !== 'undefined') {
        import('./debug-store').then(({ useDebugStore }) => {
            const { isEnabled, addLog } = useDebugStore.getState();
            if (isEnabled) {
                addLog('query', `Supabase Query Started: ${table}`);
            }
        });
    }

    // Cast proxy back to any to satisfy the complex return type of supabase.from
    return proxyBuilder as any;
};

const originalRpc = supabase.rpc.bind(supabase);
supabase.rpc = (fn: string, args?: any, options?: any) => {
    if (typeof window !== 'undefined') {
        import('./debug-store').then(({ useDebugStore }) => {
            const { isEnabled, addLog } = useDebugStore.getState();
            if (isEnabled) {
                addLog('query', `Supabase RPC Call: ${fn}`, { args });
            }
        });
    }
    return originalRpc(fn, args, options);
};
