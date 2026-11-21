import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";

const options: swaggerJsdoc.OAS3Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MotoTrack API",
      version: "1.0.0",
      description: "REST API documentation for MotoTrack",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [
    path.join(__dirname, "../routes/**/*.ts"),
    path.join(__dirname, "../routes/**/*.js"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
