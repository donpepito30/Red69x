import Hls from 'hls.js';

type Listener = (activeId: string | null) => void;

class HlsSingleton {
  private static instance: HlsSingleton;
  private hls: Hls | null = null;
  private currentVideoElement: HTMLVideoElement | null = null;
  
  private activeId: string | null = null;
  private listeners: Set<Listener> = new Set();

  private constructor() {}

  public static getInstance(): HlsSingleton {
    if (!HlsSingleton.instance) {
      HlsSingleton.instance = new HlsSingleton();
    }
    return HlsSingleton.instance;
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.activeId);
    return () => this.listeners.delete(listener);
  }

  public setActiveId(id: string | null) {
    if (this.activeId !== id) {
      this.activeId = id;
      this.listeners.forEach(l => l(id));
      if (!id) {
        this.stop();
      }
    }
  }

  public getActiveId() {
    return this.activeId;
  }

  public play(videoElement: HTMLVideoElement, streamUrl: string, onError: () => void) {
    if (this.currentVideoElement === videoElement && this.hls?.url === streamUrl) {
      return;
    }

    this.stop();
    this.currentVideoElement = videoElement;

    if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
      if (!this.hls) {
        this.hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          capLevelToPlayerSize: true, 
          maxBufferSize: 30 * 1024 * 1024, 
          maxMaxBufferLength: 30,
        });
      }

      this.hls.attachMedia(videoElement);
      this.hls.loadSource(streamUrl);
      
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoElement.play().catch(() => onError());
      });

      this.hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          onError();
        }
      });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = streamUrl;
      videoElement.play().catch(() => onError());
      videoElement.onerror = onError;
    } else {
      videoElement.src = streamUrl;
      videoElement.play().catch(() => onError());
      videoElement.onerror = onError;
    }
  }

  public stop() {
    if (this.hls) {
      this.hls.detachMedia();
      this.hls.off(Hls.Events.MANIFEST_PARSED);
      this.hls.off(Hls.Events.ERROR);
    }
    if (this.currentVideoElement) {
      this.currentVideoElement.pause();
      this.currentVideoElement.removeAttribute('src');
      this.currentVideoElement.load();
      this.currentVideoElement = null;
    }
  }
}

export const hlsManager = HlsSingleton.getInstance();
