import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin';
import { Response as GotResponse, Options as GotOptions } from 'got';
import { HTTPRequest } from 'puppeteer';

declare module 'puppeteer' {
	interface Page {
		useProxy: (proxyUrl: string | null | undefined, opts?: pageProxy.PuppeteerPageProxyOptions) => Promise<void>;
		useProxy: (opts: pageProxy.PuppeteerPageProxyOptions) => Promise<void>;
	}
}
declare module 'puppeteer-core' {
	interface Page {
		useProxy: (proxyUrl: string | null | undefined, opts?: pageProxy.PuppeteerPageProxyOptions) => Promise<void>;
		useProxy: (opts: pageProxy.PuppeteerPageProxyOptions) => Promise<void>;
	}
}
declare module 'playwright-core' {
	interface Page {
		useProxy: (proxyUrl: string | null | undefined, opts?: pageProxy.PuppeteerPageProxyOptions) => Promise<void>;
		useProxy: (opts: pageProxy.PuppeteerPageProxyOptions) => Promise<void>;
	}
}
declare namespace pageProxy {
	export interface PuppeteerPageProxyOptions {
		onlyNavigation?: boolean;
		interceptResolutionPriority?: number;
	}

	export function getProxiedResponse(request: HTTPRequest, proxy: string, overrides?: {
		url?: GotOptions['url'];
		method?: GotOptions['method'];
		postData?: GotOptions['body'];
		headers?: GotOptions['headers'];
	}): Promise<{
		status: GotResponse['statusCode'];
		headers: GotResponse['headers'];
		body: GotResponse['body'];
	}>;

	export class PuppeteerPageProxyPlugin extends PuppeteerExtraPlugin {
		constructor(proxyUrl?: string, opts?: Partial<PuppeteerPageProxyOptions>);
		get name(): string;
		get defaults(): PuppeteerPageProxyOptions & { proxyUrl?: string; };
		get proxyUrl(): boolean | undefined;
		get onlyNavigation(): boolean | undefined;
		get interceptResolutionPriority(): number | undefined;
	}

}

declare function pageProxy(opts?: Partial<pageProxy.PuppeteerPageProxyOptions>): pageProxy.PuppeteerPageProxyPlugin;
declare function pageProxy(proxyUrl?: string, opts?: Partial<pageProxy.PuppeteerPageProxyOptions>): pageProxy.PuppeteerPageProxyPlugin;

export = pageProxy;
