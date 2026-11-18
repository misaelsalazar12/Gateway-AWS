import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL || (process.env.LOCALSTACK_HOSTNAME ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566` : 'http://localhost:4566'),
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

    const result = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { productId },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Producto no encontrado' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        product: result.Item,
      }),
    };
  } catch (error: any) {
    console.error('Error en getProduct:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Error al obtener el producto',
        error: error.message,
      }),
    };
  }
};