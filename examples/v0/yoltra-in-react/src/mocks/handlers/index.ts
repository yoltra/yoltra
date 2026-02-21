import { http, HttpResponse } from 'msw'
import { todoMocks } from './todo';

const mockRegistry = new Map<string, any>(todoMocks.map(
    (mock) => {
        const { method, url, body = null, response } = mock;
        const { pathname, search } = new URL(url);
        const jsonBody = JSON.stringify(body, null);
        const id = `${method} ${pathname}${search} ${jsonBody}`;

        return [id, response];
    }
))

const rootHandler = http.all('*', ({ request }) => {
    const { method, body = null, url } = request;
    const { pathname, search } = new URL(url);
    const jsonBody = JSON.stringify(body, null);
    const id = `${method} ${pathname}${search} ${jsonBody}`;

    if (mockRegistry.has(id)) {
        const response = mockRegistry.get(id);
        const { body, ...options } = response;

        return HttpResponse.json(body, options);
    }

});

export const handlers = [
    rootHandler
];
