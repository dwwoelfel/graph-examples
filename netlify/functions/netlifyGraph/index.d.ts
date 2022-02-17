// GENERATED VIA NETLIFY AUTOMATED DEV TOOLS, EDIT WITH CAUTION!

export type NetlifyGraphFunctionOptions = {
  /**
   * The accessToken to use for the request
   */
  accessToken?: string;
  /**
   * The siteId to use for the request
   * @default process.env.SITE_ID
   */
  siteId?: string;
};

export type WebhookEvent = {
  body: string;
  headers: Record<string, string | null | undefined>;
};

export type GraphQLError = {
  path: Array<string | number>;
  message: string;
  extensions: Record<string, unknown>;
};

export type ServiceInfo = {
  /**
   * Any data from the function will be returned here
   */
  data: {
    oneGraph: {
      serverInfo: {
        buildNumber: number;
        sha: string;
      };
      services: Array<{
        service:
          | "ADROLL"
          | "ASANA"
          | "BOX"
          | "CONTENTFUL"
          | "DEV_TO"
          | "DOCUSIGN"
          | "DRIBBBLE"
          | "DROPBOX"
          | "EGGHEADIO"
          | "EVENTIL"
          | "FACEBOOK"
          | "FIREBASE"
          | "GITHUB"
          | "GMAIL"
          | "GONG"
          | "GOOGLE"
          | "GOOGLE_ADS"
          | "GOOGLE_ANALYTICS"
          | "GOOGLE_CALENDAR"
          | "GOOGLE_COMPUTE"
          | "GOOGLE_DOCS"
          | "GOOGLE_SEARCH_CONSOLE"
          | "GOOGLE_TRANSLATE"
          | "HUBSPOT"
          | "INTERCOM"
          | "MAILCHIMP"
          | "MEETUP"
          | "NETLIFY"
          | "NOTION"
          | "OUTREACH"
          | "PRODUCT_HUNT"
          | "QUICKBOOKS"
          | "SALESFORCE"
          | "SANITY"
          | "SLACK"
          | "SPOTIFY"
          | "STRIPE"
          | "TRELLO"
          | "TWILIO"
          | "TWITTER"
          | "TWITCH_TV"
          | "YNAB"
          | "YOUTUBE"
          | "ZEIT"
          | "ZENDESK"
          | "AIRTABLE"
          | "APOLLO"
          | "BREX"
          | "BUNDLEPHOBIA"
          | "CHARGEBEE"
          | "CLEARBIT"
          | "CLOUDFLARE"
          | "CRUNCHBASE"
          | "DESCURI"
          | "FEDEX"
          | "GOOGLE_MAPS"
          | "GRAPHCMS"
          | "IMMIGRATION_GRAPH"
          | "LOGDNA"
          | "MIXPANEL"
          | "MUX"
          | "NPM"
          | "ONEGRAPH"
          | "ORBIT"
          | "OPEN_COLLECTIVE"
          | "RSS"
          | "UPS"
          | "USPS"
          | "WORDPRESS";
        /**
         * Service string that can be provided in the URL when going through the oauth flow.
         */
        slug: string;
        friendlyServiceName: string;
        /**
         * The prefix that all GraphQL types addded by this service will have, e.g. `GitHub`.
         */
        typePrefix: string;
      }>;
    };
  };
  /**
   * Any errors from the function will be returned here
   */
  errors: Array<GraphQLError>;
};

/**
 * An example query to start with.
 */
export function fetchServiceInfo(
  /**
   * Pass `{}` as no variables are defined for this function.
   */
  variables: Record<string, never>,
  options?: NetlifyGraphFunctionOptions
): Promise<ServiceInfo>;
