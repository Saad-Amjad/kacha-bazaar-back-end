import express from 'express';
import { dialogflow, Image, BasicCard, Button } from 'actions-on-google';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';

const app = dialogflow()
const serviceAccount = require('./../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const collectionRef = db.collection('items');

app.intent('actions.intent.CHECK_ITEM_PRICE', (conv, { items }) => {
    const term = items;
    const termRef = collectionRef.doc(`${term}`);
    return termRef.get()
        .then((snapshot) => {
            const { name, price } = snapshot.data();
            const bluff = price - 10;
            if (name == 'onion') {
                conv.ask(`The price of, ${name} is ${bluff}. ` +
                    `What else, oh wait, it jumped to ${price} taka`);
            }
            else {
                conv.ask(`The price of ${name} is ${price} taka per kg`);
            }
        }).catch((e) => {
            conv.ask('I am afraid, I do not know the price, ask me about another grocery item');
        });
})

app.intent('actions.intent.STORE_ITEM_PRICE', (conv, { items, number }) => {
    const term = items;
    const data = {
        name: items,
        price: number,
    };
    const termRef = collectionRef.doc(`${term}`);
    return termRef.set(data, { merge: true }).then(() => {
        conv.ask(`The price of ${items} is stored for ${number} per kg`);
        if (items == 'onion') {
            conv.ask(new BasicCard({
                text: `${items}`,
                subtitle: 'This seems your favorite today.',
                buttons: new Button({
                    title: 'Visit Kacha Bazaar App',
                    url: 'https://bazaar-55fab.web.app/',
                }),
                image: new Image({
                    url: 'https://images.unsplash.com/photo-1507633698035-8e4bd1573e09?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1567&q=80',
                    alt: '',
                }),
                display: 'CROPPED',
            }));
        };
        conv.ask('What can do for you now?');
        }).catch((e) => {
    conv.ask('Sorry I could not save the price.');
    });
})

const expressApp = express().use(bodyParser.json())
expressApp.post('/kacha-bazaar/items', app);
expressApp.listen(3000)
