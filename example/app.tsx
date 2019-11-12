import React, {Component, Fragment} from 'react';
import {consumer, fromQuery, fromUrl, inject, match, observe, optional, range, RequestContext, RoutingService, service, Service} from '../src';

export type AppProps = {
  name: string;
}


@service
export class Home extends Service {
  routingService = inject(RoutingService, this);
  @fromQuery page: number = 0;

  @fromUrl('/:a?/:b?/:c?') a: string = undefined;
  @fromUrl('/:a?/:b?/:c?') b: string = undefined;
  @fromUrl('/:a?/:b?/:c?') c: string = undefined;


  @match('/hello')
  data = async (context: RequestContext) => {
    console.log('call');
  };

}

@consumer
export class App extends Component<AppProps> {
  routingService = inject(RoutingService, this);
  home = inject(Home, this);

  @observe(Home)
  observer = (key: string, value: any) => {
    console.log(key, value)
    this.forceUpdate();
  };

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
      <div>{this.home.a}</div>
      <div>{this.home.b}</div>
      <div>{this.home.c}</div>
    </Fragment>
  }
}
