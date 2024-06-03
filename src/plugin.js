'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin');
const getProxiedResponse = require('./core/proxy');

class PuppeteerPageProxyPlugin extends PuppeteerExtraPlugin {
    constructor(proxyUrl, opts = {}) {
        super(typeof proxyUrl === 'string' ? { ...opts, proxyUrl } : { ...proxyUrl });

        this.proxyCfgMap = new WeakMap();
        this.reqHdlRegSet = new WeakSet();
    }

    /**
     * @override
     */
    get name() {
        return 'page-proxy';
    }

    /**
     * @override
     */
    get defaults() {
        return {
            proxyUrl: undefined,
            interceptResolutionPriority: undefined,
            onlyNavigation: undefined,
        };
    }

    /**
     * Get global proxy url.
     *
     * @type {string} - The global proxy url.
     */
    get proxyUrl() {
        return this.opts.proxyUrl;
    }

    /**
     * Get global onlyNavigation flag.
     *
     * @type {boolean} - Whether to only proxy navigation requests.
     */
    get onlyNavigation() {
        return this.opts.onlyNavigation;
    }

    /**
     * Get the global request interception resolution priority.
     *
     * Priority for Cooperative Intercept Mode can be configured either through `opts` or by modifying this property.
     *
     * @type {number} - A number for the request interception resolution priority.
     */
    get interceptResolutionPriority() {
        return this.opts.interceptResolutionPriority;
    }

    /**
     * @private
     */
    async onRequest(page, request) {
        // Requests are immediately handled if not using Cooperative Intercept Mode
        const alreadyHandled = request.isInterceptResolutionHandled
            ? request.isInterceptResolutionHandled()
            : true;

        this.debug('onRequest', { alreadyHandled });

        if (alreadyHandled) {
            return;
        }

        const {
            proxy: localProxyUrl,
            onlyNavigation: localOnlyNavigation,
            interceptResolutionPriority: localInterceptResolutionPriority
        } = this.proxyCfgMap.get(page);

        const interceptResolutionPriority = localInterceptResolutionPriority ?? this.interceptResolutionPriority;
        const onlyNavigation = localOnlyNavigation ?? this.onlyNavigation;

        do {
            if (!localProxyUrl && localProxyUrl !== undefined) {
                break;
            }

            const proxyUrl = localProxyUrl || this.proxyUrl;
            if (!proxyUrl) {
                break;
            }
            if (onlyNavigation && !request.isNavigationRequest()) {
                break;
            }
            const requestUrl = request.url();
            if (!requestUrl.startsWith("http:") && !requestUrl.startsWith("https:")) {
                break;
            }

            try {
                const respondWith = await getProxiedResponse(request, proxyUrl);

                return request.respond(respondWith, interceptResolutionPriority);
            } catch (err) {
                this.debug('onProxyError', { error: err, proxy: localProxyUrl });
                return request.abort('failed', interceptResolutionPriority);
            }

        } while (false)

        const continueArgs = request.continueRequestOverrides
            ? [request.continueRequestOverrides(), interceptResolutionPriority]
            : [];

        return request.continue(...continueArgs);
    }

    /**
     * @private
     * @override
     */
    async onPageCreated(page) {
        this.debug('onPageCreated', { proxy: this.proxyUrl });

        page.useProxy = (proxyUrl, opts = {}) => {
            if (typeof proxyUrl === 'object' && proxyUrl !== null) {
                this.proxyCfgMap.set(page, {
                    ...proxyUrl,
                    proxyUrl: undefined
                });
            } else {
                this.proxyCfgMap.set(page, {
                    // ...this.proxyCfgMap.get(page),
                    ...opts,
                    proxy: proxyUrl,
                });
            }
            if (!this.reqHdlRegSet.has(page)) {
                page.on('request', this.onRequest.bind(this, page));
                this.reqHdlRegSet.add(page);
            }
            return page.setRequestInterception(true);
        };

        await page.useProxy();
    }
}

module.exports = function (arg1, arg2) {
    return new PuppeteerPageProxyPlugin(arg1, arg2);
}
module.exports.getProxiedResponse = getProxiedResponse;
module.exports.PuppeteerPageProxyPlugin = PuppeteerPageProxyPlugin;