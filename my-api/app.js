// app.js
   const express = require('express');
   const cors = require('cors');
   const swaggerUi = require('swagger-ui-express');
   const swaggerJSDoc = require('swagger-jsdoc');

    const app = express();
    app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    }));
    const port = 3000;

   // Swagger definition
   const swaggerOptions = {
       swaggerDefinition: {
           openapi: '3.0.0',
           info: {
               title: 'My API',
               version: '1.0.0',
               description: 'API documentation using Swagger',
           },
           servers: [
               {
                   url: `https://jubilant-space-goldfish-x5q6rj7xjjpwc9q6r-3000.app.github.dev/api`,
               },
           ],
      components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT', 
            },
        },
    },
       },
       apis: ['./routes/*.js'], // Path to your API docs
   };
   // Middleware per il parsing JSON
   app.use(express.json());
   app.use('/',express.static('public'))
   const swaggerDocs = swaggerJSDoc(swaggerOptions);
   app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

   app.listen(port, () => {
       console.log(`Server running at http://localhost:${port}`);
   });
   const userRoutes = require('./routes/user');
   app.use('/api', userRoutes);