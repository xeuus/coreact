import React, {Component, useContext} from 'react';
import {AppContext} from "../appContext";
import {BaseService} from "./baseService";

export function ViewLayer<T extends typeof Component>(target: T) {
  const a = class extends Component {
    static contextType = AppContext;
    render() {
      const {children, ...props} = this.props;
      return React.createElement(target, {...props, ____context: this.context} as any, children)
    }
  };
  return a as any;
}
