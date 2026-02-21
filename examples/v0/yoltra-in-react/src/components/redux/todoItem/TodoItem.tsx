import type React from "react";
import { useState } from "react";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  StopOutlined,
  EditOutlined,
} from "@ant-design/icons";
import cx from "classnames";
import { useSelector } from "react-redux";

import { eTodoStatus, type iTodo } from "../../../types";
import { useTodoActions } from "../../../state/redux";
import type { AppState } from "../../../state/redux/store";
import { TodoItemEdit } from "./TodoItemEdit";

import "./TodoItem.style.scss";

export interface iTodoItemProps {
  id: string;
}

export const TodoItem: React.FC<iTodoItemProps> = ({ id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { deleteTodo, setTodoStatus } = useTodoActions();

  const data = useSelector<AppState, iTodo | undefined>((s) => s.todo.data[id]);

  const handleCompleteTodoClick = () => setTodoStatus(id, eTodoStatus.Complete);
  const handleUncompleteTodoClick = () => setTodoStatus(id, eTodoStatus.Pending);
  const handleCancelTodoClick = () => setTodoStatus(id, eTodoStatus.Canceled);
  const handleRemoveTodoClick = () => deleteTodo(id);

  const classNames = cx({
    pending: data?.status === eTodoStatus.Pending,
    complete: data?.status === eTodoStatus.Complete,
    canceled: data?.status === eTodoStatus.Canceled,
  });

  const actions: React.ReactNode[] = [];
  if (data?.status !== eTodoStatus.Complete) {
    actions.push(<CheckOutlined className="complete" key="complete" onClick={handleCompleteTodoClick} />);
  }
  if (data?.status !== eTodoStatus.Pending) {
    actions.push(<CloseOutlined className="pending" key="pending" onClick={handleUncompleteTodoClick} />);
  }
  if (data?.status !== eTodoStatus.Canceled) {
    actions.push(<StopOutlined className="cancel" key="cancel" onClick={handleCancelTodoClick} />);
  }

  actions.push(<EditOutlined className="edit" key="edit" onClick={() => setIsEditing(true)} />);
  actions.push(<DeleteOutlined className="delete" key="delete" onClick={handleRemoveTodoClick} />);

  return isEditing ? (<TodoItemEdit id={id} onSave={() => setIsEditing(false)} />) : (
    <div className="todo-card" style={{ background: "#ffffff" }}>
      <p className={classNames}>{data?.category}: {data?.title}</p>
      <div>
        {actions}
      </div>
    </div>
  );
};
