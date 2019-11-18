import React, {PureComponent} from "react";
import {Action, createBrowserHistory, Location} from "history";
import {baseUrl} from "./helpers/viewState";
import {Router} from "react-router";
import {RoutingService} from "./routingService";
import {Consumer, AutoWired, Observe} from "./ioc";

export type ConnectedRouterProps = {}

@Consumer
export class ConnectedRouter extends PureComponent<ConnectedRouterProps> {
  unsubscribe: any = null;
  routing = AutoWired(RoutingService, this);

  constructor(props: ConnectedRouterProps, context: any) {
    super(props, context);
    const history = createBrowserHistory({
      basename: baseUrl,
    });
    this.routing.history = history;
    const handleLocationChange = (location: Location, action: Action, isFirstRendering = false) => {
      if (!this.routing.inTimeTravelling) {
        this.routing.dummy = {
          action,
          location,
          isFirstRendering,
        };
      } else {
        this.routing.inTimeTravelling = false;
      }
    };
    this.unsubscribe = history.listen(handleLocationChange);
    handleLocationChange(history.location, history.action, true);
  }

  @Observe(RoutingService)
  observer = () => {
    const history = this.routing.history;
    const {
      pathname: pathnameInStore,
      search: searchInStore,
      hash: hashInStore,
    } = this.routing.dummy.location;
    const {
      pathname: pathnameInHistory,
      search: searchInHistory,
      hash: hashInHistory,
    } = history.location;

    if (pathnameInHistory !== pathnameInStore || searchInHistory !== searchInStore || hashInHistory !== hashInStore) {
      this.routing.inTimeTravelling = true;
      history[this.routing.dummy.action == 'PUSH' ? 'push' : 'replace']({
        pathname: pathnameInStore,
        search: searchInStore,
        hash: hashInStore,
      })
    }
  };

  componentWillUnmount(): void {
    this.unsubscribe && this.unsubscribe();
  }

  render() {
    const {children} = this.props;
    const {history} = this.routing;
    return <Router history={history}>
      {children}
    </Router>;
  }
}
