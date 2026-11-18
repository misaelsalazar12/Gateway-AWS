import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

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
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_super_segura_123';

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

    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Debes enviar email y password' }),
      };
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const result = await docClient.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': normalizedEmail,
        },
      })
    );

    const user = result.Items?.[0];

    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Credenciales inválidas' }),
      };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Credenciales inválidas' }),
      };
    }

    const token = jwt.sign(
      {
        sub: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login exitoso',
        token,
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      }),
    };
  } catch (error: any) {
    console.error('Error en login:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno en login', error: error.message }),
    };
  }
};