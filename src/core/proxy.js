const got = require("got");
const CookieHandler = require("../lib/cookies");
const { setHeaders, setAgent } = require("../lib/options");

const getProxiedResponse = async (request, proxy, overrides = {}) => {
    const cookieHandler = new CookieHandler(request);
    // Request options for GOT accounting for overrides
    const options = {
        cookieJar: await cookieHandler.getCookies(),
        method: overrides.method || request.method(),
        body: overrides.postData || request.postData(),
        headers: overrides.headers || setHeaders(request),
        agent: setAgent(proxy),
        responseType: "buffer",
        maxRedirects: 15,
        throwHttpErrors: false,
        ignoreInvalidCookies: true,
        followRedirect: false
    };
    const response = await got(overrides.url || request.url(), options);
    // Set cookies manually because "set-cookie" doesn't set all cookies (?)
    // Perhaps related to https://github.com/puppeteer/puppeteer/issues/5364
    const setCookieHeader = response.headers["set-cookie"];
    if (setCookieHeader) {
        await cookieHandler.setCookies(setCookieHeader);
        response.headers["set-cookie"] = undefined;
    }
    
    return {
        status: response.statusCode,
        headers: response.headers,
        body: response.body
    };
}

module.exports = getProxiedResponse;