import { v4 } from "uuid";
import type { ReducerSpec } from "@quojs/core";
import { eReducerStatus, eTodoStatus, type iTodo, type iTodoState } from "../../../../types";
import type { tAppEM } from "../../store";
import { withImmer } from "../withImmer";

export const todoInitialState: iTodoState = {
  data: {},
  filter: {
    categories: {},
    selectedCategory: "",
    selectedStatus: "ALL",
  },
  status: eReducerStatus.Loading,
  statusDetails: "fetching todos...",
};

/**
 * Todo Reducer (Immer-wrapped)
 *
 * The only Reducer in the Application, it stores:
 *
 * - todos in a dictionary, in which the key is the
 *   id and the value is the todo itself
 * - filter state
 * - status and statusDetails properties for async
 */
const todoReducer = withImmer<iTodoState, tAppEM>((draft, event) => {
  switch (event.type) {
    case "addTodo": {
      // event.payload is now typed as tAppAM["todo"]["addTodo"]
      const { category, id: providedId, ...rest } = event.payload;

      // categories++
      if (category) {
        if (!draft.filter.categories[category]) {
          draft.filter.categories[category] = 0;
        }
        draft.filter.categories[category]++;
      }

      const key = providedId ?? v4();
      draft.data[key] = {
        id: key,
        category,
        ...rest,
      } as iTodo;
      return;
    }

    case "deleteTodo": {
      const { id } = event.payload;
      const todoItem = draft.data[id];

      if (todoItem?.category) {
        const cat = todoItem.category;
        if (draft.filter.categories[cat] <= 1) {
          delete draft.filter.categories[cat];
        } else {
          draft.filter.categories[cat]--;
        }
      }

      delete draft.data[id];
      return;
    }

    case "setTodoTitle": {
      const { id, title } = event.payload;
      const t = draft.data[id];

      if (t) t.title = title;

      return;
    }

    case "setTodoCategory": {
      const { id, category } = event.payload;
      const t = draft.data[id];
      if (!t) return;

      /**
       * If the todo had a previous category,
       * we subtract from that category
       */
      const oldCat = t.category;
      if (oldCat) {
        if (draft.filter.categories[oldCat] <= 1) {
          delete draft.filter.categories[oldCat];
        } else {
          draft.filter.categories[oldCat]--;
        }
      }

      // increment new category
      if (category) {
        if (!draft.filter.categories[category]) {
          draft.filter.categories[category] = 0;
        }
        draft.filter.categories[category]++;
      }

      t.category = category;
      return;
    }

    case "setTodoStatus": {
      const { id, status } = event.payload;
      const t = draft.data[id];

      if (t) t.status = status;

      return;
    }

    // fetched todos
    case "fetchTodosLoading": {
      draft.status = eReducerStatus.Loading;
      draft.statusDetails = "fetching todos...";

      return;
    }

    case "fetchTodosSuccess": {
      const { todos } = event.payload;

      draft.data = todos.reduce<Record<string, iTodo>>((todoes, todo) => {
        todoes[todo.id] = {
          id: `${todo.id}`,
          title: todo.title,
          category: "fetched",
          status: todo?.completed ? eTodoStatus.Complete : eTodoStatus.Pending,
        };

        return todoes;
      }, { ...draft.data });

      // increment new category
      if (!draft.filter.categories["fetched"]) {
        draft.filter.categories["fetched"] = todos.length;
      } else {
        draft.filter.categories["fetched"] += todos.length;
      }
      return;
    }

    case "fetchTodosFailure": {
      const { error } = event.payload;

      draft.status = eReducerStatus.Failure;
      draft.statusDetails = error;

      return;
    }

    // filter state
    case "setStatusFilter": {
      const { by } = event.payload;
      draft.filter.selectedStatus = by;

      return;
    }

    case "setCategoryFilter": {
      const { by } = event.payload;
      draft.filter.selectedCategory = by;

      return;
    }

    case "clearFilters": {
      draft.filter.selectedCategory = "";
      draft.filter.selectedStatus = "ALL";
      return;
    }

    default:
      return; // no change
  }
});

export const todoSpec: ReducerSpec<iTodoState, tAppEM> = {
  events: [
    ["todo", "addTodo"],
    ["todo", "deleteTodo"],
    ["todo", "setTodoTitle"],
    ["todo", "setTodoCategory"],
    ["todo", "setTodoStatus"],
    ["todo", "setCategoryFilter"],
    ["todo", "setStatusFilter"],
    ["todo", "clearFilters"],
    ["todo", "fetchTodosLoading"],
    ["todo", "fetchTodosSuccess"],
    ["todo", "fetchTodosFailure"],
  ],
  state: todoInitialState,
  reducer: todoReducer,
};