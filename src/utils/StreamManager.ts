export class StreamManager {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private streamKey: string;
  private rtmpUrl: string;

  constructor(streamKey: string, rtmpUrl: string) {
    this.streamKey = streamKey;
    this.rtmpUrl = rtmpUrl;
  }

  async startStreaming(mediaStream: MediaStream): Promise<void> {
    try {
      this.mediaStream = mediaStream;

      // Create MediaRecorder with high quality settings
      this.mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000, // 2.5 Mbps
        audioBitsPerSecond: 128000   // 128 kbps
      });

      // Handle data available event
      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          try {
            // Convert the data to a format suitable for RTMP
            const blob = new Blob([event.data], { type: 'video/webm' });
            const arrayBuffer = await blob.arrayBuffer();
            // Send the data to the RTMP server
            await fetch(this.rtmpUrl, {
              method: 'POST',
              body: arrayBuffer,
              headers: {
                'Content-Type': 'video/webm',
                'x-stream-key': this.streamKey
              }
            });
          } catch (error) {
            console.error('Error sending stream data:', error);
          }
        }
      };

      // Start recording
      this.mediaRecorder.start(1000); // Send data every second
      console.log('MediaRecorder started');

    } catch (error) {
      console.error('Error starting stream:', error);
      this.stopStreaming();
      throw error;
    }
  }

  stopStreaming(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }
} 