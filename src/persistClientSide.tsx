import {clientDecrypt, clientEncrypt} from "./helpers/clientRead";
import {RequestContext} from "./requestContext";
import {metadataOf} from "./shared";
import {Client} from "./client";
import {gatherMethods} from "./service";

export const saveInitialValues = (context: RequestContext) => {
  return context.services.reduce((acc, service) => {
    const {id, persist = []} = metadataOf(service);
    if (persist.length > 0) {
      const obj: any = {};
      persist.forEach((data: any) => {
        const {key} = data;
        obj[key] = service[key];
      });
      acc[id] = obj;
    }
    return acc;
  }, {} as any);
};

export const registerPersistClient = (context: RequestContext, initial: any) => {
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
  Client.drainService = (service) => {
    const {id} = metadataOf(service);
    const key = `${context.storagePrefix}_bridge${id}`;
    localStorage.removeItem(key)
  };

  Client.reset = (service) => {
    if(service) {
      const {id} = metadataOf(service);
      const saved = initial[id];
      Object.keys(saved).forEach((key) => {
        context.services[id][key] = saved[key];
      });
    }else {
      Object.keys(initial).forEach((id) => {
        const saved = initial[id];
        Object.keys(saved).forEach((key) => {
          context.services[+id][key] = saved[key];
        });
      })
    }
  };
  let lock = false;
  function lockedSave() {
    if (!lock) {
      lock = true;
      gatherMethods(context, 'serviceWillUnload').then(()=>{
        Client.persist();
      }).catch((e)=>{
        console.error(e);
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
    context.services.forEach((service) => {
      const {id, persist = []} = metadataOf(service);
      if (persist.length > 0) {
        try {
          const key = `${context.storagePrefix}_bridge${id}`;
          const data = localStorage.getItem(key);
          if (data) {
            const content = clientDecrypt(data, key, context.encrypt);
            const json = JSON.parse(content);
            if (version != context.version && service.migrate) {
                service.migrate.apply(service, json, version, context.version)
            }else {
              persist.forEach((data: any) => {
                const {key} = data;
                if (typeof json[key] !== 'undefined' && json[key] !== null) {
                  service[key] = json[key];
                }
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
    if (version != context.version) {
      localStorage.setItem(versionKey, context.version.toString());
    }
  }
};
