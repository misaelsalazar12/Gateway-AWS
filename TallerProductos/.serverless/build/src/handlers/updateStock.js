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

// src/handlers/updateStock.ts
var updateStock_exports = {};
__export(updateStock_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(updateStock_exports);
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
    const { stock, quantity } = JSON.parse(event.body);
    const currentStock = Number(existing.Item.stock || 0);
    let newStock;
    if (stock !== void 0) {
      newStock = Number(stock);
    } else if (quantity !== void 0) {
      newStock = currentStock + Number(quantity);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Debes proporcionar "stock" (nuevo total) o "quantity" (cantidad a sumar/restar)'
        })
      };
    }
    if (newStock < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Stock insuficiente. El stock no puede quedar en negativo",
          currentStock
        })
      };
    }
    const updated = await docClient.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: PRODUCTS_TABLE,
        Key: { productId },
        UpdateExpression: "SET #stock = :stock, #updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#stock": "stock",
          "#updatedAt": "updatedAt"
        },
        ExpressionAttributeValues: {
          ":stock": newStock,
          ":updatedAt": (/* @__PURE__ */ new Date()).toISOString()
        },
        ReturnValues: "ALL_NEW"
      })
    );
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Stock actualizado correctamente",
        previousStock: currentStock,
        newStock: updated.Attributes?.stock,
        product: updated.Attributes
      })
    };
  } catch (error) {
    console.error("Error en updateStock:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Error al actualizar el stock", error: error.message })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=updateStock.js.map
