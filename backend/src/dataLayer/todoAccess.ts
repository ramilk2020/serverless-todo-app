import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

export class TodoAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todosIndex = process.env.TODOS_INDEX,
        private readonly bucketName = process.env.IMAGES_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION) {}

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
        }).promise()
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

    async getUploadUrl(todoId: string) {

        const s3 = new AWS.S3({ signatureVersion: 'v4' })
        
        const uploadUrl =  s3.getSignedUrl('putObject', {
          Bucket: this.bucketName,
          Key: todoId,
          Expires: parseInt(this.urlExpiration)
        })

        return uploadUrl
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
  