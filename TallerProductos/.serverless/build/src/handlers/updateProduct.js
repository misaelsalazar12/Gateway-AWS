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

// src/handlers/updateProduct.ts
var updateProduct_exports = {};
__export(updateProduct_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(updateProduct_exports);
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
    const productId = event.pathParameters?.productId;
    if (!productId || !event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Se requiere productId y cuerpo de petici\xF3n" })
      };
    }
    const existing = await docClient.send(
      new import_lib_dynamodb.GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { productId }
      })
    );
    if (!existing.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Producto no encontrado" })
      };
    }
    const { name, description, price, stock, category, imageUrl } = JSON.parse(event.body);
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    if (name !== void 0) {
      updateExpressions.push("#name = :name");
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = String(name).trim();
    }
    if (description !== void 0) {
      updateExpressions.push("#description = :description");
      expressionAttributeNames["#description"] = "description";
      expressionAttributeValues[":description"] = String(description).trim();
    }
    if (price !== void 0) {
      updateExpressions.push("#price = :price");
      expressionAttributeNames["#price"] = "price";
      expressionAttributeValues[":price"] = Number(price);
    }
    if (stock !== void 0) {
      updateExpressions.push("#stock = :stock");
      expressionAttributeNames["#stock"] = "stock";
      expressionAttributeValues[":stock"] = Number(stock);
    }
    if (category !== void 0) {
      updateExpressions.push("#category = :category");
      expressionAttributeNames["#category"] = "category";
      expressionAttributeValues[":category"] = String(category).trim();
    }
    if (imageUrl !== void 0) {
      updateExpressions.push("#imageUrl = :imageUrl");
      expressionAttributeNames["#imageUrl"] = "imageUrl";
      expressionAttributeValues[":imageUrl"] = String(imageUrl);
    }
    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = (/* @__PURE__ */ new Date()).toISOString();
    const updated = await docClient.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: PRODUCTS_TABLE,
        Key: { productId },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Producto actualizado exitosamente",
        product: updated.Attributes
      })
    };
  } catch (error) {
    console.error("Error en updateProduct:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Error al actualizar el producto", error: error.message })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=updateProduct.js.map
