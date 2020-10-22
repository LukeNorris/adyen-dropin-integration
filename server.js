import express from 'express'
import colors from 'colors'
import dotenv from 'dotenv'
import fs from 'fs'
import axios from 'axios'
import bodyParser from 'body-parser'

dotenv.config()


const adyenApiKey = process.env.ADYEN_API_KEY
const adyenClientKey = process.env.ADYEN_CLIENT_KEY
const merchantName = process.env.MERCHANT_ACCOUNT_NAME
const paymentMethodsURL = 'https://checkout-test.adyen.com/v64/paymentMethods'
const paymentsURL = 'https://checkout-test.adyen.com/v64/payments'
const paymentDetailsURL = 'https://checkout-test.adyen.com/v64/payments/details'
const headers = {
    "Content-Type": "application/json",
    "X-API-Key": adyenApiKey    
}


const app = express()

app.set('view engine', 'ejs')

app.use(express.static('public'))

app.use(express.json())
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.set('trust proxy', true)


//render products to frontend
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


//get payment methods
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
           

            axios.post( paymentMethodsURL, customerInfo, {
                headers: headers
            }).then(response => {
                res.json(response.data)
            }).catch(error => {
                console.log(error, 'charge fail');
            });
        }
    })
})


// app.post('/makePayment', (req, res) => {
//     fs.readFile('items.json', (error, data) => {
//         if(error) {
//             res.status(500).end()
//         } else {
//             const itemsJson = JSON.parse(data)
//             const itemsArray = itemsJson.music.concat(itemsJson.merch)
//             let total = 0
//             req.body.items.forEach(item => {
//                 const itemJson = itemsArray.find(i => {
//                   return i.id == item.id
//                 })
//                 return total = total + itemJson.price * item.quantity
//             })

//             const ip = (
//                 req.headers['x-forwarded-for'] ||
//                 req.connection.remoteAddress ||
//                 req.socket.remoteAddress ||(req.connection.socket ? req.connection.socket.remoteAddress : null)
//             );

//             const { paymentMethod, browserInfo, billingAddress } = req.body.data
//             const paymentRequestParams = {
//                 merchantAccount: merchantName,
//                 amount:{
//                     "currency": "EUR",
//                     "value": total
//                 },
//                 paymentMethod: paymentMethod,
//                 reference:  'luke_checkoutChallenge',
//                 returnUrl: 'http://localhost:5000/store',
//                 channel: "Web",
//                 countryCode: "NL",
//                 //3d secure parameters
//                 origin: 'http://localhost:5000/store' ,
//                 browserInfo: browserInfo,
//                 billingAddress: billingAddress,
//                 shopperIP: ip,
//                 redirectFromIssuerMethod: 'POST'
//             }  
//           

//             axios.post( paymentsURL, paymentRequestParams, {
//                 headers: headers
//             }).then(response => {
//                 res.json(response.data)
//             }).catch(error => {
//                 console.log(error, 'charge fail');
//             });
//         }
//     })
// }) 


//Make a payment when customer clicks 'buy'
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

            const ip = (
                req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||(req.connection.socket ? req.connection.socket.remoteAddress : null)
            );

            console.log('payments response', req.body)

            const { paymentMethod, browserInfo, billingAddress } = req.body.data
            const paymentRequestParams = {
                merchantAccount: merchantName,
                amount:{
                    "currency": "EUR",
                    "value": total
                },
                paymentMethod: paymentMethod,
                reference:  'luke_checkoutChallenge',
                returnUrl: 'http://localhost:5000/store',
                channel: "Web",
                countryCode: "NL",
                origin: 'http://localhost:5000/store' ,
                browserInfo: browserInfo,
                billingAddress: billingAddress,
                shopperIP: ip,
                redirectFromIssuerMethod:'POST'
            }  
           
            axios.post( paymentsURL, paymentRequestParams, {
                headers: headers
            }).then(response => {
                if(response.data.action){
                    fs.writeFile(`paymentData-${paymentRequestParams.reference}.json`, 
                    response.data.action.paymentData, 
                    function(err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    console.log('action to be taken',response.data.action)
                    res.json(response.data)
                } else {
                res.json(response.data)
                }
            }).catch(error => {
                console.log(error, 'charge fail');
            });
        }
    })
}) 


//after 3DS redierect

app.post('/store', (req, res) => {
    const MD = req.body.MD;
    const PaRes = req.body.PaRes;
    const dta =  fs.readFileSync("paymentData-luke_checkoutChallenge.json", 'utf-8', (error, dta) => {
        if(error) {
            res.status(500).end()
        } else {
            return JSON.parse(dta)
        }
    })
    
    // const paymentData = dta.substr(0,dta.length -1)
       
    const paymentDetailsRequestParams = {
        details: { MD: MD, PaRes: PaRes },
        paymentData: dta
    }

    

    
    
    axios.post( paymentDetailsURL, paymentDetailsRequestParams, {
        headers: headers
    }).then(response => {
            res.json(response)
    }).then(data => {
        console.log(data)
    }).catch(error => {
            console.log(error, 'charge fail');
     });
    // fs.unlinkSync(`paymentData-luke_checkoutChallenge.json`)
})







const PORT = process.env.PORT || 5000
app.listen(PORT, console.log(`server running on port ${PORT}`.yellow.bold))