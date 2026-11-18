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

// src/handlers/listProducts.ts
var listProducts_exports = {};
__export(listProducts_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(listProducts_exports);
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
var PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "taller-local-products";
var headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": process.env.CORS_ORIGINS || "*"
};
var handler = async (event) => {
  try {
    const category = event.queryStringParameters?.category;
    let result;
    if (category) {
      result = await docClient.send(
        new import_lib_dynamodb.QueryCommand({
          TableName: PRODUCTS_TABLE,
          IndexName: "CategoryIndex",
          KeyConditionExpression: "category = :category",
          ExpressionAttributeValues: {
            ":category": category
          }
        })
      );
    } else {
      result = await docClient.send(
        new import_lib_dynamodb.ScanCommand({
          TableName: PRODUCTS_TABLE
        })
      );
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        count: result.Items?.length || 0,
        products: result.Items || []
      })
    };
  } catch (error) {
    console.error("Error al listar productos:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Error al listar productos", error: error.message })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=listProducts.js.map
