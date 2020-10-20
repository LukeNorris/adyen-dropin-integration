import express from 'express'
import colors from 'colors'
import dotenv from 'dotenv'
import fs from 'fs'
import axios from 'axios'

dotenv.config()


const adyenApiKey = process.env.ADYEN_API_KEY
const adyenClientKey = process.env.ADYEN_CLIENT_KEY
const merchantName = process.env.MERCHANT_ACCOUNT_NAME
const paymentMethodsURL = 'https://checkout-test.adyen.com/v64/paymentMethods'
const paymentsURL = 'https://checkout-test.adyen.com/v64/payments'


const app = express()

app.set('view engine', 'ejs')

app.use(express.static('public'))

app.use(express.json())


app.get('/store', (req, res) => {
    fs.readFile('items.json', function(error, data){
        if(error) {
            res.status(500).end()
        } else {
            res.render('store.ejs', {
                adyenClientKey: adyenClientKey,
                items: JSON.parse(data)
            })
        }
    })
})


app.post('/purchase', (req, res) => {
    fs.readFile('items.json', (error, data) => {
        if(error) {
            res.status(500).end()
        } else {
            const itemsJson = JSON.parse(data)
            const itemsArray = itemsJson.music.concat(itemsJson.merch)
            let total = 0

            req.body.items.forEach(item => {
                const itemJson = itemsArray.find(i => {
                  return i.id == item.id
                })
                return total = total + itemJson.price * item.quantity
            })

            const customerInfo = {
                merchantAccount: merchantName,
                amount:[total],
                channel: "Web",
                countryCode: "NL"
            }  
            const paymentMethodsHeaders = {
                "Content-Type": "application/json",
                "X-API-Key": adyenApiKey
            }

            axios.post( paymentMethodsURL, customerInfo, {
                headers: paymentMethodsHeaders
            }).then(response => {
                res.json(response.data)
            }).catch(error => {
                console.log(error, 'charge fail');
            });
        }
    })
})


app.post('/makePayment', (req, res) => {
    fs.readFile('items.json', (error, data) => {
        if(error) {
            res.status(500).end()
        } else {
            const itemsJson = JSON.parse(data)
            const itemsArray = itemsJson.music.concat(itemsJson.merch)
            let total = 0
            req.body.items.forEach(item => {
                const itemJson = itemsArray.find(i => {
                  return i.id == item.id
                })
                return total = total + itemJson.price * item.quantity
            })

            console.log(req.body.data)
            const { paymentMethod, browserInfo, billingAddress } = req.body.data

            // const paymentMethod = req.body.data.paymentMethod
            // const browserInfo = req.body.data.browserInfo
            // const billingAddress = req.body.data.billingAddress
            const paymentRequestParams = {
                merchantAccount: merchantName,
                amount:{
                    "currency": "EUR",
                    "value": total
                },
                paymentMethod: paymentMethod,
                reference:  'luke_checkoutChallenge',
                returnUrl: 'http://localhost:5000',
                channel: "Web",
                countryCode: "NL",
                //3d secure parameters
                origin: 'http://localhost:5000/store' ,
                browserInfo: browserInfo,
                billingAddress: billingAddress,
                //shopperIP: 

            }  
            const paymentHeaders = {
                "Content-Type": "application/json",
                "X-API-Key": adyenApiKey
            }

            axios.post( paymentsURL, paymentRequestParams, {
                headers: paymentHeaders
            }).then(response => {
                res.json(response.data)
            }).catch(error => {
                console.log(error, 'charge fail');
            });
        }
    })
}) 



const PORT = process.env.PORT || 5000
app.listen(PORT, console.log(`server running on port ${PORT}`.yellow.bold))