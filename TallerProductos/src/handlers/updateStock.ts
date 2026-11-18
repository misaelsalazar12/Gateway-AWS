import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

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

    if (!productId || !event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Se requiere productId y cuerpo de petición' }),
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

    const { stock, quantity } = JSON.parse(event.body);
    const currentStock = Number(existing.Item.stock || 0);
    let newStock: number;

    if (stock !== undefined) {
      // Si se envía "stock", establece ese valor exacto
      newStock = Number(stock);
    } else if (quantity !== undefined) {
      // Si se envía "quantity", suma o resta al stock actual
      newStock = currentStock + Number(quantity);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Debes proporcionar "stock" (nuevo total) o "quantity" (cantidad a sumar/restar)',
        }),
      };
    }

    if (newStock < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Stock insuficiente. El stock no puede quedar en negativo',
          currentStock,
        }),
      };
    }

    const updated = await docClient.send(
      new UpdateCommand({
        TableName: PRODUCTS_TABLE,
        Key: { productId },
        UpdateExpression: 'SET #stock = :stock, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#stock': 'stock',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':stock': newStock,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Stock actualizado correctamente',
        previousStock: currentStock,
        newStock: updated.Attributes?.stock,
        product: updated.Attributes,
      }),
    };
  } catch (error: any) {
    console.error('Error en updateStock:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error al actualizar el stock', error: error.message }),
    };
  }
};