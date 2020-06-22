import React, {PureComponent} from "react";
import {Action, createBrowserHistory, Location} from "history";
import {baseUrl} from "./helpers/viewState";
import {Router} from "react-router";
import {RoutingService} from "./routingService";
import {pick, Bundle, observe, Observer} from "./ioc";
export type ConnectedRouterProps = {}
@Bundle
export class ConnectedRouter extends PureComponent<ConnectedRouterProps> {
  unsubscribe: any = null;
  routing = pick(RoutingService, this);
  constructor(props: ConnectedRouterProps, context: any) {
    super(props, context);
    const history = createBrowserHistory({
      basename: baseUrl,
    });
    this.routing.history = history;
    const handleLocationChange = (location: Location, action: Action, isFirstRendering = false) => {
      if (!this.routing.inTimeTravelling) {
        this.routing.state = {
          action,
          location,
          isFirstRendering,
        };
        this.routing.proceed();
      } else {
        this.routing.inTimeTravelling = false;
      }
    };
    this.unsubscribe = history.listen(handleLocationChange);
    handleLocationChange(history.location, history.action, true);
  }
  @observe([RoutingService])
  observer = () => {
    const history = this.routing.history;
    const {
      pathname: pathnameInStore,
      search: searchInStore,
      hash: hashInStore,
    } = this.routing.state.location;
    const {
      pathname: pathnameInHistory,
      search: searchInHistory,
      hash: hashInHistory,
    } = history.location;
    if (pathnameInHistory !== pathnameInStore || searchInHistory !== searchInStore || hashInHistory !== hashInStore) {
      this.routing.inTimeTravelling = true;
      history[this.routing.state.action == 'PUSH' ? 'push' : 'replace']({
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
