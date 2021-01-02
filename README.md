Ethan Samuels-Ellingson  
12/6/2020  

Full stack application for a pizza restaurant. Serves front end resources that allow a client to interact with the backend to create a user, log in, create/edit/delete orders and checkout.

API Documentation:   
this API accepts requests with bodies of type JSON

# /api/Users: #  
## /api/users/post  ##
    used to create a new user  
    required: newUserObject (body)
    newUserObject = {
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        streetAddress: string
    }
## /api/users/get ##
    get a user object
    required: email (query parameter), token (header)
## /api/users/put ##
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
## /api/users/delete ##
    used to delete a user
    required: email (query parameter), token (header)
# /api/tokens #
## /api/tokens/post ##
    create a token to perform authenticated requests
    required: email and password in body
    created token will be in response
## /api/tokens/get ##
    get a token
    required: token (query string param)
    ex: .../tokens/get?token=TOKEN_ID_TO_GET
## /api/tokens/put ##
    tokens can be extended to remain logged in
    required: extendRequestBody
    extendRequestBody = {
        tokenId: TOKENID_TO_EXTEND,
        extend: true
    }
    tokens can only be extended if they have not already expired. If a token has expired create a new token with tokens/post
## /api/tokens/delete ##
    delete a token to log the client out
    required: tokenId (query parameter), email(body)
# /api/orders #
## /api/orders/post ##
    create an order
    required: email (body), token(header)
    will respond with new order (with orderId) when created
## /api/orders/get ##
    get an order
    required: orderId(query parameter), token(header)
## /api/orders/put ## 
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
