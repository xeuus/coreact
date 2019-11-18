import debounce from "lodash/debounce";
import {RequestContext} from "./requestContext";
import {DeserializeQuery} from "./param";
import {MatchRoute} from "./helpers/match";

export const config = {
  counter: 0,
  services: [] as any[],
};

export const delayedRefresh = debounce((context: any) => {
  context.forceUpdate();
}, 30);

export function metadataOf(target: any) {
  return target.__metadata__ || {};
}

export function metadata(target: any, value: any) {
  Object.defineProperty(target, '__metadata__', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: {
      ...metadataOf(target),
      ...value,
    }
  });
}

export function fillQueries(pathname: string, search: string, context: RequestContext) {
  const obj = DeserializeQuery(search);
  context.services.map((a: any) => {
    const {url = [], query = []} = metadataOf(a);
    query.forEach((q: any) => {
      const {key, name} = q;
      let alias = name || key;
      if (a[key] !== obj[alias]) {
        Object.defineProperty(a, '$' + key, {
          configurable: true,
          writable: false,
          enumerable: false,
          value: obj[alias],
        });
      }
    });
    url.forEach((q: any) => {
      const {key, pattern, name} = q;
      const alias = name || key;
      const found = MatchRoute(pathname, {
        exact: false, path: pattern, sensitive: false, strict: false,
      });
      if (found) {
        const params = found.params;
        a[key] = params[alias];
        Object.defineProperty(a, '$' + key, {
          configurable: true,
          writable: false,
          enumerable: false,
          value: params[alias],
        });
      }
    })
  });
}