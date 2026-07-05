// Minimal trailing debounce. Replaces lodash/debounce so lodash's
// `Function('return this')()` global-detection stays out of the extension bundle
// (it trips web-ext's DANGEROUS_EVAL lint).
export const debounce = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait: number,
) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
};
