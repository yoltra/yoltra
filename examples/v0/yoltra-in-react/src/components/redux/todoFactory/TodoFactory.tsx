import { useState, type ChangeEvent, type FC } from "react";

import { eTodoStatus } from "../../../types";
import { useTodoActions } from "../../../state/redux";

import "./TodoFactory.style.scss";

export interface iTodoFactoryProps { }

export const TodoFactory: FC<iTodoFactoryProps> = () => {
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoCategory, setNewTodoCategory] = useState("");
  const [newTodoStatus, setNewTodoStatus] = useState<eTodoStatus>(eTodoStatus.Pending);

  const { addTodo } = useTodoActions();

  const handleTitleInputChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setNewTodoTitle(target.value);
  };

  const handleCategoryInputChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setNewTodoCategory(target.value);
  };

  const handleStatusSelectionChange = ({ target }: ChangeEvent<HTMLSelectElement>) => {
    setNewTodoStatus(target.value as unknown as eTodoStatus);
  };

  const handleAddTodoButtonClick = () => {
    addTodo({
      title: newTodoTitle,
      category: newTodoCategory,
      status: newTodoStatus,
    });

    setNewTodoTitle("");
    setNewTodoCategory("");
    setNewTodoStatus(eTodoStatus.Pending);
  };

  return (
    <div className="todo-factory">
      <label htmlFor="titleInput"> Title:
        <input name="titleInput" onChange={handleTitleInputChange} value={newTodoTitle} />
      </label>
      <label htmlFor="categoryInput"> Category:
        <input name="categoryInput" onChange={handleCategoryInputChange} value={newTodoCategory} />
      </label>
      <label htmlFor="statusSelect"> Status:
        <select
          name="statusSelect"
          id="statusSelect"
          value={newTodoStatus}
          style={{ width: 120 }}
          onChange={handleStatusSelectionChange}>
          <option value={eTodoStatus.Pending}>Pending</option>
          <option value={eTodoStatus.Complete}>Complete</option>
          <option value={eTodoStatus.Canceled}>Canceled</option>
        </select>
      </label>
      <button type="button" onClick={handleAddTodoButtonClick}>Add</button>
    </div>
  );
};
