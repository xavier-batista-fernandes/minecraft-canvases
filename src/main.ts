import './styles/tokens.css';
import './styles/base.css';
import { ChartPage } from './components/pages';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app element');
root.replaceChildren(ChartPage());
