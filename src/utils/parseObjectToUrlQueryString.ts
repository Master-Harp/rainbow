import keys from 'lodash/keys';

export default (params: any) =>
  keys(params)
    .map(key => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(params[key]);
      return `${encodedKey}=${encodedValue}`;
    })
    .join('&');
