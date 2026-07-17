import 'react-native-gesture-handler';
import { install } from 'react-native-quick-crypto';
install();
import { registerRootComponent } from 'expo';
import App from './src/app/App';
registerRootComponent(App);
