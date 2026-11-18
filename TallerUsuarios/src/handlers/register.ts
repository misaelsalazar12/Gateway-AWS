import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// En LocalStack dentro de Lambda se usa LOCALSTACK_HOSTNAME o localhost
const isLocal = process.env.STAGE === 'local';
const localstackHost = process.env.LOCALSTACK_HOSTNAME || 'localhost';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(isLocal && {
    endpoint: `http://${localstackHost}:4566`,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
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
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'El cuerpo de la petición está vacío' }),
      };
    }

    const { name, email, password, role } = JSON.parse(event.body);

    if (!name || !email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Faltan campos obligatorios: name, email y password',
        }),
      };
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 1. Verificar si el correo ya existe usando el GSI EmailIndex
    const existingUser = await docClient.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': normalizedEmail,
        },
      })
    );

    if (existingUser.Items && existingUser.Items.length > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ message: 'El correo electrónico ya está registrado' }),
      };
    }

    // 2. Encriptar la contraseña y crear el registro
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();
    const createdAt = new Date().toISOString();

    const newUser = {
      userId,
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'CLIENT',
      createdAt,
    };

    // 3. Guardar en DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: newUser,
      })
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Usuario registrado exitosamente',
        user: {
          userId: newUser.userId,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      }),
    };
  } catch (error: any) {
    console.error('Error en registro de usuario:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Error interno al registrar el usuario',
        error: error.message,
      }),
    };
  }
};