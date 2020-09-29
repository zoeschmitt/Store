const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

// create new express app and save it as "app"
const app = express();

// server configuration
const PORT = 8080;

//dummy data

const users = [
    {
        id: '2027228e-d39d-4e89-8b2e-0eb8010536a4',
        firstName: 'Zoe',
        lastName: 'Schmitt',
        email: 'zoeschmitt@hotmail.com',
        cartIds: [
            '7fd36769-4f7a-4845-9e47-893c70988ece',
        ]
    }
];

const carts = [
    {
        userId: '027228e-d39d-4e89-8b2e-0eb8010536a4',
        cartId: '7fd36769-4f7a-4845-9e47-893c70988ece',
        cartName: 'main',
        cartItems: [
            {
                cartItemId: '31cb258d-d33b-4e9e-b0d6-e94982988186',
                quantity: 1,
                storeItemId: '9d9d5fd7-9b11-4a1d-9ba2-437ba68f220e'
            },
            {
                cartItemId: '09973742-5f60-4be2-8e83-0f19849851d9',
                quantity: 3,
                storeItemId: '1b7bc830-dde5-4f0e-93f8-a4d593e09616'
            },
        ]
    }
];

const storeItems = [
    { id: '9d9d5fd7-9b11-4a1d-9ba2-437ba68f220e', name: 'Cessna 172' },
    { id: '1b7bc830-dde5-4f0e-93f8-a4d593e09616', name: 'Cessna 150' },
    { id: 'dcf47a00-dd23-41f6-8965-81601216734d', name: 'Beechcraft Bonanza' },
    { id: 'f8747408-abc8-4fbc-968f-d09a3314feb1', name: 'Mooney M20' },
];

//middleware

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// user api

app.get('/user/:userId', (req, res) => {
    const user = users.find(u => u.id === req.params.userId);

    if (user) {
        res.json(user);
    } else {
        res.status(400).json({ msg: `No user with the id of ${req.params.userId}` });
    }
});

app.post('/user', (req, res) => {

    //create a joi object to validate the body request
    const schema = Joi.object({
        firstName: Joi.string().min(2).required(),
        lastName: Joi.string().min(2).required(),
        email: Joi.string().email().required(),
    });

    //use new joi object to validate
    const { error, value } = schema.validate({ firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email });

    if (error) {
        console.log(error);
        res.status(400).send(error);
        return;
    }

    //initializing new cart and user unique id
    let newCartId = uuidv4();
    let newUserId = uuidv4();

    const newUser = {
        id: newUserId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        cartIds: [
            newCartId,
        ]
    };

    const newCart = {
        userId: newUserId,
        cartId: newCartId,
        cartName: 'main',
        cartItems: []
    }

    users.push(newUser);
    carts.push(newCart);

    res.status(200).json(users);
});

// cart api

app.get('/user/:userId/cart', (req, res) => {
    const user = users.find(u => u.id === req.params.userId);

    if (user.cartIds.length > 0) {
        const cart = carts.find(c => c.cartId === user.cartIds[0]);
        res.status(200).json(cart);
    } else {
        res.status(400).json({ msg: `No matching cart for user ${req.params.userId}` });
    }
});

app.delete('/user/:userId/cart', (req, res) => {
    let len = carts.length;
    let len2 = users.length;
    var found = false;

    for (j = 0; j < len2; j++) {
        if (users[j].id === req.params.userId) {
            if (users[j].cartIds.length > 0) {
                for (i = 0; i < len; i++) {
                    if (carts[i].cartId === users[j].cartIds[0]) {
                        found = true;
                        carts[i].cartItems.splice(0, carts[i].cartItems.length);
                    }
                }
            } else {
                res.status(400).json({ msg: `User ${req.params.userId} has no carts` });
            }
        }
    }

    found ? res.status(200).json({ msg: `Success deleting cart` }) : res.status(400).json({ msg: `Could not find cart` });

});

// cart item api

app.post('/user/:cartId/cartItem', (req, res) => {
    var cartIndex;
    //create a joi object to validate the body request
    const schema = Joi.object({
        storeItemId: Joi.string().min(10).required(),
        quantity: Joi.number().required(),
    });

    //use new joi object to validate
    const { error, value } = schema.validate({ storeItemId: req.body.storeItemId, quantity: req.body.quantity });

    if (error) {
        console.log(error);
        res.status(400).send(error);
        return;
    }

    const cartItem = {
        cartItemId: uuidv4(),
        quantity: req.body.quantity,
        storeItemId: req.body.storeItemId,
    };

    for (i = 0; i < carts.length; i++) {
        if (carts[i].cartId === req.params.cartId) {
            cartIndex = i;
            carts[i].cartItems.push(cartItem);
        }
    }

    cartIndex !== null ? res.status(200).json(carts[cartIndex]) : res.status(400).json({ msg: `Could not add item` });
    
});

app.delete('/user/:cartId/cartItem/:cartItemId', (req, res) => {
    //item id
    //optional quantity, if none then deletes all
    res.send('Hello World');
});

// store item api

app.get('/storeItem/:storeItemId', (req, res) => {
    //item id
    //item quanitty
    res.send('Hello World');
});

app.get('/storeItem', (req, res) => {
    //query
    res.send('Hello World');
});

// make the server listen to requests
app.listen(PORT, () => {
    console.log(`Server running at: http://localhost:${PORT}/`);
});