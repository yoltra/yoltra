import { useEffect } from "react";

import { TodoList } from "./todoList/TodoList";
import { TodoFactory } from "./todoFactory/TodoFactory";
import { TodoFilter } from "./todoFilter/TodoFilter";
import { store, useTodoEvents } from "../../state/yoltra";
import { AppStoreContext } from "../../state/yoltra/Store.context";

export interface iyoltraTodoPageProps { }

export const yoltraTodoPage: React.FC<iyoltraTodoPageProps> = (_: iyoltraTodoPageProps) => {
    const { fetchTodos } = useTodoEvents();

    useEffect(() => {
        fetchTodos();
    }, []);

    return (
        <AppStoreContext.Provider value={store}>
            <div>
                <h2>Yoltra's TODOs</h2>
                <TodoFactory />
                <TodoFilter />
                <TodoList />
            </div>
        </AppStoreContext.Provider>
    );
};
