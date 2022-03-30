import i18nPlugin from '~/plugins/i18n';

const localesMock = [
  {
    code: 'default',
    file: 'en.js',
    iso: 'en_US',
    defaultCurrency: 'USD',
  },
  {
    code: 'de_DE',
    file: 'de.js',
    iso: 'de_DE',
    defaultCurrency: 'EUR',
  },
  {
    code: 'nl_NL',
    file: 'en.js',
    iso: 'en_US',
    defaultCurrency: 'EUR',
  },
];

const apiStateMock = {
  getCurrency: () => 'USD',
  getCountry: () => 'PL',
  getCartId: () => '123',
  getCustomerToken: () => '12fg45',
};

const callbackRequest = {
  headers: {},
};

const routeMock = {
  path: 'https://domain/german',
};
const appMock = {
  $cookies: {
    get: jest.fn(),
  },
  i18n: {
    defaultLocale: 'en',
    defaultCurrency: 'EUR',
    setLocale: jest.fn(),
    locales: localesMock,
    locale: 'de_DE',
  },
  $vsf: {
    $magento: {
      client: {
        interceptors: {
          request: {
            use: (callback) => {
              callback(callbackRequest);
            },
          },
        },
      },
      config: {
        state: {
          ...apiStateMock,
          setStore: jest.fn(),
          setLocale: jest.fn(),
          setCurrency: jest.fn(),
        },
        axios: {
          headers: {
            cookie: null,
          },
        },
      },
    },
  },
};

describe('i18n plugin', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Should read vsf-store cookie value', () => {
    i18nPlugin({ app: appMock, route: routeMock });

    expect(appMock.$cookies.get).toHaveBeenCalledWith('vsf-store');
  });

  it('Should find locale based on magento store code', () => {
    appMock.$cookies.get.mockReturnValue('default');
    i18nPlugin({ app: appMock, route: routeMock });

    expect(appMock.i18n.setLocale).not.toHaveBeenCalled();
  });

  it('Should set default locale when there is no locale that match given magento store code', () => {
    appMock.$cookies.get.mockReturnValue('pl_PL');

    expect(appMock.i18n.setLocale).not.toHaveBeenCalledTimes(1);
  });

  it('Should set default locale when vsf-store cookie is not exist', () => {
    appMock.$cookies.get.mockReturnValue(null);
    i18nPlugin({ app: appMock, route: routeMock });

    expect(appMock.i18n.setLocale).toHaveBeenCalledWith('en');
  });

  it('Should change locale if a new selected store has a different locale', () => {
    const testCaseAppMock = {
      ...appMock,
      i18n: {
        ...appMock.i18n,
        locale: 'de_DE',
      },
    };

    testCaseAppMock.$cookies.get.mockReturnValueOnce('de_DE').mockReturnValueOnce('default');

    i18nPlugin({ app: testCaseAppMock, route: routeMock });

    expect(testCaseAppMock.$vsf.$magento.config.state.setLocale).toHaveBeenCalledWith('de_DE');
    expect(testCaseAppMock.$vsf.$magento.config.state.setStore).toHaveBeenCalledWith('de_DE');
    expect(testCaseAppMock.$vsf.$magento.config.state.setCurrency).toHaveBeenCalledWith('EUR');
  });
});
