/*
Store API by Zoe Schmitt (zms29)

Note: 
- As of now users only have one cart but have an array for the cartIds to allow for having multiple carts
in the future. (maybe a wish list, so in that case will add a new endpoint /wishlist).
*/

const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const app = express();

const PORT = 8080;

//
//  Dummy Data
//
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

//
//  Middleware
//

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//
//  User API
//

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

//
//  Cart API
//

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

//
//  Cart Item API
//

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
    var found = false;

    for (j = 0; j < carts.length; j++) {
        if (carts[j].cartId === req.params.cartId) {
            for (i = 0; i < carts[j].cartItems.length; i++) {
                if (carts[j].cartItems[i].cartItemId === req.params.cartItemId) {
                    found = true;
                    carts[j].cartItems.splice(i, 1);
                }
            }
        }
    }

    found ? res.status(200).json({ msg: `Success deleting item` }) : res.status(400).json({ msg: `Could not delete item` });

});

//
//  Store Item API
//

app.get('/storeItem/:storeItemId', (req, res) => {
    const item = storeItems.find(i => i.id === req.params.storeItemId);

    if (item) {
        res.status(200).json(item);
    } else {
        res.status(400).json({ msg: `No matching item for id ${req.params.storeItemId}` });
    }
});

app.get('/storeItem', (req, res) => {
    var response = [];

    if (req.query !== null) {
        for (i = 0; i < storeItems.length; i++) {
            var regex = new RegExp(req.query.query, 'gi');
            if (regex.test(storeItems[i].name)) {
                response.push(storeItems[i]);
            }
        }
    } else {
        res.status(400).json({ msg: `Error with query` });
    }

    res.json(response);
});

// make the server listen to requests
app.listen(PORT, () => {
    console.log(`Server running at: http://localhost:${PORT}/`);
});