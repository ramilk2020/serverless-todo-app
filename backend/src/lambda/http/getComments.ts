import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { getCommentsByTodoId } from '../../businessLogic/todos'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log("Processing event: ", event)

  const todoId = event.pathParameters.todoId

  const comments =  await getCommentsByTodoId(todoId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items: comments
    })
  }
}

