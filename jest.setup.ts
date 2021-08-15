import { inspect } from 'util';

/**
 * Tell jest that we're not in a browser
 * to avoid any kind of Cross-Origin-Requests
 * due to axios using XHR-Requests as default
 * adapter
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.XMLHttpRequest = undefined;

/**
 * Log full error object on errors
 */
inspect.defaultOptions.depth = null;

/**
 * Set the timeout for all jest tests
 * and hooks to one minute
 */
jest.setTimeout(60000);

// Set environment variables
import {
  MOCK_RACETIME_BASE_URL,
  MOCK_SRL_API_BASE_URL,
  MOCK_SRL_BASE_URL,
} from './test/test-environment';

process.env.SRL_BASE_URL = MOCK_SRL_BASE_URL;
process.env.RACETIME_BASE_URL = MOCK_RACETIME_BASE_URL;
process.env.SRL_API_BASE_URL = MOCK_SRL_API_BASE_URL;
