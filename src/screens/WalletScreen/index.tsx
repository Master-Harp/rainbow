import { useRoute } from '@react-navigation/core';
import lang from 'i18n-js';
import { InteractionManager, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { isEmpty, keys } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { OpacityToggler } from '../../components/animations';
import { AssetList } from '../../components/asset-list';
import { Page } from '../../components/layout';
import { Network } from '@/helpers';
import { useRemoveFirst } from '@/navigation/useRemoveFirst';
import { settingsUpdateNetwork } from '@/redux/settings';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { prefetchENSIntroData } from '@/handlers/ens';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Box } from '@/design-system';
import {
  useAccountAccentColor,
  useAccountEmptyState,
  useAccountProfile,
  useAccountSettings,
  useCoinListEdited,
  useInitializeAccountData,
  useInitializeWallet,
  useLoadAccountData,
  useLoadAccountLateData,
  useLoadGlobalLateData,
  usePortfolios,
  useResetAccountState,
  useTrackENSProfile,
  useUserAccounts,
  useWalletConnectConnections,
  useWalletSectionsData,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import { updateRefetchSavings } from '@/redux/data';
import { emitPortfolioRequest } from '@/redux/explorer';
import Routes from '@rainbow-me/routes';
import { position } from '@/styles';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { maybeSignUri } from '@/handlers/imgix';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { analytics } from '@/analytics';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { AppState } from '@/redux/store';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { usePositions } from '@/resources/defi/PositionsQuery';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';

type RouteParams = {
  WalletScreen: {
    initialized?: boolean;
    emptyWallet?: boolean;
  };
};

const HeaderOpacityToggler = styled(OpacityToggler).attrs(
  ({ isVisible }: { isVisible: boolean }) => ({
    endingOpacity: 0.4,
    pointerEvents: isVisible ? 'none' : 'box-none',
  })
)({
  elevation: 1,
  zIndex: 1,
});

const WalletPage = styled(Page)({
  ...position.sizeAsObject('100%'),
  flex: 1,
});

function MoreButton({ children, onPress }) {
  // ////////////////////////////////////////////////////
  // Handlers

  const [isToastActive, setToastActive] = useRecoilState(
    addressCopiedToastAtom
  );
  const { accountAddress } = useAccountProfile();
  const { navigate } = useNavigation();

  const handlePressCopy = React.useCallback(() => {
    if (!isToastActive) {
      setToastActive(true);
      setTimeout(() => {
        setToastActive(false);
      }, 2000);
    }
    Clipboard.setString(accountAddress);
  }, [accountAddress, isToastActive, setToastActive]);

  const handlePressQRCode = React.useCallback(() => {
    analytics.track('Tapped "My QR Code"', {
      category: 'home screen',
    });

    navigate(Routes.RECEIVE_MODAL);
  }, [navigate]);

  const handlePressConnectedApps = React.useCallback(() => {
    navigate(Routes.CONNECTED_DAPPS);
  }, [navigate]);

  // ////////////////////////////////////////////////////
  // Context Menu
  const { mostRecentWalletConnectors } = useWalletConnectConnections();

  const menuConfig = React.useMemo(
    () => ({
      menuItems: [
        {
          actionKey: 'copy',
          actionTitle: lang.t('wallet.copy_address'),
          icon: { iconType: 'SYSTEM', iconValue: 'doc.on.doc' },
        },
        {
          actionKey: 'qrCode',
          actionTitle: lang.t('button.my_qr_code'),
          icon: { iconType: 'SYSTEM', iconValue: 'qrcode' },
        },
        mostRecentWalletConnectors.length > 0
          ? {
              actionKey: 'connectedApps',
              actionTitle: lang.t('wallet.connected_apps'),
              icon: { iconType: 'SYSTEM', iconValue: 'app.badge.checkmark' },
            }
          : null,
      ].filter(Boolean),
      ...(ios ? { menuTitle: '' } : {}),
    }),
    [mostRecentWalletConnectors.length]
  );

  const handlePressMenuItem = React.useCallback(
    e => {
      if (e.nativeEvent.actionKey === 'copy') {
        handlePressCopy();
      }
      if (e.nativeEvent.actionKey === 'qrCode') {
        handlePressQRCode();
      }
      if (e.nativeEvent.actionKey === 'connectedApps') {
        handlePressConnectedApps();
      }
    },
    [handlePressConnectedApps, handlePressCopy, handlePressQRCode]
  );

  return (
    <ContextMenuButton
      menuConfig={menuConfig}
      onPressMenuItem={handlePressMenuItem}
    >
      <ButtonPressAnimation onPress={onPress}>{children}</ButtonPressAnimation>
    </ContextMenuButton>
  );
}

const WalletScreen: React.FC<any> = ({ navigation, route }) => {
  const { params } = route;
  const { setParams, dangerouslyGetState, dangerouslyGetParent } = navigation;
  const removeFirst = useRemoveFirst();
  const [initialized, setInitialized] = useState(!!params?.initialized);
  const [portfoliosFetched, setPortfoliosFetched] = useState(false);
  const initializeWallet = useInitializeWallet();
  const { isCoinListEdited } = useCoinListEdited();
  const { trackENSProfile } = useTrackENSProfile();
  const {
    network: currentNetwork,
    accountAddress,
    appIcon,
    nativeCurrency,
  } = useAccountSettings();
  const { userAccounts } = useUserAccounts();
  usePositions({ address: accountAddress, currency: nativeCurrency });
  const { portfolios, trackPortfolios } = usePortfolios();
  const loadAccountLateData = useLoadAccountLateData();
  const loadGlobalLateData = useLoadGlobalLateData();
  const dispatch = useDispatch();
  const resetAccountState = useResetAccountState();
  const loadAccountData = useLoadAccountData();
  const initializeAccountData = useInitializeAccountData();
  const insets = useSafeAreaInsets();

  const revertToMainnet = useCallback(async () => {
    await resetAccountState();
    await dispatch(settingsUpdateNetwork(Network.mainnet));
    InteractionManager.runAfterInteractions(async () => {
      await loadAccountData(Network.mainnet);
      initializeAccountData();
    });
  }, [dispatch, initializeAccountData, loadAccountData, resetAccountState]);

  useEffect(() => {
    const supportedNetworks = [Network.mainnet, Network.goerli];
    if (!supportedNetworks.includes(currentNetwork)) {
      revertToMainnet();
    }
  }, [currentNetwork, revertToMainnet]);

  const walletReady = useSelector(
    ({ appState: { walletReady } }: AppState) => walletReady
  );
  const {
    isWalletEthZero,
    refetchSavings,
    shouldRefetchSavings,
    isEmpty: isSectionsEmpty,
    briefSectionsData: walletBriefSectionsData,
  } = useWalletSectionsData();

  useEffect(() => {
    // This is the fix for Android wallet creation problem.
    // We need to remove the welcome screen from the stack.
    if (ios) {
      return;
    }
    const isWelcomeScreen =
      dangerouslyGetParent()?.dangerouslyGetState().routes[0].name ===
      Routes.WELCOME_SCREEN;
    if (isWelcomeScreen) {
      removeFirst();
    }
  }, [dangerouslyGetParent, dangerouslyGetState, removeFirst]);

  const { isEmpty: isAccountEmpty } = useAccountEmptyState(isSectionsEmpty);

  const { addressSocket, assetsSocket } = useSelector(
    ({ explorer: { addressSocket, assetsSocket } }: AppState) => ({
      addressSocket,
      assetsSocket,
    })
  );

  const profilesEnabled = useExperimentalFlag(PROFILES);

  useEffect(() => {
    const fetchAndResetFetchSavings = async () => {
      await refetchSavings();
      dispatch(updateRefetchSavings(false));
    };
    if (shouldRefetchSavings) {
      fetchAndResetFetchSavings();
    }
  }, [dispatch, refetchSavings, shouldRefetchSavings]);

  useEffect(() => {
    const initializeAndSetParams = async () => {
      // @ts-expect-error messed up initializeWallet types
      await initializeWallet(null, null, null, !params?.emptyWallet);
      setInitialized(true);
      setParams({ emptyWallet: false });
    };

    if (!initialized || (params?.emptyWallet && initialized)) {
      // We run the migrations only once on app launch
      initializeAndSetParams();
    }
  }, [initializeWallet, initialized, params, setParams]);

  useEffect(() => {
    if (initialized && addressSocket && !portfoliosFetched) {
      setPortfoliosFetched(true);
      const fetchPortfolios = async () => {
        for (let i = 0; i < userAccounts.length; i++) {
          const account = userAccounts[i];
          // Passing usd for consistency in tracking
          dispatch(emitPortfolioRequest(account.address.toLowerCase(), 'usd'));
        }
      };
      fetchPortfolios();
    }
  }, [
    addressSocket,
    dispatch,
    initialized,
    portfolios,
    portfoliosFetched,
    userAccounts,
  ]);

  useEffect(() => {
    if (
      !isEmpty(portfolios) &&
      portfoliosFetched &&
      keys(portfolios).length === userAccounts.length
    ) {
      trackPortfolios();
    }
  }, [portfolios, portfoliosFetched, trackPortfolios, userAccounts.length]);

  useEffect(() => {
    if (walletReady && assetsSocket) {
      loadAccountLateData();
      loadGlobalLateData();
    }
  }, [assetsSocket, loadAccountLateData, loadGlobalLateData, walletReady]);

  useEffect(() => {
    if (walletReady && profilesEnabled) {
      InteractionManager.runAfterInteractions(() => {
        // We are not prefetching intro profiles data on Android
        // as the RPC call queue is considerably slower.
        if (ios) {
          prefetchENSIntroData();
        }
        trackENSProfile();
      });
    }
  }, [profilesEnabled, trackENSProfile, walletReady]);

  // track current app icon
  useEffect(() => {
    analytics.identify(undefined, { appIcon });
  }, [appIcon]);

  const { navigate } = useNavigation();

  const handlePressActivity = useCallback(() => {
    navigate(Routes.PROFILE_SCREEN);
  }, [navigate]);

  const handlePressDiscover = useCallback(() => {
    navigate(Routes.DISCOVER_SCREEN);
  }, [navigate]);

  const isAddressCopiedToastActive = useRecoilValue(addressCopiedToastAtom);

  const isLoadingAssets =
    useSelector((state: AppState) => state.data.isLoadingAssets) &&
    !!accountAddress;

  const { accentColor } = useAccountAccentColor();

  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.trueBlack,
        height: '100%',
        width: '100%',
      }}
    >
      <WalletPage testID="wallet-screen">
        <Box
          style={{ flex: 1, marginTop: ios ? -(navbarHeight + insets.top) : 0 }}
        >
          <AssetList
            accentColor={accentColor}
            disableRefreshControl={isLoadingAssets}
            isEmpty={isAccountEmpty || !!params?.emptyWallet}
            isLoading={android && isLoadingAssets}
            isWalletEthZero={isWalletEthZero}
            network={currentNetwork}
            walletBriefSectionsData={walletBriefSectionsData}
          />
        </Box>
        <ToastPositionContainer>
          <Toast
            isVisible={isAddressCopiedToastActive}
            text="􀁣 Address Copied"
            testID="address-copied-toast"
          />
        </ToastPositionContainer>
      </WalletPage>
    </View>
  );
};

export default WalletScreen;
