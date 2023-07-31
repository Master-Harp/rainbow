import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { Box, Cover } from '@/design-system';
import { globalColors } from '@/design-system/color/palettes';
import { Icon } from '@/components/icons';
import { useTheme } from '@/theme';

type TabBarIconProps = {
  accentColor: string;
  icon: string;
  index: number;
  rawScrollPosition: Animated.SharedValue<number>;
};

export function TabBarIcon({
  accentColor,
  icon,
  index,
  rawScrollPosition,
}: TabBarIconProps) {
  const { colors, isDarkMode } = useTheme();
  const scrollPosition = useDerivedValue(() => {
    return Math.max(rawScrollPosition.value, 1);
  });

  const outlineColor = isDarkMode
    ? globalColors.blueGrey60
    : globalColors.blueGrey70;

  const iconColor = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [outlineColor, accentColor, accentColor, accentColor, outlineColor]
    );

    return {
      backgroundColor,
    };
  });

  const iconShadow = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      scrollPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [0, 0.2, 0.2, 0.2, 0]
    );

    return {
      shadowColor: isDarkMode ? colors.shadowBlack : accentColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity,
      shadowRadius: 3,
    };
  });

  const iconShadowBlack = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      scrollPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [0, 0.02, 0.02, 0.02, 0]
    );

    return {
      shadowColor: colors.shadowBlack,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity,
      shadowRadius: 3,
    };
  });

  const innerFillColor = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [
        isDarkMode ? outlineColor : '#FEFEFE',
        icon === 'tabDiscover'
          ? isDarkMode
            ? '#171819'
            : '#FEFEFE'
          : accentColor,
        icon === 'tabDiscover'
          ? isDarkMode
            ? '#171819'
            : '#FEFEFE'
          : accentColor,
        icon === 'tabDiscover'
          ? isDarkMode
            ? '#171819'
            : '#FEFEFE'
          : accentColor,
        isDarkMode ? outlineColor : '#FEFEFE',
      ]
    );
    const opacity = interpolate(
      scrollPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [0, 1, 1, 1, 0]
    );

    return {
      backgroundColor,
      opacity,
    };
  });

  const discoverTabInnerFillColor = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [accentColor, accentColor, accentColor, accentColor, accentColor]
    );
    const opacity = interpolate(
      scrollPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [0, 0.25, 0.25, 0.25, 0]
    );

    return {
      backgroundColor,
      opacity,
    };
  });

  const innerIconColor = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [
        outlineColor,
        isDarkMode ? '#171819' : '#FEFEFE',
        isDarkMode ? '#171819' : '#FEFEFE',
        isDarkMode ? '#171819' : '#FEFEFE',
        outlineColor,
      ]
    );
    // const opacity = interpolate(
    //   scrollPosition.value,
    //   [index - 1, index, index + 1],
    //   [0, 1, 0]
    // );
    // const scale = interpolate(
    //   scrollPosition.value,
    //   [index - 1, index, index + 1],
    //   [0.25, 1, 0.25]
    // );

    return {
      backgroundColor,
      // opacity,
      // transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={iconShadowBlack}>
      <Animated.View style={iconShadow}>
        <Box height={{ custom: 28 }} width={{ custom: 28 }}>
          <Cover alignHorizontal="center" alignVertical="center">
            <MaskedView maskElement={<Icon name={icon + 'InnerFill'} />}>
              <Box
                as={Animated.View}
                height={{ custom: 28 }}
                style={innerFillColor}
                width={{ custom: 28 }}
              >
                {icon === 'tabDiscover' && (
                  <Box
                    as={Animated.View}
                    height="full"
                    style={discoverTabInnerFillColor}
                    width="full"
                  />
                )}
              </Box>
            </MaskedView>
          </Cover>
          <Cover alignHorizontal="center" alignVertical="center">
            <MaskedView maskElement={<Icon name={icon} />}>
              <Box
                as={Animated.View}
                height={{ custom: 28 }}
                style={iconColor}
                width={{ custom: 28 }}
              />
            </MaskedView>
          </Cover>
          {icon !== 'tabDiscover' && (
            <Cover alignHorizontal="center" alignVertical="center">
              <MaskedView maskElement={<Icon name={icon + 'Inner'} />}>
                <Box
                  as={Animated.View}
                  height={{ custom: 28 }}
                  style={innerIconColor}
                  width={{ custom: 28 }}
                >
                  <Box
                    as={Animated.View}
                    height="full"
                    style={[iconColor, { opacity: 0.25 }]}
                    width="full"
                  />
                </Box>
              </MaskedView>
            </Cover>
          )}
        </Box>
      </Animated.View>
    </Animated.View>
  );
}
