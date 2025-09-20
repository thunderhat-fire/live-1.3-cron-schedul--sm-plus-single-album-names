let ReactPixel: any;

if (typeof window !== 'undefined') {
  import('react-facebook-pixel').then((x) => {
    ReactPixel = x.default;
  });
}

const options = {
  autoConfig: true,
  debug: process.env.NODE_ENV !== 'production',
};

export const initializePixel = (pixelId: string) => {
  if (typeof window !== 'undefined' && ReactPixel) {
    ReactPixel.init(pixelId, undefined, options);
  }
};

export const trackPageView = () => {
  if (typeof window !== 'undefined' && ReactPixel) {
    ReactPixel.pageView();
  }
};

export const trackEvent = (eventName: string, data?: object) => {
  if (typeof window !== 'undefined' && ReactPixel) {
    ReactPixel.track(eventName, data);
  }
};

export const trackCustom = (eventName: string, data?: object) => {
  if (typeof window !== 'undefined' && ReactPixel) {
    ReactPixel.trackCustom(eventName, data);
  }
}; 