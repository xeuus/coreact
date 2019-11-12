import {clientDecrypt, clientEncrypt} from "./helpers/clientRead";
import {metadataOf} from "./ioc";
import {RequestContext} from "./requestContext";

export let persistChanges = () => {
};
export let clearStorage = () => {
};

export const registerPersistClient = (context: RequestContext) => {
  persistChanges = () => {
    context.services.forEach((service) => {
      const {id, persist = []} = metadataOf(service);
      if (persist.length > 0) {
        const obj: any = {};
        persist.forEach((data: any) => {
          const {key} = data;
          obj[key] = service[key];
        });
        const key = `${context.storagePrefix}_bridge${id}`;
        const data = clientEncrypt(JSON.stringify(obj), key);
        localStorage.setItem(key, data);
      }
    });
  };

  clearStorage = () => {
    context.services.forEach((service) => {
      const {id} = metadataOf(service);
      const key = `${context.storagePrefix}_bridge${id}`;
      localStorage.removeItem(key)
    });
  };

  let lock = false;

  function lockedSave() {
    if (!lock) {
      lock = true;
      persistChanges();
    }
  }

  window.addEventListener('beforeunload', lockedSave);
  window.addEventListener('pagehide', lockedSave);
  window.addEventListener('visibilitychange', lockedSave);
};

export const restorePersistedDataOnClientSide = (context: RequestContext) => {
  context.services.forEach((service) => {
    const {id, persist = []} = metadataOf(service);
    if (persist.length > 0) {
      if (typeof window.localStorage != undefined) {
        try {
          const key = `${context.storagePrefix}_bridge${id}`;
          const data = localStorage.getItem(key);
          if (!!data) {
            const content = clientDecrypt(data, key);
            const json = JSON.parse(content);
            persist.forEach((data: any) => {
              const {key} = data;
              if (json[key]) {
                service[key] = json[key];
              }
            });
          }
        } catch (e) {
        }
      }
    }
  });
};
