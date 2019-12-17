import {clientDecrypt, clientEncrypt} from "./helpers/clientRead";
import {RequestContext} from "./requestContext";
import {metadataOf} from "./shared";
import {Client} from "./client";
import {gatherMethods} from "./service";
export const registerPersistClient = (context: RequestContext) => {
  Client.persist = () => {
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
  Client.clearStorage = () => {
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
      gatherMethods(context, 'serviceWillUnload').then(()=>{
        Client.persist();
      }).catch((e)=>{
        console.error(e)
        Client.persist();
      });
    }
  }
  window.addEventListener('beforeunload', lockedSave);
  window.addEventListener('pagehide', lockedSave);
  window.addEventListener('visibilitychange', lockedSave);
};
export const restorePersistedDataOnClientSide = (context: RequestContext) => {
  if (typeof window.localStorage != undefined) {
    const versionKey = `${context.storagePrefix}_version`;
    const version = localStorage.getItem(versionKey) || 1;

    if (version != context.version) {
      context.services.forEach((service) => {
        const {id} = metadataOf(service);
        try {
          const key = `${context.storagePrefix}_bridge${id}`;
          if(service.migrate) {
            const data = localStorage.getItem(key);
            if (data) {
              const content = clientDecrypt(data, key, context.encrypt);
              const json = JSON.parse(content);
              service.migrate.apply(service, json, version)
            }
          }
          localStorage.removeItem(key)
        }catch (e) {
          console.error(e);
        }
      });
      localStorage.setItem(versionKey, context.version.toString());
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
              if (typeof json[key] !== 'undefined' && json[key] !== null) {
                service[key] = json[key];
              }
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  }
};
