import { useEffect } from "react";

import { store, useTodoEvents } from "../../state/yoltra";
import { AppStoreContext } from "../../state/yoltra/Store.context";
import { TodoFactory } from "./todoFactory/TodoFactory";
import { TodoFilter } from "./todoFilter/TodoFilter";
import { TodoList } from "./todoList/TodoList";

export interface iYoltraTodoPageProps {}

export const YoltraTodoPage: React.FC<iYoltraTodoPageProps> = (_: iYoltraTodoPageProps) => {
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
