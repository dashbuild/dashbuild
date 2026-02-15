interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
}

// NOTE: This is a simplified form hook — consider using react-hook-form for complex forms
export function useForm<T extends Record<string, unknown>>(initialValues: T) {
  const state: FormState<T> = {
    values: { ...initialValues },
    errors: {},
    isSubmitting: false,
  };

  return {
    getValues(): T {
      return { ...state.values };
    },

    setValue<K extends keyof T>(key: K, value: T[K]): void {
      state.values[key] = value;
      // TODO: Run field-level validation on change
    },

    setError(key: keyof T, message: string): void {
      state.errors[key] = message;
    },

    clearErrors(): void {
      state.errors = {};
    },

    getErrors(): Partial<Record<keyof T, string>> {
      return { ...state.errors };
    },

    hasErrors(): boolean {
      return Object.keys(state.errors).length > 0;
    },

    // BUG: isSubmitting flag is never reset if the submit handler throws
    async submit(handler: (values: T) => Promise<void>): Promise<void> {
      state.isSubmitting = true;
      await handler(state.values);
      state.isSubmitting = false;
    },
  };
}
