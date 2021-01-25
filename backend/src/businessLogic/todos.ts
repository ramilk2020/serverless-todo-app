import * as uuid from 'uuid'
import { TodoAccess } from '../dataLayer/todoAccess'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'

const todoAccess = new TodoAccess()

export async function getTodosByUserId(userId: string):Promise<TodoItem[]> {
    return todoAccess.getTodosByUserId(userId)
}

export async function deleteTodo(todoId: string, userId: string):Promise<void> {
    todoAccess.deleteTodo(todoId, userId)
}

export async function createTodo(newTodo: CreateTodoRequest, userId: string):Promise<TodoItem> {
    const todoId = uuid.v4()

    const newItem = {
        userId: userId,
        todoId: todoId,
        createdAt: new Date().toISOString(),
        ...newTodo,
        done: false
      }

    return todoAccess.createTodo(newItem)
}

export async function updateTodo(todoId: string, userId: string, todoUpdate: TodoUpdate):Promise<any> {
    return await todoAccess.updateTodo(todoId, userId, todoUpdate)
}

export async function getTodoUploadUrl(todoId: string):Promise<any> {
    return await todoAccess.getUploadUrl(todoId)

}