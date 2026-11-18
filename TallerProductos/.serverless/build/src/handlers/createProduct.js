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

// src/handlers/createProduct.ts
var createProduct_exports = {};
__export(createProduct_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(createProduct_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var import_crypto = require("crypto");
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
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "El cuerpo de la petici\xF3n est\xE1 vac\xEDo" })
      };
    }
    const { name, description, price, stock, category, imageUrl } = JSON.parse(event.body);
    if (!name || price === void 0 || stock === void 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Faltan campos obligatorios: name, price y stock"
        })
      };
    }
    const productId = (0, import_crypto.randomUUID)();
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const newProduct = {
      productId,
      name: String(name).trim(),
      description: description ? String(description).trim() : "",
      price: Number(price),
      stock: Number(stock),
      category: category ? String(category).trim() : "General",
      imageUrl: imageUrl || "",
      createdBy: event.requestContext.authorizer?.userId || "system",
      createdAt
    };
    await docClient.send(
      new import_lib_dynamodb.PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: newProduct
      })
    );
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: "Producto creado exitosamente",
        product: newProduct
      })
    };
  } catch (error) {
    console.error("Error al crear producto:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Error interno al crear producto", error: error.message })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=createProduct.js.map
