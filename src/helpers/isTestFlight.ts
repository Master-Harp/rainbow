import { IS_IOS } from '@/env';
import { NativeModules } from 'react-native';

const { RNTestFlight } = NativeModules;
const isTestFlight = IS_IOS
  ? (RNTestFlight.getConstants().isTestFlight as boolean)
  : false;

export default isTestFlight;
