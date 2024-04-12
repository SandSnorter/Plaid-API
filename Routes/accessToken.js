require('dotenv').config();
const { Configuration, PlaidApi, Products, PlaidEnvironments} = require('plaid');
const plaid = require('plaid');
const express = require("express");
const router = express.Router();
const Access = require('../models/access');
const obj = require('./linkToken');
const PlaidItem = require("../models/plaid-item");
const PlaidAccount = require("../models/plaid-account");

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV; 

const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || Products.Transactions).split(
    ',',
  );

const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(
    ',',
);

const userId = obj.userId;

let PUBLIC_TOKEN = null;
let ACCESS_TOKEN = null;
let publicResponse = null;
let accessResponse = null;
let mainItemResponse = null;
let mainAccountsResponse = null;
let results = false;

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

router.post('/', (req, res, next) => {
        (async function createPublicToken(){
            try {
                const request = {
                    client_id: PLAID_CLIENT_ID,
                    secret: PLAID_SECRET,
                    institution_id: 'ins_1',
                    initial_products: PLAID_PRODUCTS
                };
                const createResponse = await plaidClient.sandboxPublicTokenCreate(request);
                if (!createResponse) {
                    throw new Error(`Error: ${createResponse.status} - ${createResponse.statusText}`);
                    return;
                  }
                PUBLIC_TOKEN = createResponse.data.public_token;
                publicResponse = createResponse.data;
                console.log(`Public Token: ${PUBLIC_TOKEN}`);
                // res.send(createResponse.data);
            } catch(err) {
                console.error(err.message);
                res.send(err.message);
            }
        })().then( () => {
            if(PUBLIC_TOKEN){
                (async function exchangeTokens(){
                    try {
                        const body = {
                            public_token: PUBLIC_TOKEN,
                        };
                        // const bod = "";
                        const tokenResponse = await plaidClient.itemPublicTokenExchange(body);
                        if (!tokenResponse) {
                            throw new Error(`Error: ${tokenResponse.status} - ${tokenResponse.statusText}`);
                            return;
                        }
                        ACCESS_TOKEN = tokenResponse.data.access_token;
                        accessResponse = tokenResponse.data;
                        console.log(`Access Token: ${ACCESS_TOKEN}`);
                        console.log(`Access Item ID: ${tokenResponse.data.item_id}`);
                        results = true;

                        res.send(tokenResponse.data);
                        const data = new Access({
                            user_id: userId,
                            access_token: ACCESS_TOKEN,
                            item_id: tokenResponse.data.item_id,
                            request_id: tokenResponse.data.request_id
                          });
                        console.log(`Access USerID: ${data.user_id}`);
                        data.save().then(() => {
                            console.log("Access token saved to the database successfully!");
                        })

                        const input = {
                            access_token: ACCESS_TOKEN
                        }

                        const itemResponse = await plaidClient.itemGet(input).catch(console.error);
                        const item = itemResponse.data.item;
                        mainItemResponse = itemResponse.data.item;
                        console.log(`Item ID: ${item.item_id}`);
                        const user = await Access.findOne().exec();

                        const itemInfo = await new PlaidItem({
                            userId: userId,
                            availableProducts: item.available_products,
                            billedProducts: item.billed_products,
                            institutionId: item.institution_id,
                            itemId: item.item_id,
                            webhook: item.webhook
                        }).save();

                        const accountsResponse = await plaidClient.accountsGet(input).catch(console.error);
                        const accounts = accountsResponse.data.accounts;
                        mainAccountsResponse = accountsResponse.data.accounts;

                        const savedAccounts = accounts.map(
                        async account =>
                            await new PlaidAccount({
                            plaidItemId: itemInfo.itemId,
                            accountId: account.account_id,
                            mask: account.mask,
                            balances: account.balances,
                            name: account.name,
                            officialName: account.official_name,
                            subtype: account.subtype,
                            type: account.type
                            }).save()
                        );

                    } catch(error) {
                        // results = false;
                        console.error(error);
                        res.send(error.message);
                    }
                })();
            }else{
                res.send("Error: Failed to create Public token!");
            }
        })
});

router.get('/', (req, res, next) => {
    if(ACCESS_TOKEN){
        console.log('Successfully created the access token');
        res.send({
            Results: "Successfully created the access token",
            Public: publicResponse,
            Access: accessResponse,
            // Item: mainItemResponse,
            // Accounts: mainAccountsResponse
        });
    }else{
        console.log('Failed to create the access token');
        res.send({
            Results: "Failed to create the access token",
            Error: "Request failed with status code 400. Please follow the documentation or contact support for assistance."
        });
    }
});

module.exports = router;