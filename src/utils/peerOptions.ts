import type Peer from 'peerjs';

declare global {
  interface Window {
    __PEER_CONFIG__?: Peer.PeerJSOption;
  }
}

export function getPeerOptions(): Peer.PeerJSOption {
  const baseOptions: Peer.PeerJSOption = { debug: 2 };
  if (typeof window !== 'undefined' && window.__PEER_CONFIG__) {
    return { ...baseOptions, ...window.__PEER_CONFIG__ };
  }
  return baseOptions;
}

