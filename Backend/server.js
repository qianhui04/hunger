// server.js
const express = require('express');
const cors = require('cors');

// swagger.js
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const foodListingsRouter = require('./routes/foodListingsRoutes');
const locationRouter = require('./routes/locationRoutes');
const dashboardRouter = require('./routes/dashboardRoutes');
const authRouter = require('./routes/authRoutes');
const userActivityRouter = require('./routes/userActivityRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Backend server is running'
    });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Application MVC Pipeline Mapping Registry Base 
app.use(authRouter); // Mount root entry-points directly
app.use('/api', foodListingsRouter);
app.use('/api', locationRouter);
app.use('/api', dashboardRouter);
app.use('/api', userActivityRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server executing operations fluidly under port ${PORT}`);
});