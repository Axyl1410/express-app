import express, { type Request, type Response, type Router } from "express";
import {
  validateTodoCreate,
  validateTodoUpdate,
} from "../../../middleware/todo.middleware";
import type { TodoItemInterface } from "../../../types/todo";

const todoRouter: Router = express.Router();

const todos: TodoItemInterface[] = [];

todoRouter.get("/", (_req: Request, res: Response) => {
  res.json({ todos });
});

todoRouter.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Todo ID is required" });
  }

  const todo = todos.find((todo) => todo.id === id);
  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }
  res.json({ todo });
});

todoRouter.post("/", validateTodoCreate, (req: Request, res: Response) => {
  const { task, description, dueDate, status } = req.body;

  const newTodo: TodoItemInterface = {
    id: crypto.randomUUID(),
    task,
    description: description ?? "",
    dueDate,
    status,
  };
  todos.push(newTodo);
  res.status(201).json({ todo: newTodo });
});

todoRouter.put("/:id", validateTodoUpdate, (req: Request, res: Response) => {
  const { id } = req.params;
  const { task, description, dueDate, status } = req.body;
  const todo = todos.find((todo) => todo.id === id);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  if (task !== undefined) todo.task = task;
  if (description !== undefined) todo.description = description;
  if (dueDate !== undefined) todo.dueDate = dueDate;
  if (status !== undefined) todo.status = status;

  res.json({ message: "Todo updated", todo });
});

todoRouter.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const todo = todos.find((todo) => todo.id === id);
  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }
  todos.splice(todos.indexOf(todo), 1);
  res.json({ message: "Todo deleted", todo });
});

export default todoRouter;
