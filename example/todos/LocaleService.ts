import {Client, observable, Order, Ordered, RequestContext, Bean, Service} from "../../src";

@Bean
@Order(Ordered.HIGHEST_PRECEDENCE)
export class LocaleService extends Service {
  @observable private _idx = false;
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
