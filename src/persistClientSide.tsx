import {clientDecrypt, clientEncrypt} from "./helpers/clientRead";
import {RequestContext} from "./requestContext";
import {metadataOf} from "./shared";
import {Client} from "./client";


export const registerPersistClient = (context: RequestContext) => {
  Client.Persist = () => {
    context.services.forEach((service) => {
      const {id, persist = []} = metadataOf(service);
      if (persist.length > 0) {
        const obj: any = {};
        persist.forEach((data: any) => {
          const {key} = data;
          obj[key] = service[key];
        });
        const key = `${context.storagePrefix}_bridge${id}`;
        const data = clientEncrypt(JSON.stringify(obj), key, context.encrypt);
        localStorage.setItem(key, data);
      }
    });
  };

  Client.ClearStorage = () => {
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
      Client.Persist();
    }
  }

  window.addEventListener('beforeunload', lockedSave);
  window.addEventListener('pagehide', lockedSave);
  window.addEventListener('visibilitychange', lockedSave);
};

export const restorePersistedDataOnClientSide = (context: RequestContext) => {

  if (typeof window.localStorage != undefined) {
    const version = localStorage.getItem(`${context.storagePrefix}_version`) || 1;
    if (version != context.version) {
      context.services.forEach((service) => {
        const {id} = metadataOf(service);
        localStorage.removeItem(`${context.storagePrefix}_bridge${id}`)
      });
      localStorage.setItem(`${context.storagePrefix}_version`, context.version.toString());
      return
    }
    context.services.forEach((service) => {
      const {id, persist = []} = metadataOf(service);
      if (persist.length > 0) {
        try {
          const key = `${context.storagePrefix}_bridge${id}`;
          const data = localStorage.getItem(key);
          if (data) {
            const content = clientDecrypt(data, key, context.encrypt);
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
    });
  }
};
