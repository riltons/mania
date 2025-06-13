const createWebStorage = () => {
  return {
    getItem: (key: string): Promise<string | null> => {
      return new Promise((resolve) => {
        if (typeof window !== 'undefined') {
          resolve(window.localStorage.getItem(key));
        } else {
          resolve(null);
        }
      });
    },
    setItem: (key: string, value: string): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
        resolve();
      });
    },
    removeItem: (key: string): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
        resolve();
      });
    },
  };
};

export default createWebStorage();
