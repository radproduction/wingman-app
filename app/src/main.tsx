import './pwa/installState'
import ReactDOM from 'react-dom/client'

const root = ReactDOM.createRoot(document.getElementById('root')!)

if (/^\/(foundations|components|introduction|changelog)(\/|$)/.test(window.location.pathname)) {
  void import('./foundations/FoundationsApp').then(({ mountFoundations }) => mountFoundations(root))
} else {
  void import('./appMain').then(({ mountApp }) => mountApp(root))
}
