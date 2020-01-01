import './debugger.sass';
import {RequestContext} from "../requestContext";
import {optional} from "..";

function createElement(className: string, other?: HTMLElement) {
  const el = document.createElement('div');
  el.setAttribute('class', className);
  if (!other)
    other = document.documentElement;
  other.appendChild(el);
  return el;
}

function createPre(className: string, other?: HTMLElement) {
  const el = document.createElement('pre');
  el.setAttribute('class', className);
  if (!other)
    other = document.documentElement;
  other.appendChild(el);
  return el;
}

function serviceName(service: any) {
  return optional(() => service.__proto__.constructor.name+'-'+service.__metadata__.id)
}

export function RegisterDebugger(context: RequestContext) {
  if (context.environment == 'server')
    return;
  const services = context.services;
  const wrapper = createElement('debugger-container');
  wrapper.setAttribute('dir', 'ltr');
  const trigger = createElement('debugger-trigger-button', wrapper);

  trigger.onclick = () => {
    wrapper.classList.toggle('active');
  };

  const tabs = createElement('debugger-tabs', wrapper);
  const content = createElement('debugger-tabs properties', wrapper);
  const data = createPre('debugger-data',wrapper);

  const tabsList: HTMLElement[] = [];
  if (services.length > 0) {
    const selectTab = (tab: HTMLElement) => {
      tabsList.forEach(a => a.classList.remove('active'));
      tab.classList.add('active');
    };
    services.forEach(service => {
      const name = serviceName(service);
      const tab = createElement('tab-item', tabs);
      tab.innerText = name;
      tabsList.push(tab);
      tab.onclick = () => {
        selectTab(tab);
        changeTab(name, service);
      };
    });
    selectTab(tabsList[0]);
    changeTab(serviceName(services[0]), services[0]);
  }

  function changeProperty(name: string, property: string, service: any) {
    if(service.context){

    }
    if(property === 'context'){
      const clone = {
        ...service[property],
        services: undefined,
      };
      data.innerText = JSON.stringify(clone, null, '  ');
    }else {
      data.innerText = JSON.stringify(service[property], null, '  ');
    }
  }

  function changeTab(name: string, service: any) {
    content.innerHTML = '';

    const propertyList: any[] = [];
    const selectTab = (property: HTMLElement) => {
      propertyList.forEach(a => a.element.classList.remove('active'));
      property.classList.add('active');
    };
    const names= Object.getOwnPropertyNames(service);
    if(names.length > 0) {
      names.forEach(p => {
        if(typeof service[p] === 'function' || p.startsWith('$'))
          return;
        const property = createElement('tab-item', content);
        property.innerText = p;
        propertyList.push({
          element: property,
          name: p,
        });
        property.onclick = () => {
          selectTab(property);
          changeProperty(name, p, service);
        };
      });
      if (propertyList.length > 0) {
        selectTab(propertyList[0].element);
        changeProperty(name, propertyList[0].name, service);
      }
    }
  }
}