import React, { Component, useContext } from 'react';
import { container } from './container';
import { AppContext } from './appContext';
import { RequestContext } from './requestContext';

export function Consumer<T extends typeof Component>(target: T) {
  const original = target;
  var f: any = function (...args: any[]) {
    const context = args[1] as RequestContext;
    Object.getOwnPropertyNames(target.prototype).forEach((key: string) => {
      if (typeof key === 'string' && key.startsWith('__descriptor__')) {
        const actualKey = key.substr(14);
        const id = (target.prototype as any)[key];
        const Service = container.services[id];
        const { __serviceType__ } = Service;
        let instance = null;
        switch (__serviceType__) {
          case 'request':
            instance = context.services[id];
            break;
          case 'singleton':
            instance = container.singletons[id];
            break;
          case 'prototype':
            instance = new Service();
            break;
        }
        Object.defineProperty(this, actualKey, {
          writable: false,
          value: instance,
          configurable: false,
          enumerable: false
        })
      }
    });
    return original.apply(this, args as any)
  }
  f.contextType = AppContext;
  f.prototype = original.prototype;
  return f
}
