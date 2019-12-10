export const routes = {
  todoList: '/',
  todoDetail: (id: any = ':id') => `/todo/${id}/`,
};