import {Client, Observable, Order, Ordered, RequestContext, Service, ServiceEvents} from "../../src";

@Service
@Order(Ordered.HIGHEST_PRECEDENCE)
export class LocaleService implements ServiceEvents {
  @Observable private _idx = false;
  private context: RequestContext;
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
    };
    this._idx = !this._idx;
  }
}