import { http, HttpResponse } from 'msw'
import { todoMocks } from './todo';

/**
 * Register one MSW handler per mocked endpoint, matched by method + path.
 *
 * Deliberately NOT a catch-all (`http.all('*')`): a wildcard intercepts EVERY
 * request — including SPA navigation documents like `/yoltra` and the devtools
 * agent's own traffic — and MSW cannot passthrough a `navigate`-mode request,
 * which throws "Failed to fetch". Scoping handlers to the real API endpoints
 * leaves everything else untouched (see `onUnhandledRequest: 'bypass'`).
 */
export const handlers = todoMocks.map((mock) => {
    const method = mock.method.toLowerCase() as Lowercase<typeof mock.method>;
    // Match on origin + pathname; query params are matched loosely by MSW.
    const { origin, pathname } = new URL(mock.url);
    const { body, ...options } = mock.response;

    return http[method](`${origin}${pathname}`, () => HttpResponse.json(body, options));
});
