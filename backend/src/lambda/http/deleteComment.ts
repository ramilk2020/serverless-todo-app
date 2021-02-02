import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { deleteComment } from '../../businessLogic/todos'


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const commentId = event.pathParameters.commentId
  console.log('Path parameters: ', event.pathParameters)
  console.log('Processing delete event of comment ',commentId)
  console.log('TodoId ', todoId)

  try {
    await deleteComment(commentId, todoId)
    console.log('Delete successful')

    } catch (err) {
        console.log('Delete process error, ', err)
    }

  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      deletedComment: commentId
    })
  }
}