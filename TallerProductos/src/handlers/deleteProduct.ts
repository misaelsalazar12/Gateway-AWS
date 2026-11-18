import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

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
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || 'taller-local-products';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'El parámetro productId es obligatorio' }),
      };
    }

    const existing = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { productId },
      })
    );

    if (!existing.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Producto no encontrado' }),
      };
    }

    await docClient.send(
      new DeleteCommand({
        TableName: PRODUCTS_TABLE,
        Key: { productId },
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Producto eliminado correctamente',
        productId,
      }),
    };
  } catch (error: any) {
    console.error('Error en deleteProduct:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error al eliminar el producto', error: error.message }),
    };
  }
};