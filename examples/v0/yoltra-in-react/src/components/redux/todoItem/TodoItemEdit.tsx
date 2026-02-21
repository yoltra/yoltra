import type React from "react";
import { type ChangeEvent } from "react";
import { Card, Input, Select, Space, Typography } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

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

  let todoTextMarkup = <Typography.Text>{data?.category}: {data?.title}</Typography.Text>;
  if (data?.status === eTodoStatus.Complete) {
    todoTextMarkup = (
      <Typography.Text type={"secondary"}>
        {data?.category}: {data?.title}
      </Typography.Text>
    );
  }
  if (data?.status === eTodoStatus.Canceled) {
    todoTextMarkup = (
      <Typography.Text type={"warning"}>
        {data?.category}: {data?.title}
      </Typography.Text>
    );
  }

  return (
    <div className="todo-card">
      <label htmlFor="titleInput">
        {" "}
        Title:
        <input name="titleInput" onChange={handleTitleInputChange} value={data?.title} />
      </label>
      <label htmlFor="categoryInput">
        {" "}
        Category:
        <input name="categoryInput" onChange={handleCategoryInputChange} value={data?.category} />
      </label>
      <label htmlFor="statusSelect"> Status:<br />
        <select
          id={"statusSelect"}
          name={"statusSelect"}
          value={data?.status}
          style={{ width: 120 }}
          onChange={handleStatusSelectionChange}>
          <option value={eTodoStatus.Pending} selected>Pending</option>
          <option value={eTodoStatus.Complete}>Complete</option>
          <option value={eTodoStatus.Canceled}>Canceled</option>
        </select>
      </label>
      <SaveOutlined onClick={onSave} />
    </div>
  );
};
