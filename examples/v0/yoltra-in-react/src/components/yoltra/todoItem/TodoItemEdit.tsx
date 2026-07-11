import type React from "react";
import { type ChangeEvent } from "react";
import { SaveOutlined } from "@ant-design/icons";
import { Input, Select } from "@yoltra/ds";

import { eTodoStatus, type iTodo } from "../../../types";
import { useEmit, useAtomicProp } from "../../../state/yoltra/hooks";

export interface iTodoItemEditProps {
    id: string,
    onSave: () => void;
}

export const TodoItemEdit: React.FC<iTodoItemEditProps> = ({
    id,
    onSave
}: iTodoItemEditProps) => {
    const emit = useEmit();
    const data = useAtomicProp(
        { reducer: "todo", property: `data.${id}` },
        v => v as iTodo
    );

    const handleTitleInputChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        emit("todo", "setTodoTitle", { id, title: target.value });
    };

    const handleCategoryInputChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        emit("todo", "setTodoCategory", { id, category: target.value });
    };

    const handleStatusSelectionChange = ({ target }: ChangeEvent<HTMLSelectElement>) => {
        emit("todo", "setTodoStatus", { id, status: target.value as unknown as eTodoStatus });
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
            <SaveOutlined onClick={() => onSave()} />
        </div>
    );
};
