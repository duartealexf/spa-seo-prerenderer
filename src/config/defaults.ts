import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';

/**
 * NodeJS environment config.
 */
export type NodeEnvironment = 'development' | 'production' | string | undefined;

/**
 * Database connection options.
 */
export type DatabaseOptions = Partial<MongoConnectionOptions>;

/**
 * Interface for options passed in prerenderer service constructor.
 */
export interface PrerendererConfig {
  /**
   * NodeJS environment.
   * @default 'production'
   */
  nodeEnv?: NodeEnvironment;

  /**
   * Database connection options.
   */
  databaseOptions: DatabaseOptions;

  /**
   * Prerenderer log file location. Not specifying any will make it not log to any file.
   * @default ''
   */
  prerendererLogFile?: string;

  /**
   * Chromium executable. By default will use the one installed with Puppeteer,
   * which is the best option. Only set this is you know what you are doing.
   * @default ''
   */
  chromiumExecutable?: string;

  /**
   * Array of path RegExps that, when matched
   * to request path, will activate Prerenderer.
   * @default [new RegExp('.*')]
   */
  prerenderablePathRegExps?: RegExp[];

  /**
   * Case insensitive list of extensions that, when matched
   * to request path, will activate Prerenderer.
   * @default DEFAULT_PRERENDERABLE_EXTENSIONS
   */
  prerenderableExtensions?: string[];

  /**
   * Case insensitive list of user agents that, when matched
   * to request user agent, will activate Prerenderer.
   * @default DEFAULT_BOT_USER_AGENTS
   */
  botUserAgents?: string[];

  /**
   * Puppeteer's timeout (in ms).
   * @default 10000
   */
  timeout?: number;

  /**
   * Case insensitive list with parts of URL that Puppeteer will allow the prerendered page to
   * make network requests to (e.g. resources). Defaults to an empty array. It makes sense to
   * use the this when setting the blacklist to all URLs, and specify which specific URLs to
   * allow. Only do this if you are sure which URLs your pages make requests to.
   * @default []
   */
  whitelistedRequestURLs?: string[];

  /**
   * Case insensitive list with URL parts that Puppeteer will disallow the rendering page to make
   * requests to. Useful for disallowing the prerendered page to make network requests to, services
   * like Google Analytics, GTM, chat services, Facebook, etc. Useful when used along with the
   * whitelist, but only do this if you are sure which URLs your pages make requests to – in this
   * case, you can ignore all URLs by setting blacklist to `['.']`.
   * @default DEFAULT_BLACKLISTED_REQUEST_URLS
   */
  blacklistedRequestURLs?: string[];
}

export const DEFAULT_BOT_USER_AGENTS = [
  'googlebot',
  'google page speed',
  'chrome-lighthouse',
  'developers.google.com',
  'xml-sitemaps',
  'google-structureddatatestingtool',
  'facebookexternalhit',
  'bingbot',
  'linkedinbot',
  'pinterest',
  'semrushbot',
  'twitterbot',
  'whatsapp',
  'slackbot',
  'w3c_validator',
  'applebot',
  'baiduspider',
  'bitlybot',
  'discordbot',
  'embedly',
  'flipboard',
  'nuzzel',
  'outbrain',
  'quora link preview',
  'qwantify',
  'redditbot',
  'rogerbot',
  'showyoubot',
  'skypeuripreview',
  'tumblr',
  'vkshare',
  'yahoo! slurp',
  'yandex',
];

/**
 * Some of this from https://www.thirdpartyweb.today
 */
export const DEFAULT_BLACKLISTED_REQUEST_URLS = [
  'doubleclick.net', // Google
  'adservice.google', // Google
  '.googleadservices.', // Google
  'google-analytics', // Google
  'google.com/pagead', // Google
  'ga.js', // Google
  'gtm.js', // Google
  '.googleapis.', // Google
  'connect.facebook.net', // Facebook
  '.facebook.com/tr', // Facebook
  '.addthis.com', // Twitter
  'static.ads-twitter.', // Twitter
  '/scevent.', // Snapchat
  '.zdassets.', // ZenDesk
  'assets.zendesk.com', // ZenDesk
  '.collect.igodigital.', // Salesforce

  '/collect.js', // common tracking pattern
  '/analytics.js', // common tracking pattern
  '/tracking.js', // common tracking pattern
  '/collect.min.js', // common tracking pattern
  '/analytics.min.js', // common tracking pattern
  '/tracking.min.js', // common tracking pattern

  '.tawk.to', // Tawk
  '.zopim.', // Zopim
  '.yandex.', // Yandex
  '.luckyorange.', // Lucky Orange
  '.criteo.', // Criteo
  '.hotjar.', // Hotjar
  '.onesignal.', // OneSignal
  '.tiqcdn.', // Tealium
  '.intercom.com', // Intercom
  '.lunametrics.', // Bounteous
  '.calltrackingmetrics.', // Call Tracking Metrics

  // Less common and low impact ones.
  // '.bounteous.', // Bounteous
  // 'callsumo.com', // Sumo
  // 'sumo.com', // Sumo
  // 'media.net', // Media.net
  // '.pubmine.', // Pubmine
  // '.moatads.', // Moat Ads
  // '.histats.', // Histats
  // '.exoclick.', // Exoclick
  // '.pubmatic.', // Pubmatic
  // '.linksynergy.', // Linksynergy
  // '.scorecardresearch.', // Score Card Research
  // '.gemius.', // Gemius
  // '.outbrain.', // Outbrain
];

export const DEFAULT_PRERENDERABLE_EXTENSIONS = ['', 'html', 'php'];
