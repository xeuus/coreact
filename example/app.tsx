import React, {Component, Fragment} from 'react';
import {bindUrl, fromQuery, inject, match, observant, optional, range, RequestContext, RoutingService, service, Service} from '../src';

export type AppProps = {
  name: string;
}


@service
export class Home extends Service {
  routingService = inject(RoutingService, this);
  @fromQuery page: number = 0;
  @bindUrl('/hello/:b?/:c?') bulk: any = undefined;

  @match('/hello/:b?/:c?')
  data = async (context: RequestContext, params: any) => {

  };
}

@observant([Home], 'page')
export class App extends Component<AppProps> {
  routingService = inject(RoutingService, this);
  home = inject(Home, this);

  render() {
    return <Fragment>
      {range(10).map(a => {
        return <button key={a} onClick={() => {
          optional(() => {
            this.routingService.replace({
              page: a
            })
          });

        }}>{a}</button>
      })}
      <button onClick={() => this.routingService.replace('/hello')}>hello</button>
      <div>{this.home.page}</div>
      <div>{JSON.stringify(this.home.bulk)}</div>
    </Fragment>
  }
}
