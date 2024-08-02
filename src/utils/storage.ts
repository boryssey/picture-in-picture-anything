type StorageValueType = string | number | boolean;

export function getStorageData<T extends string>(
  storageKey: T | T[] | { [key in T]?: StorageValueType },
): Promise<{ [key in T]?: StorageValueType }> {
  return chrome.storage.local.get(storageKey) as Promise<{
    [key in T]?: StorageValueType;
  }>;
}

export const setStorageData = (data: Record<string, unknown>) =>
  chrome.storage.local.set(data);

export const addStorageValueListener = (
  key: string,
  listener: (value: unknown) => void | Promise<void>,
) =>
  chrome.storage.local.onChanged.addListener((changes) => {
    if (changes[key] !== undefined) {
      const newValue = changes[key].newValue as unknown;
      newValue !== undefined && void listener(changes[key].newValue);
    }
  });

type ValueListener = (value: unknown) => void | Promise<void>;

export class StorageValue<T extends StorageValueType> {
  constructor(
    public key: string,
    public defaultValue?: T,
  ) {
    void this.get(defaultValue).catch();
    addStorageValueListener(this.key, this.valueListener);
  }
  listeners: ValueListener[] = [];
  value: T | undefined = undefined;

  get = async (defaultValue?: T) => {
    if (this.value) return this.value;
    const data = await getStorageData(
      defaultValue !== undefined ? { [this.key]: defaultValue } : this.key,
    );
    this.value = data[this.key] as T;
    return data[this.key] as T;
  };

  set = async (value: T) => {
    await setStorageData({ [this.key]: value });
  };

  getLocal = () => this.value;

  valueListener: ValueListener = (value) => {
    this.value = value as T;
    const promises = this.listeners.map((l) => l(value));
    void Promise.all(promises);
  };

  addListener = (listener: ValueListener) => {
    this.listeners.push(listener);
  };

  removeListener = (listener: ValueListener) => {
    this.listeners = this.listeners.filter((l) => l !== listener);
  };
}
