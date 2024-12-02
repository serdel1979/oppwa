    const express = require('express');
    const fetch = require('node-fetch');

    const app = express();
    app.use(express.json()); // Middleware to parse JSON requests
    app.use(express.static(__dirname)); // Serve static files

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html'); // Serve the HTML main file
    });

    app.post('/generate-payment-link', async (req, res) => {
        const { amount, cardholderName } = req.body;
        console.log("Received amount:", amount, "Received cardholderName:", cardholderName);

        try {
            const response = await fetch('https://eu-test.oppwa.com/paybylink/v1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Bearer OGE4Mjk0MTc0YjdlY2IyODAxNGI5Njk5MjIwMDE1Y2N8ZmY0b1UhZSVlckI9YUJzQj82KyU=' //INPUT YOUR ACCESS TOKEN HERE
                },
                body: new URLSearchParams({
                    'entityId': '8a8294174b7ecb28014b9699220015ca', //INPYT YOUR ENTITY ID HERE 8a8294174b7ecb28014b9699220015ca
                    'amount': amount,
                    'currency': 'EUR',
                    'paymentType': 'DB',
                    'customer.givenName': cardholderName,
                    'shopperResultUrl': 'http://localhost:3000/payment-result'
                })
            });

            console.log("Response status:", response.status);
            let data;
            try {
                data = await response.json();
                console.log("Parsed JSON data:", data);
            } catch (parseError) {
                console.error("JSON Parse Error:", parseError);
                return res.status(400).json({ error: 'Invalid JSON response', details: parseError.message });
            }

            if (data.link) {
                res.json({ link: data.link });
            } else {
                console.error("Error in data:", data);
                res.status(400).json({ error: 'Failed to generate payment link', details: data });
            }
        } catch (error) {
            console.error('Error generating payment link:', error);
            res.status(500).json({ error: 'Failed to generate payment link' });
        }
    });


    app.post('/payment-server-to-server', async (req, res) => {
        const { amount, cardholderName } = req.body;
        console.log("Received amount:", amount, "Received cardholderName:", cardholderName);
    
        try {
            const response = await fetch('https://eu-test.oppwa.com/v1/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Bearer OGE4Mjk0MTc0YjdlY2IyODAxNGI5Njk5MjIwMDE1Y2N8ZmY0b1UhZSVlckI9YUJzQj82KyU='
                },
                body: new URLSearchParams({
                    'entityId': '8a8294174b7ecb28014b9699220015ca',
                    'amount': amount,
                    'currency': 'EUR',
                    'paymentType': 'PA', // "PA" para preautorización
                    'paymentBrand': 'VISA', // Marca de la tarjeta
                    'card.number': '4200000000000000', // Número de tarjeta de prueba
                    'card.expiryMonth': '05', // Mes de expiración
                    'card.expiryYear': '2034', // Año de expiración
                    'card.cvv': '123', // Código CVV de prueba
                    'card.holder': cardholderName // Nombre del titular
                })
            });
    
            console.log("Response status:", response.status);
    
            if (response.ok) {
                const data = await response.json();
                res.json(data); // Devuelve la respuesta al frontend
            } else {
                const errorData = await response.json();
                console.error("Error in preauthorization:", errorData);
                res.status(400).json(errorData);
            }
        } catch (error) {
            console.error('Error :', error);
            res.status(500).json({ error: 'Failed' });
        }
    });


    

    app.post('/capture-payment', async (req, res) => {
        const { paymentId } = req.body; // Obtén el `id` del pago preautorizado
    
        try {
            const response = await fetch(`https://eu-test.oppwa.com/v1/payments/${paymentId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Bearer OGE4Mjk0MTc0YjdlY2IyODAxNGI5Njk5MjIwMDE1Y2N8ZmY0b1UhZSVlckI9YUJzQj82KyU=' // Reemplaza con tu Access Token
                },
                body: new URLSearchParams({
                    'entityId': '8a8294174b7ecb28014b9699220015ca', // Reemplaza con tu Entity ID
                    'paymentType': 'CP' // Captura del pago
                })
            });
    
            if (response.ok) {
                const data = await response.json();
                console.log("Payment capture successful:", data);
                res.status(200).json(data);
            } else {
                const errorData = await response.text();
                console.error("Error in payment capture:", errorData);
                res.status(response.status).json({ error: errorData });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Failed to capture payment' });
        }
    });
    

    app.get('/payment-status/:paymentId', async (req, res) => {
        const { paymentId } = req.params;
    
        try {
            const response = await fetch(`https://eu-test.oppwa.com/v1/payments/${paymentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer OGE4Mjk0MTc0YjdlY2IyODAxNGI5Njk5MjIwMDE1Y2N8ZmY0b1UhZSVlckI9YUJzQj82KyU='
                }
            });
    
            if (response.ok) {
                const data = await response.json();
                res.status(200).json(data); // Devuelve el estado del pago
            } else {
                const errorData = await response.text();
                res.status(response.status).json({ error: errorData });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Failed to fetch payment status' });
        }
    });
    


    app.post('/refund-payment', async (req, res) => {
        const { paymentId, amount } = req.body;
    
        try {
            const response = await fetch(`https://eu-test.oppwa.com/v1/payments/${paymentId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Bearer OGE4Mjk0MTc0YjdlY2IyODAxNGI5Njk5MjIwMDE1Y2N8ZmY0b1UhZSVlckI9YUJzQj82KyU=' // Reemplaza con tu Access Token
                },
                body: new URLSearchParams({
                    'entityId': '8a8294174b7ecb28014b9699220015ca', // Reemplaza con tu Entity ID
                    'amount': amount,
                    'paymentType': 'RF', // Reembolso
                    'currency': 'EUR'
                })
            });
    
            if (response.ok) {
                const data = await response.json();
                console.log("Refund successful:", data);
                res.status(200).json(data);
            } else {
                const errorData = await response.text();
                console.error("Error in refund:", errorData);
                res.status(response.status).json({ error: errorData });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Failed to process refund' });
        }
    });
    




    app.get('/payment-result', (req, res) => {
        res.send(`
            <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <title>Payment Result</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; margin: 50px; }
                        .button { padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; text-decoration: none; font-size: 16px; cursor: pointer; }
                        .button:hover { background-color: #45a049; }
                    </style>
                </head>
                <body>
                    <h1>Payment Result</h1>
                    <p>Your payment was processed successfully.</p>
                    <a href="/" class="button">Go back to the website</a>
                </body>
            </html>
        `);
    });

    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
