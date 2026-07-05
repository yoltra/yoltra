import type React from "react";
import { useState } from "react";
import cx from "classnames";
import {
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    EditOutlined,
    StopOutlined
} from "@ant-design/icons";

import { eTodoStatus, type iTodo } from "../../../types";
import { useEmit, useAtomicProp } from "../../../state/yoltra/hooks";
import { TodoItemEdit } from "./TodoItemEdit";

import "./TodoItem.style.scss";

export interface iTodoItemProps {
    id: string,
}

export const TodoItem: React.FC<iTodoItemProps> = ({
    id,
}: iTodoItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const emit = useEmit();

    const data: iTodo = useAtomicProp(
        { reducer: "todo", property: `data.${id}` },
        v => v as iTodo
    );

    const handleCompleteTodoClick = () => emit("todo", "setTodoStatus", { id, status: eTodoStatus.Complete });
    const handleUncompleteTodoClick = () => emit("todo", "setTodoStatus", { id, status: eTodoStatus.Pending });
    const handleCancelTodoClick = () => emit("todo", "setTodoStatus", { id, status: eTodoStatus.Canceled });
    const handleRemoveTodoClick = () => emit("todo","deleteTodo", { id });

    const handleTodoSaveCb = () => setIsEditing(false);

    const classNames = cx({
        pending: data?.status === eTodoStatus.Pending,
        complete: data?.status === eTodoStatus.Complete,
        canceled: data?.status === eTodoStatus.Canceled,
    });

    const actions: React.ReactNode[] = [];
    if (data?.status !== eTodoStatus.Complete) {
        actions.push(<CheckOutlined className="complete" key="complete" onClick={handleCompleteTodoClick} title={"mark as complete"} />);
    }
    if (data?.status !== eTodoStatus.Pending) {
        actions.push(<CloseOutlined className="pending" key="pending" onClick={handleUncompleteTodoClick} title={"mark as pending"} />);
    }
    if (data?.status !== eTodoStatus.Canceled) {
        actions.push(<StopOutlined className="cancel" key="cancel" onClick={handleCancelTodoClick} title={"mark as cancel"} />);
    }

    actions.push(<EditOutlined className="edit" key="edit" onClick={() => setIsEditing(true)} title={"edit"} />);
    actions.push(<DeleteOutlined className="delete" key="delete" onClick={handleRemoveTodoClick} title={"delete"} />);

    return isEditing ? (<TodoItemEdit id={id} onSave={handleTodoSaveCb} />) : (
        <div className="todo-card">
            <p className={classNames}>{data?.category}: {data?.title}</p>
            <div>
                {actions}
            </div>
        </div>
    );
};
