import React, {Component, Fragment} from 'react';
import {bindUrl, fromQuery, inject, match, observant, range, RequestContext, RoutingService, service, Service} from '../src';

export type AppProps = {
  name: string;
}


@service
export class Home extends Service {
  routingService = inject(RoutingService, this);
  @fromQuery page: number = 0;
  @bindUrl('/(buy|rent)/:city?/:area?', 'city') city: any = undefined;
  @bindUrl('/(buy|rent)/:city?/:area?', 'area') area: any = undefined;
}

@observant([Home])
export class App extends Component<AppProps> {
  routingService = inject(RoutingService, this);
  home = inject(Home, this);

  componentDidUpdate(prevProps: Readonly<AppProps>, prevState: Readonly<{}>, snapshot?: any): void {
    console.log(this.home.city)
  }

  render() {
    return <Fragment>
      {range(10).map(a => {
        return <button key={a} onClick={() => {
          this.home.page = a;
        }}>{a}</button>
      })}
      <button onClick={() => {
        this.home.city = 'ahwaz';
      }}>ahwaz</button>
      <button onClick={() => {
        this.home.city = 'tehran';
      }}>tehran</button>
      <button onClick={() => {
        this.home.city = undefined;
      }}>undef</button>
      <button onClick={() => {
        this.home.area = 'amanie';
      }}>amanie</button>
      <button onClick={() => {
        this.home.area = 'jordan';
      }}>jordan</button>
    </Fragment>
  }
}
