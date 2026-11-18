import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const isLocal = process.env.STAGE === 'local';
const localstackHost = process.env.LOCALSTACK_HOSTNAME || 'localhost';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(isLocal && {
    endpoint: `http://${localstackHost}:4566`,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  }),
});

const docClient = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE || 'taller-local-users';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'El parámetro userId es obligatorio' }),
      };
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Usuario no encontrado' }),
      };
    }

    const { password, ...userWithoutPassword } = result.Item;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: userWithoutPassword,
      }),
    };
  } catch (error: any) {
    console.error('Error en getUser:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error al obtener el usuario', error: error.message }),
    };
  }
};