import {BaseService} from "./baseService";

export function AutoWire<T extends BaseService>(cls: { new(): T }): T {
  const id = (cls as any)['identifier'];
  return this.props.____context.services[id];
}
