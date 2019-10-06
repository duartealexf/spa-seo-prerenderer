import { IncomingMessage } from 'http';
import { TLSSocket } from 'tls';
import { URL } from 'url';

/**
 * Get header from request.
 * @param request
 * @param header
 */
export const getRequestHeader = (request: IncomingMessage, header: string): string => {
  const headerEntry = Object.entries(request.headers).find(([k]) => k.toLowerCase() === header);

  if (!headerEntry) {
    return '';
  }

  let [, headerValue] = headerEntry;
  headerValue = Array.isArray(headerValue) ? headerValue.join(',') : headerValue;

  return headerValue || '';
};

/**
 * Parse URL from given request, considering eventual x-forwarded headers.
 * @param request
 */
export const parseRequestURL = (request: IncomingMessage): URL => {
  let protocol = getRequestHeader(request, 'x-forwarded-proto');
  let host = getRequestHeader(request, 'x-forwarded-host');
  let port = getRequestHeader(request, 'x-forwarded-port');

  const path = request.url || '/';

  if (!protocol) {
    protocol =
      request.connection instanceof TLSSocket && request.connection.encrypted ? 'https' : 'http';
  }

  /**
   * Adapted from express hostname getter.
   */
  const hostAndMaybePort = getRequestHeader(request, 'host');
  const offset = hostAndMaybePort[0] === '[' ? hostAndMaybePort.indexOf(']') + 1 : 0;
  const index = hostAndMaybePort.indexOf(':', offset);

  if (!host) {
    host = index !== -1 ? hostAndMaybePort.substring(0, index) : hostAndMaybePort;
  }

  if (!port) {
    port = index !== -1 ? hostAndMaybePort.substring(index + 1) : port;

    if (!port) {
      port = request.connection.localPort.toString();
    }
  }

  if (port === '80' || port === '433') {
    port = '';
  } else {
    port = `:${port}`;
  }

  return new URL(`${protocol}://${host}${port}${path}`);
};
