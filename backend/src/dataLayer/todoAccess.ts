import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CommentItem } from '../models/CommentItem'

export class TodoAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todosIndex = process.env.TODOS_INDEX,
        private readonly commentsTable = process.env.COMMENTS_TABLE,
        private readonly commentsIndex = process.env.COMMENTS_INDEX,
        private readonly bucketName = process.env.IMAGES_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION) 
        
        {}

    async getTodosByUserId(userId: string): Promise<TodoItem[]> {
        console.log('Get todos by userId')
        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todosIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
            ':userId': userId
            }
        }).promise()
        
        return result.Items as TodoItem[]
        }

    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todoItem
          }).promise()
        return todoItem
    }

    async deleteTodo(todoId: string, userId: string): Promise<void> {
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            }
        })
        .promise()
    }

    
    async updateTodo(todoId: string, userId: string, todoUpdate: TodoUpdate) {
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
              todoId,
              userId
            },
            UpdateExpression: 'set #name = :n, #dueDate = :due, #done = :d',
            ExpressionAttributeValues: {
              ':n': todoUpdate.name,
              ':due': todoUpdate.dueDate,
              ':d': todoUpdate.done 
            },
            ExpressionAttributeNames: {
              '#name' : 'name',
              '#dueDate': 'dueDate',
              '#done': 'done'
            }
          }).promise()
    }

    async getUploadUrl(todoId: string, userId: string) {

        const s3 = new AWS.S3({ signatureVersion: 'v4' })
        
        const uploadUrl =  s3.getSignedUrl('putObject', {
          Bucket: this.bucketName,
          Key: todoId,
          Expires: parseInt(this.urlExpiration)
        })

        await this.attachImageURLToTodo(todoId, userId)

        return uploadUrl
      }

    async getImageUrl(todoId: string, userId: string) {

        const s3 = new AWS.S3({ signatureVersion: 'v4' })
        
        const imageUrl =  s3.getSignedUrl('getObject', {
          Bucket: this.bucketName,
          Key: todoId,
          Expires: parseInt(this.urlExpiration)
        })

        await this.attachImageURLToTodo(todoId, userId)

        return imageUrl
      }

    async attachImageURLToTodo(todoId: string, userId: string) {
      await this.docClient
        .update({
          TableName: this.todosTable,
          Key: {
            todoId,
            userId
          },
          UpdateExpression: 'set attachmentUrl = :attachmentUrl',
          ExpressionAttributeValues: {
            ':attachmentUrl': `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
          },
          ReturnValues: 'ALL_NEW'
        })
        .promise()
    }


    async createComment(commentItem: CommentItem): Promise<CommentItem> {
        await this.docClient.put({
            TableName: this.commentsTable,
            Item:commentItem
          }).promise()
        return commentItem
    }

    async getCommentsByTodoId(todoId: string): Promise<CommentItem[]> {

      const result = await this.docClient.query({
          TableName: this.commentsTable,
          IndexName: this.commentsIndex,
          KeyConditionExpression: 'todoId = :todoId',
          ExpressionAttributeValues: {
          ':todoId': todoId
          }
      }).promise()
      
      return result.Items as CommentItem[]
      }

    async deleteComment(commentId: string, todoId: string): Promise<void> {
        const result = await this.docClient.delete({
            TableName: this.commentsTable,
            Key: {
                commentId,
                todoId
            }
        })
        .promise()
        console.log(result)
    }

    async deleteAllTodoComments(todoId: string): Promise<void> {

      const results = await this.docClient.query({
          TableName: this.commentsTable,
          IndexName: this.commentsIndex,
          KeyConditionExpression: 'todoId = :todoId',
          ExpressionAttributeValues: {
          ':todoId': todoId
          }
        })
        .promise()

      if (results.Items && results.Items.length > 0) {


        const batchCalls = chunks(results.Items, 25).map(async (chunk) => {
          const deleteRequests = chunk.map( item => {
            return {
              DeleteRequest : {
                Key : {
                  'commentId' : item.commentId,
                  'todoId' : item.todoId,
                }
              }
            }
          })
      
          const batchWriteParams = {
            RequestItems: {
              [this.commentsTable] : deleteRequests
            }
          }

          const a = await this.docClient.batchWrite(batchWriteParams).promise()
          console.log('Batch delete response: ', a)
        })

      await Promise.all(batchCalls)
    }
  }
}

function createDynamoDBClient(): DocumentClient {
    if (process.env.IS_OFFLINE) {
      console.log('Creating a local DynamoDB instance')
      return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    }
  
    return new XAWS.DynamoDB.DocumentClient()
  }

// Helper function
function chunks(inputArray, perChunk) {
  return inputArray.reduce((all,one,i) => {
    const ch = Math.floor(i/perChunk); 
    all[ch] = [].concat((all[ch]||[]),one); 
    return all
  }, [])
}