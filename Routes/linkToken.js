require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { Configuration, PlaidApi, Products, PlaidEnvironments} = require('plaid');
const plaid = require('plaid');
const express = require("express");
const router = express.Router();

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV; 

const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || Products.Transactions).split(
    ',',
  );
  
  
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(
    ',',
);

let userId = uuidv4();
console.log(`Link UserId: ${userId}`);

let LINK_TOKEN = null;

const configuration = new Configuration({
    basePath: PlaidEnvironments[PLAID_ENV],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
        'Plaid-Version': '2020-09-14',
      },
    },
});

const plaidClient = new PlaidApi(configuration);

router.get("/", (req, res, next) => {

    (async function createLinkToken(){
        try{
            const requestBody = {
                user: {
                          client_user_id: userId,
                    },
                client_id: PLAID_CLIENT_ID,
                secret: PLAID_SECRET,
                products: PLAID_PRODUCTS,
                client_name: 'Pallavi',
                country_codes: ['US'],
                language: 'en',
            };
            // const requestBod = "";
            const response = await plaidClient.linkTokenCreate(requestBody);
            // console.log(response.data);
            if (!response) {
                throw new Error(`Error: ${response.status} - ${response.statusText}`);
                return;
              }
            LINK_TOKEN = response.data.link_token;
            res.send(response.data);
        } catch (error) {
            console.log(error);
            res.send(`${error}: Oops! This file is playing hide and seek. It's shy, but our search party is on the way to bring it back.`);
        }
    })();
});

const pass = {
    router: router,
    userId: userId
}

module.exports = pass;
