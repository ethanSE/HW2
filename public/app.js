/*
 * Frontend Logic for application
 *
 */

// Container for frontend application
let app = {};

// Config
app.config = {
    'sessionToken': false
};

// AJAX Client (for RESTful API)
app.client = {}

// Interface for making API calls returns a promise
app.client.request = (headers = {}, path, method, queryStringObject, payload) => {
    return new Promise(async (resolve) => {
        // Set defaults
        path = typeof (path) == 'string' ? path : '/';
        method = typeof (method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].includes(method.toUpperCase()) ? method.toUpperCase() : 'GET';
        queryStringObject = typeof (queryStringObject) == 'object' && queryStringObject || {};
        payload = typeof (payload) == 'object' && payload || {};

        // For each query string parameter sent, add it to the path
        let requestUrl = path + '?';
        let counter = 0;
        for (let queryKey in queryStringObject) {
            if (queryStringObject.hasOwnProperty(queryKey)) {
                counter++;
                // If at least one query string parameter has already been added, preprend new ones with an ampersand
                if (counter > 1) {
                    requestUrl += '&';
                }
                // Add the key and value
                requestUrl += queryKey + '=' + queryStringObject[queryKey];
            }
        }

        // Form the http request as a JSON type
        let xhr = new XMLHttpRequest();
        xhr.open(method, requestUrl, true);
        xhr.setRequestHeader("Content-type", "application/json");

        // For each header sent, add it to the request
        for (let headerKey in headers) {
            if (headers.hasOwnProperty(headerKey)) {
                xhr.setRequestHeader(headerKey, headers[headerKey]);
            }
        }

        // If there is a current session token set, add that as a header
        if (app.config.sessionToken) {
            xhr.setRequestHeader("token", app.config.sessionToken.tokenId);
        }

        // When the request comes back, handle the response
        xhr.onreadystatechange = () => {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                let statusCode = xhr.status;
                let responseReturned = xhr.responseText;
                try {
                    let parsedResponse = JSON.parse(responseReturned);
                    resolve({ statusCode: statusCode, payload: parsedResponse })
                } catch (e) {
                    resolve({ statusCode: statusCode })
                }
            }
        }

        // Send the payload as JSON
        let payloadString = JSON.stringify(payload);
        xhr.send(payloadString);
    })
};

// Bind the forms
app.bindForms = () => {
    let allForms = Array.from(document.querySelectorAll("form"));
    allForms.forEach((form) => {
        form.addEventListener("submit", async (e) => {
            // Stop it from submitting
            e.preventDefault();
            let formId = form.id;
            let path = form.action;
            let method = form.method.toUpperCase();

            // Hide the error message (if it's currently shown due to a previous error)
            document.querySelector("#" + formId + " .formError").style.display = 'none';

            // Hide the success message (if it's currently shown due to a previous success)
            if (document.querySelector("#" + formId + " .formSuccess")) {
                document.querySelector("#" + formId + " .formSuccess").style.display = 'none';
            }

            // Turn the inputs into a payload
            let payload = {};

            Array.from(form.elements).forEach((element) => {
                if (element.type !== 'submit') {
                    // Determine class of element and set value accordingly
                    let classOfElement = typeof (element.classList.value) == 'string' && element.classList.value || '';
                    let valueOfElement = element.type == 'checkbox' && !classOfElement.includes('multiselect') ? element.checked : !classOfElement.includes('intval') ? element.value : parseInt(element.value);
                    let elementIsChecked = element.checked;
                    // Override the method of the form if the input's name is _method
                    let nameOfElement = element.name;
                    if (nameOfElement == '_method') {
                        method = valueOfElement;
                    } else {
                        // Create an payload field named "method" if the elements name is actually httpmethod
                        if (nameOfElement == 'httpmethod') {
                            nameOfElement = 'method';
                        }
                        // Create an payload field named "id" if the elements name is actually uid
                        if (nameOfElement == 'uid') {
                            nameOfElement = 'id';
                        }
                        // If the element has the class "multiselect" add its value(s) as array elements
                        if (classOfElement.includes('multiselect')) {
                            if (elementIsChecked) {
                                payload[nameOfElement] = typeof (payload[nameOfElement]) == 'object' && payload[nameOfElement] instanceof Array ? payload[nameOfElement] : [];
                                payload[nameOfElement].push(valueOfElement);
                            }
                        } else {
                            payload[nameOfElement] = valueOfElement;
                        }
                    }
                }
            })

            // If the method is DELETE, the payload should be a queryStringObject instead
            let queryStringObject = method == 'DELETE' ? payload : {};

            // Call the API
            let requestResult = await app.client.request(undefined, path, method, queryStringObject, payload)
            // Display an error on the form if needed
            if (requestResult.statusCode !== 200) {

                if (requestResult.statusCode == 403) {
                    // log the user out
                    app.logUserOut();
                } else {

                    // Try to get the error from the api, or set a default error message
                    let error = requestResult.payload?.Error || 'An error has occured, please try again';

                    // Set the formError field with the error text
                    document.querySelector("#" + formId + " .formError").innerHTML = error;

                    // Show (unhide) the form error field on the form
                    document.querySelector("#" + formId + " .formError").style.display = 'block';
                }
            } else {
                // If successful, send to form response processor
                app.formResponseProcessor(formId, payload, requestResult.payload);
            }
        });
    });
};

// Form response processor
app.formResponseProcessor = async (formId, requestPayload, responsePayload) => {
    // If account creation was successful, try to immediately log the user in
    if (formId == 'accountCreate') {
        // Take the phone and password, and use it to log the user in
        let newPayload = {
            'email': requestPayload.email,
            'password': requestPayload.password
        };

        let response = await app.client.request(undefined, 'api/tokens', 'POST', undefined, newPayload)

        // Display an error on the form if needed
        if (response.statusCode !== 200) {

            // Set the formError field with the error text
            document.querySelector("#" + formId + " .formError").innerHTML = 'Sorry, an error has occured. Please try again.';

            // Show (unhide) the form error field on the form
            document.querySelector("#" + formId + " .formError").style.display = 'block';
        } else {
            // If successful, set the token and redirect the user
            app.setSessionToken(response.payload);
            window.location = '';
        }
    }
    // If login was successful, set the token in localstorage and redirect the user
    if (formId == 'sessionCreate') {
        app.setSessionToken(responsePayload);
        window.location = '/orders/all';
    }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = (token) => {
    app.config.sessionToken = token;
    let tokenString = JSON.stringify(token);
    localStorage.setItem('token', tokenString);
    if (typeof (token) == 'object') {
        app.setLoggedInClass(true);
    } else {
        app.setLoggedInClass(false);
    }
};

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = () => {
    let tokenString = localStorage.getItem('token');
    if (typeof (tokenString) == 'string') {
        try {
            let token = JSON.parse(tokenString);
            app.config.sessionToken = token;
            if (typeof (token) == 'object') {
                app.setLoggedInClass(true);
            } else {
                app.setLoggedInClass(false);
            }
        } catch (e) {
            app.config.sessionToken = false;
            app.setLoggedInClass(false);
        }
    }
};

// Bind the logout button
app.bindLogoutButton = () => {
    document.getElementById("logoutButton").addEventListener("click", (e) => {
        // Stop it from redirecting anywhere
        e.preventDefault();
        // Log the user out
        app.logUserOut();
    });
};

// Log the user out then redirect them
app.logUserOut = async (redirectUser = true) => {
    // Get the current token id
    let tokenId = typeof (app.config.sessionToken.id) == 'string' && app.config.sessionToken.id;

    // Send the current token to the tokens endpoint to delete it
    let queryStringObject = {
        'id': tokenId
    };
    app.client.request(undefined, 'api/tokens', 'DELETE', queryStringObject, undefined)
    // Set the app.config token as false
    app.setSessionToken(false);
    // Send the user to the logged out page
    if (redirectUser) {
        window.location = 'session/deleted';
    }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = (add) => {
    let target = document.querySelector("body");
    if (add) {
        target.classList.add('loggedIn');
    } else {
        target.classList.remove('loggedIn');
    }
};

// Renew the token
app.renewToken = () => {
    return new Promise(async (resolve, reject) => {
        let currentTokenId = app.config.sessionToken?.tokenId || null;
        if (currentTokenId) {
            // Update the token with a new expiration
            let payload = {
                'tokenId': currentTokenId,
                'extend': true,
            }
            //make extend request
            let extendResponse = await app.client.request(undefined, 'api/tokens', 'PUT', undefined, payload)
            if (extendResponse.statusCode == 200) {
                // Get the new token details
                let queryStringObject = { 'id': currentTokenId };
                let getTokenResponse = await app.client.request(undefined, 'api/tokens', 'GET', queryStringObject, undefined)
                if (getTokenResponse.statusCode == 200) {
                    resolve(getTokenResponse.payload);
                } else {
                    reject();
                }
            } else {
                reject();
            }
        } else {
            reject();
        }
    })
};

// Loop to renew token often
app.tokenRenewalLoop = () => {
    setInterval(async () => {
        try {
            let token = await app.renewToken();
            app.setSessionToken(token);
            console.log("Token renewed successfully @ " + Date.now(), token);
        } catch (e) {
            console.log('error renewing session token')
        }
    }, 1000 * 60);
};

app.loadDataOnPage = () => {
    // Get the current page from the body class
    var bodyClasses = document.querySelector("body").classList;
    var primaryClass = typeof (bodyClasses[0]) == 'string' ? bodyClasses[0] : false;

    // Logic for dashboard page
    if (primaryClass == 'ordersList') {
        app.loadOrdersListPage();
    }
};

app.loadOrdersListPage = async () => {
    // Get the phone number from the current token, or log the user out if none is there
    var email = typeof (app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
    if (email) {
        // Fetch the user data
        var userQueryStringObject = {
            'email': email
        };

        let getOrderUpdateDOM = async (orderId) => {
            // Get the data for the order
            var orderQueryStringObject = {
                'orderId': orderId
            };
            let orderDataResult = await app.client.request(undefined, 'api/orders', 'GET', orderQueryStringObject, undefined);

            if (orderDataResult.statusCode == 200) {
                // Make the order data into a table row
                var table = document.getElementById("ordersListTable");
                var tr = table.insertRow(-1);
                tr.classList.add('orderRow');
                var td0 = tr.insertCell(0);
                var td1 = tr.insertCell(1);
                var td2 = tr.insertCell(2);
                var td3 = tr.insertCell(3);
                var td4 = tr.insertCell(4);
                td0.innerHTML = orderDataResult.payload.orderId;
                td1.innerHTML = orderDataResult.payload.totalPrice;
                let itemCount = Object.keys(orderDataResult.payload.items).reduce((acc, curr) => acc + orderDataResult.payload.items[curr], 0);
                td2.innerHTML = itemCount;
                td3.innerHTML = orderDataResult.payload.placed;
                td4.innerHTML = `<a href="/orders/edit?id=${orderDataResult.payload.orderId}">${orderDataResult.payload.placed ? "View" : "View / Edit / Delete"}</a>`;
            } else {
                console.log("Error trying to load order ID: ", orderId);
            }
            document.getElementById("noOrdersMessage").style.display = 'none';
        }

        //bind to the order create button
        document.getElementById("createOrderButton").addEventListener("click", async (e) => {
            // Stop it from redirecting anywhere
            e.preventDefault();
            console.log('clicked')
            let createResult = await app.client.request(undefined, 'api/orders', 'POST', undefined, { email: email })
            if (createResult.statusCode === 200) {
                console.log('created order successfully')
                console.log(createResult)
                getOrderUpdateDOM(createResult.payload.orderId)
            } else {
                console.log('error')
                document.getElementById("errorMessage").innerHTML = '<p>error - failed to create order</p>';
            }
        });

        let userDataResult = await app.client.request(undefined, 'api/users', 'GET', userQueryStringObject, undefined)
        if (userDataResult.statusCode == 200) {
            // Determine how many orders the user has
            var allOrders = userDataResult.payload.orders;
            if (allOrders?.length > 0) {
                // Show each created order as a new row in the table
                allOrders.forEach((orderId) => getOrderUpdateDOM(orderId));
            } else {
                // Show 'you have no orders' message
                document.getElementById("noOrdersMessage").style.display = 'table-row';
                // Show the createOrder CTA
                document.getElementById("createOrderCTA").style.display = 'block';
            }
        } else {
            // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
            app.logUserOut();
        }
    } else {
        app.logUserOut();
    }
}

app.init = () => {
    //bind forms
    app.bindForms();

    // Bind logout logout button
    app.bindLogoutButton();

    // Get the token from localstorage
    app.getSessionToken();

    // set loop to auto renew token (keep user logged in)
    app.tokenRenewalLoop();

    // get data
    app.loadDataOnPage();
}

// Call the init processes after the window loads
window.onload = () => {
    app.init();
};
