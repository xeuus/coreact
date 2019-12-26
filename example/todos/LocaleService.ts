import {Client, Order, RequestContext, Service, ServiceEvents} from "../../src";

@Service
@Order(Number.NEGATIVE_INFINITY)
export class LocaleService implements ServiceEvents {
  context: RequestContext;
  async serviceWillLoad(context: RequestContext) {
    context.locale = context.cookies.locale || 'en';
  }
  get locale() {
    return this.context.locale;
  }
  set locale(value: string) {
    this.context.locale = value;
    this.context.cookies = {
      ...this.context.cookies,
      locale: value,
    }
  }
}