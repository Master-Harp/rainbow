import lang from 'i18n-js';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { darkModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Centered, RowWithMargins } from '../layout';
import { Text } from '../text';
import PriceImpactWarning from './PriceImpactWarning';
import styled from '@/styled-thing';
import { padding } from '@/styles';

const springConfig = {
  damping: 14,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 121.5,
};

const Container = styled(RowWithMargins).attrs({
  centered: true,
  margin: 5,
})({
  ...padding.object(android ? 6 : 10, 10, 2),
  width: '100%',
});

export default function DepositInfo({
  amount,
  asset,
  isHighPriceImpact,
  onPress,
  priceImpactColor,
  priceImpactNativeAmount,
  priceImpactPercentDisplay,
}) {
  const { colors } = useTheme();
  const isVisible = !!(asset && amount);

  const prevAmountRef = useRef();
  useEffect(() => {
    // Need to remember the amount so
    // it doesn't show NULL while fading out!
    if (amount !== null) {
      prevAmountRef.current = amount;
    }
  });

  const prevAmount = prevAmountRef.current;
  const amountToDisplay = amount === null ? prevAmount : amount;

  const animation = useSharedValue(isVisible ? 1 : 0);
  const heightAnimation = useSharedValue(isVisible ? 1 : 0);

  useLayoutEffect(() => {
    const toValue = isVisible ? 1 : 0;
    animation.value = withSpring(toValue, springConfig);
    heightAnimation.value = withTiming(toValue, {
      duration: 100,
    });
  }, [isVisible, animation, heightAnimation]);

  const priceImpactAnimation = useSharedValue(isHighPriceImpact ? 1 : 0);
  const priceImpactHeightAnimation = useSharedValue(isHighPriceImpact ? 1 : 0);

  useLayoutEffect(() => {
    const toValue = isHighPriceImpact ? 1 : 0;
    priceImpactAnimation.value = withSpring(toValue, springConfig);
    priceImpactHeightAnimation.value = withTiming(toValue, {
      duration: 100,
    });
  }, [isHighPriceImpact, priceImpactHeightAnimation, priceImpactAnimation]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const height = interpolate(heightAnimation.value, [0, 1], [20, 35]);
    const scale = interpolate(animation.value, [0, 1], [0.8, 1]);
    const translateY = interpolate(animation.value, [0, 1], [1, 0]);
    return {
      height,
      opacity: animation.value,
      transform: [{ scale }, { translateY }],
    };
  });

  const priceImpactAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      priceImpactHeightAnimation.value,
      [0, 1],
      [0, 60]
    );
    return { height, opacity: priceImpactAnimation.value };
  });

  return (
    <Animated.View>
      <Animated.View style={animatedContainerStyle} testID="deposit-info">
        <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
          <Container>
            <CoinIcon
              address={asset?.address}
              size={20}
              symbol={asset?.symbol}
              testID="deposit-info-container"
            />
            <Centered>
              <Text
                color={colors.alpha(darkModeThemeColors.blueGreyDark, 0.6)}
                size="smedium"
                weight="semibold"
              >
                {lang.t('exchange.swapping_for_prefix')}{' '}
              </Text>
              <Text color="whiteLabel" size="smedium" weight="bold">
                {`${amountToDisplay} ${asset?.symbol || ''}`}
              </Text>
            </Centered>
          </Container>
        </ButtonPressAnimation>
      </Animated.View>
      <Animated.View style={priceImpactAnimatedStyle}>
        <PriceImpactWarning
          isHighPriceImpact={isHighPriceImpact}
          onPress={onPress}
          pointerEvents={isHighPriceImpact ? 'auto' : 'none'}
          priceImpactColor={priceImpactColor}
          priceImpactNativeAmount={priceImpactNativeAmount}
          priceImpactPercentDisplay={priceImpactPercentDisplay}
        />
      </Animated.View>
    </Animated.View>
  );
}
