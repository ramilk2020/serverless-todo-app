import * as uuid from 'uuid'
import { TodoAccess } from '../dataLayer/todoAccess'
import { TodoItem } from '../models/TodoItem'
import { CommentItem } from '../models/CommentItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'

const todoAccess = new TodoAccess()

export async function getTodosByUserId(userId: string):Promise<TodoItem[]> {
    return todoAccess.getTodosByUserId(userId)
}

export async function deleteTodo(todoId: string, userId: string):Promise<void> {
    await todoAccess.deleteTodo(todoId, userId)
    await todoAccess.deleteAllTodoComments(todoId)
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

export async function getTodoUploadUrl(todoId: string, userId: string):Promise<any> {
    return await todoAccess.getUploadUrl(todoId, userId)

}

export async function getTodoImageUrl(todoId: string, userId: string):Promise<any> {
    return await todoAccess.getImageUrl(todoId, userId)

}


export async function createComment(todoId: string, comment: string, userId: string):Promise<CommentItem> {
    const commentId = uuid.v4()

    const newItem = {
        todoId: todoId,
        commentId: commentId,
        createdAt: new Date().toISOString(),
        userId: userId,
        comment
      }

    return todoAccess.createComment(newItem)
}


export async function getCommentsByTodoId(todoId: string):Promise<CommentItem[]> {
    return todoAccess.getCommentsByTodoId(todoId)
}

export async function deleteComment(commentId: string, todoId: string):Promise<void> {
    await todoAccess.deleteComment(commentId, todoId)
}