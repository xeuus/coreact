import React, {Component, Fragment} from 'react';
import {consumer, fromQuery, inject, match, observe, optional, range, RequestContext, RoutingService, service, Service} from '../src';

export type AppProps = {
  name: string;
}


@service
export class Home extends Service {
  routingService = inject(RoutingService, this);
  @fromQuery page = 0;


  @match('/hello')
  data = (context: RequestContext)=>{

    console.log(context.url);
  }
}

@consumer
export class App extends Component<AppProps> {
  routingService = inject(RoutingService, this);
  home = inject(Home, this);

  @observe(Home, 'page')
  observer = () => {
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
      <button onClick={()=>this.routingService.replace('/hello')}>hello</button>
      <div>{this.home.page}</div>
    </Fragment>
  }
}
