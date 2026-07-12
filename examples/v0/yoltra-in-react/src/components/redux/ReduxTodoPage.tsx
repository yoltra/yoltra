import { useEffect } from "react";

import { useTodoActions } from "../../state/redux";

import { TodoList } from "./todoList/TodoList";
import { TodoFactory } from "./todoFactory/TodoFactory";
import { TodoFilter } from "./todoFilter/TodoFilter";

export interface iReduxTodoPageProps {}

export const ReduxTodoPage: React.FC<iReduxTodoPageProps> = () => {
  const { fetchTodos } = useTodoActions();

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <div className="todo-page">
      <h2>RTK TODOs</h2>
      <TodoFactory />
      <TodoFilter />
      <TodoList />
    </div>
  );
};
