import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from 'aws-lambda';
import * as jwt from 'jsonwebtoken';

export const authorizer = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  try {
    const authHeader = event.authorizationToken;
    if (!authHeader) {
      throw new Error('No token provided');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const secret = process.env.JWT_SECRET || 'mi-secreto-local';

    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    const principalId = decoded.sub || decoded.id || 'user';

    return generatePolicy(String(principalId), 'Allow', event.methodArn, decoded);
  } catch (error) {
    console.error('Error de autorización:', error);

    throw new Error('Unauthorized');
  }
};

const generatePolicy = (
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  contextData?: Record<string, any>
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context: {
      userId: principalId,
      ...(contextData?.role && { role: String(contextData.role) }),
    },
  };
};