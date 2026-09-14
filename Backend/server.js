// server.js
const express = require('express');
const cors = require('cors');

const foodListingsRouter = require('./routes/foodListingsRoutes');
const locationRouter = require('./routes/locationRoutes');
const dashboardRouter = require('./routes/dashboardRoutes');
const authRouter = require('./routes/authRoutes'); // <-- Import new Authentication router

const app = express();

app.use(cors());
app.use(express.json());

// Application MVC Pipeline Mapping Registry Base 
app.use(authRouter); // Mount root entry-points directly
app.use('/api', foodListingsRouter);
app.use('/api', locationRouter);
app.use('/api', dashboardRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server executing operations fluidly under port ${PORT}`);
});