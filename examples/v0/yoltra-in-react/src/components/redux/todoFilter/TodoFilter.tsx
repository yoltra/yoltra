import { useMemo } from "react";
import { useSelector } from "react-redux";

import { eTodoStatus } from "../../../types";
import type { AppState } from "../../../state/redux/store";
import { useTodoFilterActions } from "../../../state/redux";

import "./TodoFilter.style.scss";

export interface iTodoFilterProps { }

export const TodoFilter = (_: iTodoFilterProps) => {
  const { setCategoryFilter, setStatusFilter } = useTodoFilterActions();

  const filter = useSelector((s: AppState) => s.todo.filter);
  const categoriesOptions = useMemo(
    () =>
      Object.keys(filter.categories).map((category) => (
        <option key={category} value={category}>{category}</option>)),
    [filter.categories]
  );

  return (
    <div className="todo-filter">
      <h3>Filter by:</h3>
      <div>
        <label htmlFor="categorySelect">Category:<br />
          <select
            id={"categorySelect"}
            style={{ width: 120 }}
            onChange={setCategoryFilter}
            value={filter.selectedCategory}>
            <>
              <option value={""}>ALL</option>
              {categoriesOptions}
            </>
          </select>
        </label>

        <label htmlFor="statusSelect">Status:<br />
          <select
            id="statusSelect"
            value={filter.selectedStatus as eTodoStatus | ""}
            style={{ width: 120 }}
            onChange={setStatusFilter}
          >
            <>
              <option value={""}>ALL</option>
              <option value={eTodoStatus.Pending}>Pending</option>
              <option value={eTodoStatus.Complete}>Complete</option>
              <option value={eTodoStatus.Canceled}>Canceled</option>
            </>
          </select>
        </label>
      </div>
    </div>
  );
};
