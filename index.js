/*
Store API by Zoe Schmitt (zms29)
*/

const express = require('express');
const Joi = require('joi');
const url = 'mongodb+srv://dbUser:dbUserPassword@cluster0.uune5.mongodb.net/store_db?retryWrites=true&w=majority';
const mongoose = require('mongoose');
const session = require('express-session')
const MongoStore = require('connect-mongo')(session);
const User = require('./models/User')
const Cart = require('./models/Cart')
const CartItem = require('./models/CartItem')
const StoreItem = require('./models/StoreItem');
const { boolean } = require('joi');
const app = express();
const PORT = 8080;

var database;

(async () => {
    database = await mongoose.connect(url);
    database ? console.log('Successfully connected to db') : console.log('Error connecting to db');
})();


//
//  Middleware
//

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({mongooseConnection: database ? database : mongoose.connection}),
}));

//
//  User API
//

app.get('/user/:userId', async (req, res) => {
    var user;
    try {
        await User.findById(req.params.userId, function (err, foundUser) {
            if (err) {
                res.status(400).json({ msg: `Could not find user with id of ${req.params.userId}` });
                return;
            } else {
                console.log(`found user: ${foundUser}`);
                user = foundUser;
            }
        });
    } catch (e) {
        console.log(`error: ${e}`);
        res.status(400).json({ msg: `Could not find user with the id of ${req.params.userId}  ${e}` });
        return;
    }

    user != null ? res.status(200).json(user) : res.status(400).json({ msg: `No user with the id of ${req.params.userId}` });
});

app.post('/user', async (req, res) => {
    var user;
    //create a joi object to validate the body request
    const schema = Joi.object({
        firstName: Joi.string().min(2).required(),
        lastName: Joi.string().min(2).required(),
        email: Joi.string().email().required(),
    });

    //use new joi object to validate
    const { error, value } = schema.validate({ firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email });

    if (error) {
        console.log(`eror: ${error}`);
        res.status(400).send(error);
        return;
    }

    try {
        const newUser = {
            _id: new mongoose.Types.ObjectId(),
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            carts: []
        }

        const newCart = {
            _id: new mongoose.Types.ObjectId(),
            name: "main",
            user: newUser._id,
            cartItems: []
        }
        newUser.carts.push(newCart._id);
        user = await User(newUser).save();
        console.log(`new user saved: ${newUser._id}`);
        await Cart(newCart).save();
        console.log(`new cart saved: ${newCart._id}`);
    } catch (e) {
        res.status(400).json({ msg: `Could not create user, ${e}` });
        return;
    }
    user != null ? res.status(200).json(user) : res.status(400).json({ msg: `Could not create user` });
});

//
//  Cart API
//

app.get('/user/:userId/cart', async (req, res) => {
    var cart;
    try {
        cart = await Cart.findOne({ user: req.params.userId });
        console.log(`cart: ${cart}`);
    } catch (e) {
        console.log(`error: ${e}`);
        res.status(400).json({ msg: `Could not find cart with the userId of ${req.params.userId}  ${e}` });
        return;
    }
    cart != null ? res.status(200).json(cart) : res.status(400).json({ msg: `No matching cart for user ${req.params.userId}` });
});

app.delete('/user/:userId/cart', async (req, res) => {
    var cart;
    //var user;
    try {
        cart = await Cart.findOneAndDelete({ user: req.params.userId });
        //cart = await User.update({ _id: req.params.userId }, { "$pop": { "carts": -1} });
    } catch (e) {
        console.log(`error: ${e}`);
        res.status(400).json({ msg: `Could not find cart with the userId of ${req.params.userId}  ${e}` });
        return;
    }
    cart != null ? res.status(200).json({ msg: `Deleted cart ${cart}` }) : res.status(400).json({ msg: `No matching cart for user ${req.params.userId}` });
});

//
//  Cart Item API
//

app.post('/user/:cartId/cartItem', async (req, res) => {
    var cart;
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

    try {
        const newCartItem = {
            _id: new mongoose.Types.ObjectId(),
            quantity: req.body.quantity,
            cart: req.params.cartId,
            items: [req.body.storeItemId]
        }
        let cartItem = await CartItem(newCartItem).save();
        console.log(`new cart item saved: ${cartItem._id}`);
        await Cart.update({ _id: req.params.cartId }, { "$push": { "cartItems": cartItem._id}})
    } catch (e) {
        res.status(400).json({ msg: `Could not create cartItem, ${e}` });
        return;
    }
    cartItem != null ? res.status(200).json({ msg: `Successfully added item`}) : res.status(400).json({ msg: `Could not create cartitem` });
});

app.delete('/user/:cartId/cartItem/:cartItemId', async (req, res) => {
    var cartItem;
    var cart;
    try {
        cartItem = await CartItem.findByIdAndDelete(req.params.cartItemId);
        cart = await Cart.update({ _id: req.params.cartId }, { "$pull": { "cartItems": req.params.cartItemId } });
    } catch (e) {
        console.log(`error: ${e}`);
        res.status(400).json({ msg: `Could not find cart with the userId of ${req.params.cartId}  ${e}` });
        return;
    }
    cartItem != null || cart != null ? res.status(200).json({ msg: `Deleted cartItem ${cartItem}` }) : res.status(400).json({ msg: `No matching cartItem for id ${req.params.cartItemId}` });
});

//
//  Store Item API
//

app.get('/storeItem/:storeItemId', async (req, res, next) => {
    var item;
    var sessionItems = req.session.viewedItems || [];

    if (req.query) {
        next();
        return;
    }

    try {
        item = await StoreItem.findById(req.params.storeItemId);
        sessionItems.push(item._id)
        req.session.viewedItems = sessionItems;
    } catch (e) {
        console.log(`error: ${e}`);
        res.status(400).json({ msg: `Could not find item with id ${req.params.storeItemId}, ${e}` });
        return;
    }

    item != null ? res.status(200).json(item) : res.status(400).json({ msg: `No item with the id of ${req.params.storeItemId}` });
});


app.get('/storeItem', async (req, res) => {
    var items = [];
    var response = [];

    try {
        if (req.query !== null) {
            items = await StoreItem.find({});
            for (i = 0; i < items.length; i++) {
                var regex = new RegExp(req.query.query, 'gi');
                if (regex.test(items[i].name)) {
                    response.push(items[i]);
                }
            }
        }
    } catch (e) {
        console.log(`error: ${e}`);
        res.status(400).json({ msg: `Could not execute search  ${e}` });
        return;
    }
    res.json(response);
});

app.get('/storeItem/recent', async (req, res) => {
    var items = req.session.viewedItems || [];
    var response = [];
    
    try {
        if (req.query !== null) {
            for (var i = 0; i <= req.query.num || i <= items.length; i++) {
                response.push(await StoreItem.findById(items[i]));
            }
        }
    } catch (e) {
        console.log(`error: ${e}`);
        res.status(400).json({ msg: `Could not get items  ${e}` });
        return;
    }
    res.json(response);
});

// make the server listen to requests
app.listen(PORT, () => {
    console.log(`Server running at: http://localhost:${PORT}/`);
});