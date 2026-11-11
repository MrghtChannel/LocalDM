declare const mp: {
  events:
    | {
        add: (name: string, callback: (...args: any[]) => void) => void;
        remove: (name: string) => void;
      }
    | undefined;
  invoke: (name: string, ...args: any[]) => void;
  trigger?: (name: string, ...args: any[]) => void;
};

interface Window {
  mp?: typeof mp;
}
