import { BaseService } from "./baseService";
import { RequestContext } from "./requestContext";

export function Inject<T extends BaseService>(cls: { new(context: RequestContext): T }) {
  const id = (cls as any).__identifier__;
  return (target: any, key: string): any => {
    Object.defineProperty(target, '__service__' + key, {
      writable: false,
      value: id,
      configurable: false,
      enumerable: false
    })
  };
}
