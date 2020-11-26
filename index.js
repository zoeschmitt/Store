/*
Store API by Zoe Schmitt (zms29)
*/

const express = require('express');
const jwt = require('jsonwebtoken');
const accessTokenSecret = "someSecretIJustInvented!";
var cors = require('cors');
const Joi = require('joi');
const url = 'mongodb+srv://dbUser:dbUserPassword@cluster0.uune5.mongodb.net/store_db?retryWrites=true&w=majority';
const mongoose = require('mongoose');
const session = require('express-session')
const MongoStore = require('connect-mongo')(session);
const User = require('./models/User')
const Cart = require('./models/Cart')
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
app.use(cors());
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

app.post('/user/signin', async (req, res) => {
    var user;
    //create a joi object to validate the body request
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(2).required(),
    });

    //use new joi object to validate
    const { error, value } = schema.validate({ email: req.body.email, password: req.body.password });

    if (error) {
        console.log(`eror: ${error}`);
        res.status(400).send(error);
        return;
    }

    try {
        const {email, password} = req.body;
        const user = await User.findOne({email, password}).populate('carts');
        if (user) {
            //User was found, create a token!
            const accessToken = jwt.sign({user}, accessTokenSecret);
            res.status(200).json({jwt: accessToken, userId: user._id, firstName: user.firstName, lastName: user.lastName, carts: user.carts});
        } else {
            res.sendStatus(403);
        }
    } catch(e){
        return res.status(400).send(e)
    }
})

//create a new user
app.post('/user', async (req, res) => {
    var user;
    //create a joi object to validate the body request
    const schema = Joi.object({
        firstName: Joi.string().min(2).required(),
        lastName: Joi.string().min(2).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(2).required()
    });

    //use new joi object to validate
    const { error, value } = schema.validate({ firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email, password: req.body.password });

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
            password: req.body.password,
            carts: []
        }

        const newCart = {
            _id: new mongoose.Types.ObjectId(),
            name: "main",
            user: newUser._id,
            items: []
        }
        newUser.carts.push(newCart._id);
        user = await User(newUser).save();
        console.log(`new user saved: ${newUser._id}`);
        await Cart(newCart).save();
        console.log(`new cart saved: ${newCart._id}`);
        const accessToken = jwt.sign({user}, accessTokenSecret);
        console.log(`jwt token created`);
        res.status(200).json({jwt: accessToken, userId: user._id, firstName: user.firstName, lastName: user.lastName, carts: user.carts});
    } catch (e) {
        res.status(400).json({ msg: `Could not create user, ${e}` });
        return;
    }
});

app.use(async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            //Bearer eyJhbGci...
            const jwtToken = authHeader.split(' ')[1];
            const user = jwt.verify(jwtToken, accessTokenSecret);
            req.userJwt = user;
        } else {
            return res.send(401);
        }
    } catch (err) {
        res.send(403);
    }
    next();
})

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
        if (req.userJwt.user._id !== user.id) {
            return res.sendStatus(403);
        }
    } catch (e) {
        console.log(`error: ${e}`);
        res.status(400).json({ msg: `Could not find user with the id of ${req.params.userId}  ${e}` });
        return;
    }

    user != null ? res.status(200).json(user) : res.status(400).json({ msg: `No user with the id of ${req.params.userId}` });
});

//
//  Cart API
//

app.get('/user/:userId/cart', async (req, res) => {
    var cart;
    try {
        cart = await Cart.findOne({ user: req.params.userId }).populate('cartItems.item');
        //console.log(`cart: ${cart}`);
        if (req.userJwt.user._id !== req.params.userId) {
            return res.send(403);
        }
        res.status(200).json(cart)
    } catch (e) {
        console.log(`error: ${e}`);
        res.status(400).json({ msg: `Could not find cart with the userId of ${req.params.userId}  ${e}` });
        return;
    }
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

    //create a joi object to validate the body request
    const schema = Joi.object({
        storeItemId: Joi.string().min(5).required(),
        quantity: Joi.number().required(),
    });

    //use new joi object to validate
    const { error, value } = schema.validate({ storeItemId: req.body.storeItemId, quantity: req.body.quantity });

    if (error) {
        console.log(error);
        res.status(400).send(error);
        return;
    }
    var cart = await Cart.findById(req.params.cartId).populate('cartItems.item');
    const cartItemAlreadyInCart = await cart.cartItems.find(cartItem => {
        return cartItem.item._id.toString() == req.body.storeItemId;
    });
    if (cartItemAlreadyInCart) {
        try {
            cartItemAlreadyInCart.quantity += req.body.quantity;
            cart = await cart.save();
            res.status(200).send(cart)
        } catch (e) {
            res.status(400).json({ msg: `Could not create cartItem, ${e}` });
            return;
        }
    } else {
        try {
            var storeItem = await StoreItem.findById(req.body.storeItemId);
            cart.cartItems.push({quantity: req.body.quantity, item: storeItem});
            cart = await cart.save();
            res.status(200).send(cart)
        } catch (e) {
            res.status(400).json({ msg: `Could not create cartItem, ${e}` });
            return;
        }
    }
});

app.delete('/user/:cartId/cartItem/:cartItemId', async (req, res) => {
    var cartItem;
    var cart;
    try {
        cart = await Cart.findById(req.params.cartId).populate('cartItems.item');
        if (!cart){
            return res.sendStatus(404);
        }
        const cartItem = cart.items.find(item => {
            return item.id.toString() == req.params.cartItemId
        });
        if (!cartItem){
            return res.sendStatus(404);
        }
        cart.items.pull(cartItem);
        cart = await cart.save();
        res.status(200).json(cart);
    } catch (e) {
        console.log(`error: ${e}`);
        res.status(400).json({ msg: `Could not find cart with the userId of ${req.params.cartId}  ${e}` });
        return;
    }
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