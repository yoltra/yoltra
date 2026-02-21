import type React from "react";
import { useMemo } from "react";
import { useSelector } from "react-redux";

import type { iTodo } from "../../../types";
import type { AppState } from "../../../state/redux/store";
import { TodoItem } from "../todoItem/TodoItem";

import "./TodoList.style.scss";

export interface iTodoListProps {}

export const TodoList: React.FC<iTodoListProps> = () => {
  const data = useSelector((s: AppState) => s.todo.data);
  const filter = useSelector((s: AppState) => s.todo.filter);

  const filteredData = useMemo<iTodo[]>(() => {
    const items = Object.values(data);

    const hasCategory = !!filter.selectedCategory;
    const hasStatus = filter.selectedStatus !== "" && filter.selectedStatus !== "ALL";

    if (!hasCategory && !hasStatus) return items;

    const selStatusStr = String(filter.selectedStatus);

    return items.filter(
      (t) =>
        (!hasCategory || t.category === filter.selectedCategory) &&
        (!hasStatus || String(t.status) === selStatusStr)
    );
  }, [data, filter.selectedCategory, filter.selectedStatus]);

  const contentMarkup =
    filteredData.length > 0 ? (
      filteredData.map((todoItem: iTodo) => (
        <TodoItem key={todoItem.id} id={todoItem.id} />
      ))
    ) : (
     <p>no items</p>
    );

  return (
    <div className="todo-list">
      {contentMarkup}
    </div>
  );
};
