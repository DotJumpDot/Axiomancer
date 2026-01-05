// URL Parameters utility for Svelte (similar to nuqs)
// Reactive URL state management

type ParamValue = string | number | boolean | null;

interface UrlParamOptions<T> {
  defaultValue: T;
  parse?: (value: string) => T;
  serialize?: (value: T) => string;
}

// Get current URL params
function getParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

// Update URL without reload
function updateUrl(params: URLSearchParams) {
  const url = new URL(window.location.href);
  url.search = params.toString();
  window.history.replaceState({}, "", url.toString());
}

// Get a single param value
export function getParam<T extends ParamValue>(key: string, options: UrlParamOptions<T>): T {
  const params = getParams();
  const value = params.get(key);

  if (value === null) {
    return options.defaultValue;
  }

  if (options.parse) {
    return options.parse(value);
  }

  // Default parsing based on type
  if (typeof options.defaultValue === "number") {
    return Number(value) as T;
  }
  if (typeof options.defaultValue === "boolean") {
    return (value === "true") as unknown as T;
  }

  return value as T;
}

// Set a single param value
export function setParam<T extends ParamValue>(
  key: string,
  value: T,
  options?: { serialize?: (value: T) => string }
): void {
  const params = getParams();

  if (value === null || value === undefined) {
    params.delete(key);
  } else {
    const serialized = options?.serialize ? options.serialize(value) : String(value);
    params.set(key, serialized);
  }

  updateUrl(params);
}

// Create a reactive URL param state
export function createUrlParam<T extends ParamValue>(key: string, options: UrlParamOptions<T>) {
  let value = $state(getParam(key, options));

  // Listen for popstate events
  if (typeof window !== "undefined") {
    window.addEventListener("popstate", () => {
      value = getParam(key, options);
    });
  }

  return {
    get value() {
      return value;
    },
    set value(newValue: T) {
      value = newValue;
      setParam(key, newValue, { serialize: options.serialize });
    },
  };
}

// Common URL param presets
export const urlParams = {
  // Conversation ID param
  conversationId: () =>
    createUrlParam<string | null>("c", {
      defaultValue: null,
      parse: (v) => v || null,
    }),

  // Model selection param
  model: () =>
    createUrlParam<string | null>("model", {
      defaultValue: null,
      parse: (v) => v || null,
    }),

  // Web search toggle
  webSearch: () =>
    createUrlParam<boolean>("web", {
      defaultValue: false,
      parse: (v) => v === "1" || v === "true",
      serialize: (v) => (v ? "1" : "0"),
    }),

  // Image search toggle
  imageSearch: () =>
    createUrlParam<boolean>("img", {
      defaultValue: false,
      parse: (v) => v === "1" || v === "true",
      serialize: (v) => (v ? "1" : "0"),
    }),

  // Prompt profile param
  promptProfile: () =>
    createUrlParam<string | null>("profile", {
      defaultValue: null,
      parse: (v) => v || null,
    }),
};

export default urlParams;
