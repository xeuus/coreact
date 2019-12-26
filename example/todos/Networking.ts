import axios from "axios";
import {HttpRequest, HttpResponse, NetLayer} from 'netlayer';
import {optional, Order, RequestContext, Service} from "../../src";

@Service
@Order(Number.NEGATIVE_INFINITY)
export class Networking extends NetLayer {

  constructor(context: RequestContext) {
    super();
    this.driver = async (request: HttpRequest): Promise<HttpResponse> => {
      try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        const response = await axios({
          url: request.url,
          method: request.method || 'GET',
          data: ['PUT', 'POST'].includes(request.method) ? request.payload : {},
          params: ['DELETE', 'GET'].includes(request.method) ? request.payload : {},
          timeout: request.timeout || 15000,
          withCredentials: request.withCredentials || false,
          responseType: request.responseType || 'json',
          baseURL: request.baseHref || context.proxies.default,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers,
          }
        });
        return {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          payload: response.data,
        };
      } catch (e) {
        const error = e as any;
        const result = {
          status: optional(() => error.response.status),
          statusText: optional(() => error.response.statusText),
          errorCode: optional(() => error.code),
          headers: optional(() => error.response.headers),
          payload: optional(() => error.response.data),
        };
        throw result as HttpResponse;
      }
    };
  }
}