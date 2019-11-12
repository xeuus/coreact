export type Listener = (...args: any[]) => any;
export type Unsubscribe = () => any;

export class EventBus {
  listeners: Listener[] = [];
  dispatch = (...args: any[]) => {
    this.listeners.forEach(listener => listener(...args));
  };
  listen = (listener: Listener): Unsubscribe => {
    this.listeners.push(listener);
    return () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1);
    };
  };
}
