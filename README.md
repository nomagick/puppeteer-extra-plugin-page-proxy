![npm](https://img.shields.io/npm/v/puppeteer-extra-plugin-page-proxy?style=flat-square)
![node-current](https://img.shields.io/node/v/puppeteer?style=flat-square)
![npm](https://img.shields.io/npm/dt/puppeteer-extra-plugin-page-proxy?style=flat-square)

# puppeteer-extra-plugin-page-proxy <img src="https://i.ibb.co/kQrN9QJ/puppeteer-page-proxy-logo.png" align="right" width="150" height="150">
Plugin to use with **[puppeteer-extra](https://www.npmjs.com/package/puppeteer-extra)** for setting proxies per page basis.

Forwards intercepted requests from the browser to Node.js where it redoes the requests through a proxy and then returns the response to the browser.

Forked from [puppeteer-page-proxy](https://github.com/Cuadrix/puppeteer-page-proxy).


## Features

- Proxy per page and proxy per request
- Supports **http**, **https**, **socks4** and **socks5** proxies
- Supports authentication
- Handles cookies

## Installation
```
npm i puppeteer puppeteer-extra puppeteer-extra-plugin-page-proxy
```
## Usage

#### Importing:
```typescript
import puppeteer from 'puppeteer-extra';
import puppeteerPageProxy from 'puppeteer-extra-plugin-page-proxy';

// Load the plugin but no proxy active
puppeteer.use(puppeteerPageProxy());
```

#### Global proxy:
```typescript
// Load and set a global proxy (for all the future pages)
puppeteer.use(puppeteerPageProxy('https://user:pass@host:port'));
```

#### Cooperative interception:
Learn more about this concept here: [cooperative-intercept-mode](https://pptr.dev/guides/network-interception#cooperative-intercept-mode)
```typescript
puppeteer.use(
    puppeteerPageProxy({
        interceptResolutionPriority: 0
    })
);
```

#### Per page proxy:
```typescript
// After loading the plugin
puppeteer.use(puppeteerPageProxy());

// ... when you get a page
page1.useProxy('https://user:pass@host:port');
page2.useProxy('http://user:pass@host:port');
page3.useProxy('socks5://user:pass@host:port');
page4.useProxy('socks4://user:pass@host:port');

// Go back using the global proxy again
page1.useProxy(undefined);

// Stop using any proxy
page1.useProxy(null);

// Go back using the global proxy but with a different priority
page4.useProxy(undefined, {
    interceptResolutionPriority: 1
});
page5.useProxy({
    interceptResolutionPriority: 1
});
```

#### Only proxy navigation requests:
```typescript
// After loading the plugin
puppeteer.use(puppeteerPageProxy({
    onlyNavigation: true
}));

// ... or override on page level
page.useProxy('https://user:pass@host:port', {
    onlyNavigation: true
});
```

#### Intercept by yourself and only use the proxy function:
```typescript
import { getProxiedResponse } from 'puppeteer-extra-plugin-page-proxy';

page.on('request', (request)=> {
    // ... your logic
    const response = await getProxiedResponse(request, 'https://user:pass@host:port', {
        // Optional overrides. See typings for detail.
    });
    request.respond(response);
    // ... your other logic
});
```

## FAQ
#### How does this module work?

It takes over the task of requesting content **from** the browser to do it internally via a requests library instead. Requests that are normally made by the browser, are thus made by Node. The IP's are changed by routing the requests through the specified proxy servers using ***-proxy-agent's**. When Node gets a response back from the server, it's forwarded to the browser for completion/rendering.

#### Why am I getting _"Request is already handled!"_?

This happens when there is an attempt to handle the same request more than once. An intercepted request is handled by either [HTTPRequest.abort()](https://pptr.dev/api/puppeteer.httprequest.abort), [HTTPRequest.continue()](https://pptr.dev/api/puppeteer.httprequest.continue) or [HTTPRequest.respond()](https://pptr.dev/api/puppeteer.httprequest.respond) methods. Each of these methods 'send' the request to its destination. A request that has already reached its destination cannot be intercepted or handled.


#### Why does the browser show _"Your connection to this site is not secure"_?

Because direct requests from the browser to the server are being intercepted by Node, making the establishment of a secure connection between them impossible. However, the requests aren't made by the browser, they are made by Node. All `https` requests made through Node using this module are secure. This is evidenced by the connection property of the response object:


```
connection: TLSSocket {
    _tlsOptions: {
        secureContext: [SecureContext],
        requestCert: true,
        rejectUnauthorized: true,
    },
    _secureEstablished: true,
    authorized: true,
    encrypted: true,
}
```
The warning can be thought of as a false positive.

## Dependencies
- [Got](https://github.com/sindresorhus/got)
- [http-proxy-agent](https://github.com/TooTallNate/node-http-proxy-agent)
- [https-proxy-agent](https://github.com/TooTallNate/node-https-proxy-agent)
- [socks-proxy-agent](https://github.com/TooTallNate/node-socks-proxy-agent)
- [tough-cookie](https://github.com/salesforce/tough-cookie)
