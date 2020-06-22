import {RequestContext} from "./requestContext";
import {metadataOf} from "./shared";
import {optional} from "./helpers/functions";

export function getSnapshot(context: RequestContext) {
  return context.services.reduce((acc, service) => {
    const {id, persist = []} = metadataOf(service);
    if (persist.length > 0) {
      const obj: any = {};
      persist.forEach((meta: any) => {
        const {key} = meta;
        obj[key] = service[key];
      });
      acc[id] = obj;
    }
    return acc;
  }, {} as any);
}

export function idOf(type: { new(context?: RequestContext): any }) {
  const {id} = metadataOf(type.prototype);
  return id;
}

export function restoreSnapshot(context: RequestContext, d: any) {
  context.services.forEach((service) => {
    const {id, persist = []} = metadataOf(service);
    if (persist.length > 0) {
      const data = d[id];
      if (data) {
        persist.forEach((meta: any) => {
          const {key} = meta;
          if (typeof data[key] !== 'undefined') {
            service[key] = data[key];
          }
        });
      }
    }
  });
}


export function automaticPersist(context: RequestContext, data: any, onSave: (data: any) => any) {
  if (!!data) {
    optional(() => restoreSnapshot(context, JSON.parse(data)));
  }
  ['visibilitychange', 'pagehide', 'freeze'].forEach((type) => {
    window.addEventListener(type, () => {
      if (type === 'visibilitychange' && document.visibilityState === 'visible') return;
      onSave(JSON.stringify(getSnapshot(context)));
    }, {capture: true});
  });
}
