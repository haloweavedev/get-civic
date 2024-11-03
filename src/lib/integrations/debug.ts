import { logger } from './utils';

export const debugLog = (context: string, data: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('\n=== DEBUG:', context, '===');
    console.log(JSON.stringify(data, null, 2));
    console.log('================\n');
  }
};