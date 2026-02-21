export enum eReducerStatus {
  Success,
  Loading,
  Failure,
}

export enum eTodoStatus {
  Pending,
  Complete,
  Canceled,
}

export interface iTodoSpec {
  id?: string;
  title: string;
  category: string;
  status: eTodoStatus;
}

export interface iTodo {
  id: string;
  title: string;
  category: string;
  status: eTodoStatus;
}

export interface iTypiTodo {
  userId: number,
  id: number,
  title: string,
  completed: boolean,
}

export interface iFilterState {
  categories: Record<string, number>;
  selectedCategory: string;
  selectedStatus: eTodoStatus | string;
}

export interface iTodoState {
  data: Record<string, iTodo>;
  filter: iFilterState;
  status: eReducerStatus;
  statusDetails: string;
}