import { useEffect } from "react";

import { TodoList } from "./todoList/TodoList";
import { TodoFactory } from "./todoFactory/TodoFactory";
import { TodoFilter } from "./todoFilter/TodoFilter";
import { store, useTodoEvents } from "../../state/quojs";
import { AppStoreContext } from "../../state/quojs/Store.context";

export interface iQuojsTodoPageProps { }

export const QuojsTodoPage: React.FC<iQuojsTodoPageProps> = (_: iQuojsTodoPageProps) => {
    const { fetchTodos } = useTodoEvents();

    useEffect(() => {
        fetchTodos();
    }, []);

    return (
        <AppStoreContext.Provider value={store}>
            <div>
                <h2>Quo.js's TODOs</h2>
                <TodoFactory />
                <TodoFilter />
                <TodoList />
            </div>
        </AppStoreContext.Provider>
    );
};
