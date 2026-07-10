
export interface iMockResponse {
    status: number;
    statusText: string;
    headers: HeadersInit;
    body: Record<string, unknown> | unknown[] | Blob
    | ArrayBuffer
    | FormData
    | ReadableStream
    | URLSearchParams
    | string
    | null
    | undefined;
}

export interface iMockSpec {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
    url: string;
    body?: Record<string, never>;
    headers: HeadersInit;
    response: iMockResponse;
}

export const fetchTodoes: iMockSpec = {
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/todos?id=0?offset=0&limit=10",
    headers: {
        Accept: "application/json"
    },
    response: {
        status: 200,
        statusText: "success",
        headers: {
            ContentType: "application/json",
        },
        body: [
            {
                "id": 1,
                "title": "delectus aut autem",
                "completed": false
            },
            {
                "id": 2,
                "title": "quis ut nam facilis et officia qui",
                "completed": false
            },
            {
                "id": 3,
                "title": "fugiat veniam minus",
                "completed": false
            },
            {
                "id": 4,
                "title": "et porro tempora",
                "completed": true
            },
            {
                "id": 5,
                "title": "laboriosam mollitia et enim quasi adipisci quia provident illum",
                "completed": false
            },
            {
                "id": 6,
                "title": "qui ullam ratione quibusdam voluptatem quia omnis",
                "completed": false
            },
            {
                "id": 7,
                "title": "illo expedita consequatur quia in",
                "completed": false
            },
            {
                "id": 8,
                "title": "quo adipisci enim quam ut ab",
                "completed": true
            },
            {
                "id": 9,
                "title": "molestiae perspiciatis ipsa",
                "completed": false
            },
            {
                "id": 10,
                "title": "illo est ratione doloremque quia maiores aut",
                "completed": true
            },
            {
                "id": 11,
                "title": "vero rerum temporibus dolor",
                "completed": true
            },
        ]
    }
};