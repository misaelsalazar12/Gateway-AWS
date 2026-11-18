import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
    },
    body: JSON.stringify({
      message: 'Pong! Gateway funcionando correctamente',
      stage: process.env.STAGE,
      timestamp: new Date().toISOString(),
    }),
  };
};