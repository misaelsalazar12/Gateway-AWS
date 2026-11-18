var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/handlers/getUser.ts
var getUser_exports = {};
__export(getUser_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(getUser_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var isLocal = process.env.STAGE === "local";
var localstackHost = process.env.LOCALSTACK_HOSTNAME || "localhost";
var client = new import_client_dynamodb.DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  ...isLocal && {
    endpoint: `http://${localstackHost}:4566`,
    credentials: { accessKeyId: "test", secretAccessKey: "test" }
  }
});
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(client);
var USERS_TABLE = process.env.USERS_TABLE || "taller-local-users";
var headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": process.env.CORS_ORIGINS || "*"
};
var handler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "El par\xE1metro userId es obligatorio" })
      };
    }
    const result = await docClient.send(
      new import_lib_dynamodb.GetCommand({
        TableName: USERS_TABLE,
        Key: { userId }
      })
    );
    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Usuario no encontrado" })
      };
    }
    const { password, ...userWithoutPassword } = result.Item;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: userWithoutPassword
      })
    };
  } catch (error) {
    console.error("Error en getUser:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Error al obtener el usuario", error: error.message })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=getUser.js.map
