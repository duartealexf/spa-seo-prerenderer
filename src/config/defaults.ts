/**
 * Correct values for snapshots driver environment config.
 */
export type SnapshotsDriver = 'fs' | 's3';

/**
 * NodeJS environment config.
 */
export type NodeEnvironment = 'development' | 'production' | string | undefined;

/**
 * Interface for needed values as in process.env.
 */
export interface PrerendererConfigParams {
  [key: string]: number | string | string[] | RegExp[] | undefined;

  /**
   * NodeJS environment.
   * @default 'production'
   */
  nodeEnv?: NodeEnvironment;

  /**
   * Chosen snapshots driver.
   * @default 'fs'
   */
  snapshotsDriver: SnapshotsDriver;

  /**
   * Directory to store snapshots in.
   * @default '../snapshots'
   */
  snapshotsDirectory: string;

  /**
   * Prerenderer log file location. Not specifying any will make it not log to a file.
   * @default ''
   */
  prerendererLogFile?: string;

  /**
   * Chromium executable.
   * @default '''
   */
  chromiumExecutable: string;

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
   * Case insensitive list with URL parts that Puppeteer will exclusively allow the rendering
   * page to make requests to. Defaults to an empty array. If any URL part is added to this
   * list, Puppeteer will only consider this whitelist and ignore blacklistedRequestURLs.
   * @default []
   */
  whitelistedRequestURLs?: string[];

  /**
   * Case insensitive list with URL parts that Puppeteer will disallow the rendering page to
   * make requests to. Useful for disallowing the prerendered page to make network requests
   * to, e.g. services like Google Analytics, GTM, chat services, Facebook, Hubspot, etc.
   * @default DEFAULT_BLACKLISTED_REQUEST_URLS
   */
  blacklistedRequestURLs?: string[];
}

export const DEFAULT_BOT_USER_AGENTS = [
  'googlebot',
  'google page speed',
  'chrome-lighthouse',
  'developers.google.com/+/web/snippet',
  'facebookexternalhit',
  'bingbot',
  'linkedinbot',
  'pinterest',
  'pinterestbot',
  'semrushbot',
  'twitterbot',
  'whatsapp',
  'slackbot',
  'w3c_validator',
  'applebot',
  'baiduspider',
  'bitlybot',
  'bitrix link preview',
  'discordbot',
  'embedly',
  'flipboard',
  'nuzzel',
  'outbrain',
  'pinterest/0.',
  'quora link preview',
  'qwantify',
  'redditbot',
  'rogerbot',
  'showyoubot',
  'skypeuripreview',
  'tumblr',
  'vkshare',
  'x-bufferbot',
  'xing-contenttabreceiver',
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
