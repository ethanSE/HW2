Ethan Samuels-Ellingson  
12/6/2020  
HW2 for Node.js Master Class from Pirple.com  


API Documentation:   
this API accepts requests with bodies of type JSON

# /Users: #  
## /users/post  ##
    used to create a new user  
    required: newUserObject (body)
    newUserObject = {
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        streetAddress: string
    }
## /users/get ##
    get a user object
    required: email (query parameter), token (header)
## /users/put ##
    used to update user attributes
    required: updateObject, token(header)
    updateObject = {
        email: string (required),
        firstName: string (optional),
        lastName: string (optional),
        streetAddress: string (optional),
        password: string (optional)
    }
    must supply one or more attribute to update, email, and token
## /users/delete ##
    used to delete a user
    required: email (query parameter), token (header)
# /tokens #
## /tokens/post ##
    create a token to perform authenticated requests
    required: email and password in body
    created token will be in response
## /tokens/get ##
    get a token
    required: token (query string param)
    ex: .../tokens/get?token=TOKEN_ID_TO_GET
## /tokens/put ##
    tokens can be extended to remain logged in
    required: extendRequestBody
    extendRequestBody = {
        token: TOKEN_TO_EXTEND,
        extend: true
    }
    tokens can only be extended if they have not already expired. If a token has expired create a new token with tokens/post
## /tokens/delete ##
    delete a token to log the client out
    required: tokenId (query parameter), email(body)
# /orders #
## /orders/post ##
    create an order
    required: email (body), token(header)
    will respond with new order (with orderId) when created
## /orders/get ##
    get an order
    required: orderId(query parameter), token(header)
## /orders/put ## 
    updates an order
    add / remove items
    checkout
    required: token (header), updateOrderObject (body)
    ex:
    updateOrderObject={ 
        orderId: string,
        "item0" : 3,
        "item1": 5,
        "item2": 0,
        stripeToken: string
    }
    can make multiple updates and update multiple itemIds and quantities in a single request.
    order object functions as a 'cart' pre-payment.
    pass stripeToken to place order.
