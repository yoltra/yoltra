import type React from "react";
import { useMemo } from "react";

import type { iFilterState, iTodo } from "../../../types";
import { TodoItem } from "../todoItem/TodoItem";

import "./TodoList.style.scss";
import { useAtomicProps } from "../../../state/quojs/hooks";

export interface iTodoListProps { }

export const TodoList: React.FC<iTodoListProps> = (_: iTodoListProps) => {
    const { data, filter } = useAtomicProps(
        [
            { reducer: "todo", property: "filter" },
        ],
        ({ todo }) => ({
            data: todo.data as Record<string, iTodo>,
            filter: todo.filter as iFilterState
        })
    );

    const filteredData = useMemo<iTodo[]>(() => {
        const items = Object.values(data);

        const hasCategory = !!filter.selectedCategory;
        const hasStatus =
            filter.selectedStatus !== "" && filter.selectedStatus !== "ALL";

        // nothing selected, return everything
        if (!hasCategory && !hasStatus) return items;

        const selStatusStr = String(filter.selectedStatus);

        return items.filter((t) =>
            (!hasCategory || t.category === filter.selectedCategory) &&
            (!hasStatus || String(t.status) === selStatusStr)
        );
    }, [data, filter.selectedCategory, filter.selectedStatus]);


    const contentMarkup = filteredData.length ? filteredData.map((todoItem: iTodo) => {
        const todoProps: iTodo = todoItem as unknown as iTodo;

        return (
            <TodoItem
                key={todoProps.id}
                id={todoProps.id}
            />
        )
    }) : (
        <p>no items</p>
    );

    return (
        <div className="todo-list">
            {contentMarkup}
        </div>
    );
};
