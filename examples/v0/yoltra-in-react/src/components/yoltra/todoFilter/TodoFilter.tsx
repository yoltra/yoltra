import type { ChangeEvent } from "react";
import { Select } from "@yoltra/ds";

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
                <label htmlFor="categorySelect">Category
                    <Select
                        id={"categorySelect"}
                        onChange={handleCategorySelectionChange}
                        value={filter.selectedCategory}>
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
                    </Select>
                </label>
                <label htmlFor="statusSelect">Status
                    <Select
                        id={"statusSelect"}
                        value={filter.selectedStatus as unknown as eTodoStatus}
                        onChange={handleStatusSelectionChange}>
                        <option value={""}>ALL</option>
                        <option value={eTodoStatus.Pending}>Pending</option>
                        <option value={eTodoStatus.Complete}>Complete</option>
                        <option value={eTodoStatus.Canceled}>Canceled</option>
                    </Select>
                </label>
            </div>
        </div>
    )
}