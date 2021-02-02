
import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

// import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

import { getUserId } from '../utils'
import { createComment } from '../../businessLogic/todos'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
 
  const todoId = event.pathParameters.todoId
  const comment = JSON.parse(event.body)
  console.log('Processing event ', comment)

  const item = await createComment(todoId, comment, getUserId(event))

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      item: item
    })
  }
}