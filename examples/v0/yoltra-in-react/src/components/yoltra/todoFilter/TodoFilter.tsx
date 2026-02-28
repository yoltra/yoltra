import type { ChangeEvent } from "react";

import { eTodoStatus, type iFilterState } from "../../../types";
import { useEmit, useAtomicProps } from "../../../state/yoltra/hooks";

import "./TodoFilter.style.scss";

interface iTodoFilterPorps { }

export const TodoFilter = (_: iTodoFilterPorps) => {
    const emit = useEmit();
    const { filter } = useAtomicProps(
        [
            { reducer: "todo", property: "filter" },
        ],
        ({ todo }) => ({
            filter: todo.filter as iFilterState,
        })
    );

    const handleCategorySelectionChange = ({ target }: ChangeEvent<HTMLSelectElement>) => {
        emit("todo", "setCategoryFilter", { by: target.value });
    };

    const handleStatusSelectionChange = ({ target }: ChangeEvent<HTMLSelectElement>) => {
        emit("todo", "setStatusFilter", { by: target.value as unknown as eTodoStatus });
    };

    return (
        <div className="todo-filter">
            <h3>Filter by:</h3>
            <div>
                <label htmlFor="categorySelect">Category:<br />
                    <select
                        id={"categorySelect"}
                        style={{ width: 120 }}
                        onChange={handleCategorySelectionChange}
                        value={filter.selectedCategory}>
                        <>
                            <option value={""}>ALL</option>
                            {
                                Object.keys(filter.categories).map(
                                    (category) => (
                                        <option
                                            key={category}
                                            value={category}>
                                            {category}
                                        </option>
                                    )
                                )
                            }
                        </>
                    </select>
                </label>
                <label htmlFor="statusSelect">Status:<br />
                    <select
                        id={"statusSelect"}
                        value={filter.selectedStatus as unknown as eTodoStatus}
                        style={{ width: 120 }}
                        onChange={handleStatusSelectionChange}>
                        <option value={""}>ALL</option>
                        <option value={eTodoStatus.Pending}>Pending</option>
                        <option value={eTodoStatus.Complete}>Complete</option>
                        <option value={eTodoStatus.Canceled}>Canceled</option>
                    </select>
                </label>
            </div>
        </div>
    )
}