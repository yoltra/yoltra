import { useEffect } from "react";

import { useTodoEvents } from "../../state/yoltra";
import { TodoFactory } from "./todoFactory/TodoFactory";
import { TodoFilter } from "./todoFilter/TodoFilter";
import { TodoList } from "./todoList/TodoList";

export interface iYoltraTodoPageProps {}

export const YoltraTodoPage: React.FC<iYoltraTodoPageProps> = (_: iYoltraTodoPageProps) => {
  const { fetchTodos } = useTodoEvents();

  useEffect(() => {
    fetchTodos();
  }, []);

  // No Provider — createYoltra's hooks default to the store in state/yoltra.
  return (
    <div className="todo-page">
      <h2>Yoltra's TODOs</h2>
      <TodoFactory />
      <TodoFilter />
      <TodoList />
    </div>
  );
};
