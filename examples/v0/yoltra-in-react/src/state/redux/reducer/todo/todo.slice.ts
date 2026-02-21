import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { v4 } from "uuid";

import { eReducerStatus, eTodoStatus, type iTodo, type iTodoState } from "../../../../types";

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

export interface FetchTodosArgs {
  url?: string;     // default: https://jsonplaceholder.typicode.com/todos?id=0
  offset?: number;
  limit?: number;
}

export interface TypiTodo {
  id: number | string;
  title: string;
  completed?: boolean;
}

export const fetchTodos = createAsyncThunk<
  { todos: TypiTodo[] },
  FetchTodosArgs | void
>(
  "todo/fetchTodos",
  async (args) => {
    const url = args?.url ?? "https://jsonplaceholder.typicode.com/todos?id=0?offset=0&limit=10";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }
    const data = (await response.json()) as TypiTodo[];
    return { todos: data };
  }
);

function incCategory(state: iTodoState, category?: string) {
  if (!category) return;
  if (!state.filter.categories[category]) state.filter.categories[category] = 0;
  state.filter.categories[category]++;
}

function decCategory(state: iTodoState, category?: string) {
  if (!category) return;
  const count = state.filter.categories[category] ?? 0;
  if (count <= 1) delete state.filter.categories[category];
  else state.filter.categories[category] = count - 1;
}

export const todoSlice = createSlice({
  name: "todo",
  initialState: todoInitialState,
  reducers: {
    addTodo: (
      state,
      action: PayloadAction<{
        id?: string;
        title: string;
        category?: string;
        status?: eTodoStatus;
      }>
    ) => {
      const { id, title, category, status } = action.payload;
      const key = id ?? v4();

      // categories++
      incCategory(state, category);

      state.data[key] = {
        id: key,
        title,
        category,
        status: status ?? eTodoStatus.Pending,
      } as iTodo;
    },

    deleteTodo: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      const todoItem = state.data[id];

      if (todoItem?.category) {
        decCategory(state, todoItem.category);
      }

      delete state.data[id];
    },

    setTodoTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const { id, title } = action.payload;
      const t = state.data[id];
      if (t) t.title = title;
    },

    setTodoCategory: (state, action: PayloadAction<{ id: string; category: string }>) => {
      const { id, category } = action.payload;
      const t = state.data[id];
      if (!t) return;

      decCategory(state, t.category);
      incCategory(state, category);

      t.category = category;
    },

    setTodoStatus: (state, action: PayloadAction<{ id: string; status: eTodoStatus }>) => {
      const { id, status } = action.payload;
      const t = state.data[id];

      if (t) t.status = status;
    },

    setStatusFilter: (state, action: PayloadAction<{ by: eTodoStatus }>) => {
      state.filter.selectedStatus = action.payload.by;
    },

    setCategoryFilter: (state, action: PayloadAction<{ by: string }>) => {
      state.filter.selectedCategory = action.payload.by;
    },

    clearFilters: (state) => {
      state.filter.selectedCategory = "";
      state.filter.selectedStatus = "";
    },
  },

  extraReducers: (builder) => {
    builder.addCase(fetchTodos.pending, (state) => {
      state.status = eReducerStatus.Loading;
      state.statusDetails = "fetching todoes...";
    });

    builder.addCase(fetchTodos.fulfilled, (state, action) => {
      const { todos } = action.payload;

      state.data = todos.reduce<Record<string, iTodo>>((acc, todo) => {
        const idStr = `${todo.id}`;
        acc[idStr] = {
          id: idStr,
          title: todo.title,
          category: "fetched",
          status: todo.completed ? eTodoStatus.Complete : eTodoStatus.Pending,
        };
        return acc;
      }, { ...state.data });

      // increment fetched count
      if (!state.filter.categories["fetched"]) {
        state.filter.categories["fetched"] = todos.length;
      } else {
        state.filter.categories["fetched"] += todos.length;
      }

      state.status = eReducerStatus.Success;
      state.statusDetails = "ok";
    });

    builder.addCase(fetchTodos.rejected, (state, action) => {
      state.status = eReducerStatus.Failure;
      state.statusDetails =
        (action.error?.message as string) || "Unknown error";
    });
  },
});

// Action creators
export const {
  addTodo,
  deleteTodo,
  setTodoTitle,
  setTodoCategory,
  setTodoStatus,
  setStatusFilter,
  setCategoryFilter,
  clearFilters,
} = todoSlice.actions;

export const selectTodoState = (root: { todo: iTodoState }) => root.todo;
export const selectTodos = (root: { todo: iTodoState }) => root.todo.data;
export const selectFilters = (root: { todo: iTodoState }) => root.todo.filter;
export const selectStatus = (root: { todo: iTodoState }) => ({
  status: root.todo.status,
  details: root.todo.statusDetails,
});

export default todoSlice.reducer;
