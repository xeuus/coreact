import {RequestContext} from "./requestContext";
import {metadataOf} from "./shared";

export async function invoke(context: RequestContext, target: any, name: string, ...args: any[]) {
    const {id} = metadataOf(target.prototype);
    const service = context.services[id];
    return await service[name].apply(service, args);
}

export async function invokeAll(context: RequestContext, type: 'linear' | 'parallel' | 'all' | 'race', name: string, ...args: any[]) {
    const pm = context.services.reduce((acc, service) => {
        const {order = 0, id} = metadataOf(service);
        if (typeof service[name] === 'function') {
            acc.push([id, order, service]);
        }
        return acc;
    }, []).sort((a: any, b: any) => a[1] - b[1]);
    const result: any = {};
    if (type === 'linear') {
        for (let obj of pm) {
            result[obj[0]] = await obj[2][name].apply(obj[2], args);
        }
    } else if (type === 'parallel') {
        const a = await Promise.all(pm.map((obj: any) => obj[2][name].apply(obj[2], args)));
        pm.forEach((obj: any, i: number) => {
            result[obj[0]] = a[i];
        })
    } else if (type === 'race') {
        return await Promise.race(pm.map((obj: any) => obj[2][name].apply(obj[2], args)));
    } else if (type === 'all') {
        for (let obj of pm) {
            obj[2][name].apply(obj[2], args);
        }
    }
    return result;
}
