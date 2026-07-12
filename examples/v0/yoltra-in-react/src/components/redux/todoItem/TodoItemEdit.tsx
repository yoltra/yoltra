import type React from "react";
import { type ChangeEvent } from "react";
import { SaveOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { Input, Select } from "@yoltra/ds";

import { eTodoStatus, type iTodo } from "../../../types";
import { useTodoActions } from "../../../state/redux";
import type { AppState } from "../../../state/redux/store";

export interface iTodoItemEditProps {
  id: string;
  onSave: () => void;
}

export const TodoItemEdit: React.FC<iTodoItemEditProps> = ({ id, onSave }) => {
  const { setTodoTitle, setTodoStatus, setTodoCategory } = useTodoActions();

  const data = useSelector<AppState, iTodo | undefined>((s) => s.todo.data[id]);

  const handleTitleInputChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setTodoTitle(id, target.value);
  };

  const handleCategoryInputChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setTodoCategory(id, target.value);
  };

  const handleStatusSelectionChange = ({ target }: ChangeEvent<HTMLSelectElement>) => {
    setTodoStatus(id, target.value as unknown as eTodoStatus);
  };

  return (
    <div className="todo-card">
      <label htmlFor="titleInput">Title
        <Input name="titleInput" placeholder="Title" onChange={handleTitleInputChange} value={data?.title} />
      </label>
      <label htmlFor="categoryInput">Category
        <Input name="categoryInput" placeholder="Category" onChange={handleCategoryInputChange} value={data?.category} />
      </label>
      <label htmlFor="statusSelect">Status
        <Select
          id={"statusSelect"}
          name={"statusSelect"}
          value={data?.status}
          onChange={handleStatusSelectionChange}>
          <option value={eTodoStatus.Pending}>Pending</option>
          <option value={eTodoStatus.Complete}>Complete</option>
          <option value={eTodoStatus.Canceled}>Canceled</option>
        </Select>
      </label>
      <SaveOutlined onClick={onSave} />
    </div>
  );
};
