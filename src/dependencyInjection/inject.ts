import { BaseService } from "./baseService";

export function Inject<T extends BaseService>(cls: { new(): T }) {
  const id = (cls as any).__identifier__;
  return (target: any, key: string): any => {
    Object.defineProperty(target, '__descriptor__' + key, {
      writable: false,
      value: id,
      configurable: false,
      enumerable: false
    })
  };
}
