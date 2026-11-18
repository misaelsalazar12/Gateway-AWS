import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

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
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'El cuerpo de la petición está vacío' }),
      };
    }

    const { name, description, price, stock, category, imageUrl } = JSON.parse(event.body);

    if (!name || price === undefined || stock === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Faltan campos obligatorios: name, price y stock',
        }),
      };
    }

    const productId = randomUUID();
    const createdAt = new Date().toISOString();

    const newProduct = {
      productId,
      name: String(name).trim(),
      description: description ? String(description).trim() : '',
      price: Number(price),
      stock: Number(stock),
      category: category ? String(category).trim() : 'General',
      imageUrl: imageUrl || '',
      createdBy: event.requestContext.authorizer?.userId || 'system',
      createdAt,
    };

    await docClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: newProduct,
      })
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Producto creado exitosamente',
        product: newProduct,
      }),
    };
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno al crear producto', error: error.message }),
    };
  }
};