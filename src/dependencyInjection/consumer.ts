import React, { Component, useContext } from 'react';
import { container } from './container';
import { AppContext } from './appContext';
import { RequestContext } from './requestContext';
import { BaseService } from './baseService';
import { Bus } from '../observer/bus';

export function Consumer<T extends typeof Component>(consumer: T) {
  const original = consumer;
  var f: any = function (...args: any[]) {
    const context = args[1] as RequestContext;
    const mounts = <Function[]>[];
    const unmounts = <Function[]>[];
    const instantiates = <Function[]>[];
    const unsubscribes = <Function[]>[];

    Object.getOwnPropertyNames(consumer.prototype).forEach((key: string) => {
      if (typeof key === 'string') {
        if (key.indexOf('__service__') === 0) {
          const actualKey = key.substr(11);
          const id = (consumer.prototype as any)[key];
          const Service = container.services[id] as (typeof BaseService);
          const { __serviceType__ } = Service as any;
          let instance = null;
          switch (__serviceType__) {
            case 'request':
              instance = context.services[id] as BaseService;
              break;
            case 'singleton':
              instance = container.singletons[id] as BaseService;
              break;
            case 'prototype':
              instance = new Service(context);
              instantiates.push(instance.instantiate);
              mounts.push(instance.mount);
              unmounts.push(instance.unmount);
              break;
          }
          Object.defineProperty(this, actualKey, {
            writable: false,
            value: instance,
            configurable: false,
            enumerable: false
          })
        } else if (key.indexOf('__observer__') === 0) {
          const actualKey = key.substr(12);
          const id = (consumer.prototype as any)[key];
          context.observers[id] = context.observers[id] || new Bus();
          const bus = context.observers[id] as Bus;

          unsubscribes.push(bus.listen('*', ({ key, value }) => {
            if (this && this[actualKey]) {
              const oldState = (bus as any).__state__ || {};
              const newState = {
                ...oldState,
                [key]: value,
              };
              this[actualKey](newState);
              Object.defineProperty(bus, '__state__', {
                configurable: true,
                writable: false,
                enumerable: false,
                value: newState,
              });
            }
          }));


        }
      }
    });
    instantiates.forEach(a => a.bind(this)());
    const originalDidMount = this.componentDidMount;
    if (originalDidMount) {
      this.componentDidMount = function (...args: any[]) {
        mounts.forEach(a => a.bind(this)());
        return originalDidMount.apply(this, args as any);
      }
    }
    const originalWillUnmount = this.componentWillUnmount;
    if (originalWillUnmount) {
      this.componentWillUnmount = function (...args: any[]) {
        unmounts.forEach(a => a.bind(this)());
        return originalWillUnmount.apply(this, args as any);
      }
    }

    return original.apply(this, args as any)
  }
  f.contextType = AppContext;
  f.prototype = original.prototype;
  return f
}
