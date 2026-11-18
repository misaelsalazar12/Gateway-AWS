import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

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
    const category = event.queryStringParameters?.category;

    let result;
    if (category) {
      result = await docClient.send(
        new QueryCommand({
          TableName: PRODUCTS_TABLE,
          IndexName: 'CategoryIndex',
          KeyConditionExpression: 'category = :category',
          ExpressionAttributeValues: {
            ':category': category,
          },
        })
      );
    } else {
      result = await docClient.send(
        new ScanCommand({
          TableName: PRODUCTS_TABLE,
        })
      );
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        count: result.Items?.length || 0,
        products: result.Items || [],
      }),
    };
  } catch (error: any) {
    console.error('Error al listar productos:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error al listar productos', error: error.message }),
    };
  }
};