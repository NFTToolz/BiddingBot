export const getItem = (key: string) => {
  if (typeof window !== "undefined") {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
};

export function setItem(key: string, value: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function removeItem(key: string) {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
  }
}
