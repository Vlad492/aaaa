const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const serverless = require("serverless-http");
const paypal = require('paypal-rest-sdk');
const app = express();
const router = express.Router();

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AXg2UVqQZi4uYEMdMAK8qVey0tmD8mZiBdONsEcLKJyD6Ak_ol8aq8peqKz15OZF4tj1vSu1gh1ukPi0',
    'client_secret': 'EIcyzhcwiIS_IrtoVqoMigaO8y9rT6vwZjBWDxcZC3nnbnoqnsk_VUTGCPHMUlsSFH2wENdjUg6fSGiy'
  });

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

router.get("/hello", (req, res) => {
    console.log('Hello!');
    res.send({ message: "Hello!" });
});

router.get('/pay', (req, res) => {
    const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "https://affectionate-panini-f73590.netlify.app/.netlify/functions/api/success",
          "cancel_url": "https://affectionate-panini-f73590.netlify.app/.netlify/functions/api/cancel"
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": "Diet",
                  "price": "6.99",
                  "currency": "USD",
                  "quantity": 1
              }]
          },
          "amount": {
              "currency": "USD",
              "total": "6.99"
          },
          "description": "Diet specially for you"
      }]
  };
  
  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {
        for(let i = 0;i < payment.links.length;i++){
          if(payment.links[i].rel === 'approval_url'){
            res.redirect(payment.links[i].href);
          }
        }
    }
  });
  
  });
  router.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
  
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": "USD",
              "total": "6.99"
          }
      }]
    };
  
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          console.log(JSON.stringify(payment));
          res.send(`<!DOCTYPE html>
          <html lang="en">
          
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Thank you</title>
          </head>
          
          <body>
              <style>
                  body {
                      width: 100%;
                      height: 100vh;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                  }
                  h1{
          
                  }
                  a{
                      text-decoration: none;
                      color: blue;
                  }
              </style>
              <h1>
                  Thank you!
              </h1>
              <a href="/">
                  Come back to main page
              </a>
          
          </body>
          
          </html>`);
      }
  });
  });
  router.get('/cancel', (req, res) => res.send('Payment has been cancelled'));
app.use("/.netlify/functions/api", router); // path must route to lambda


module.exports = app;
module.exports.handler = serverless(app);
