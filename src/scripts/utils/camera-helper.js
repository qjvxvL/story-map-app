class CameraHelper {
  constructor() {
    this.stream = null;
    this.videoElement = null;
  }

  async startCamera(videoElement) {
    try {
      this.videoElement = videoElement;
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      this.videoElement.srcObject = this.stream;
      return true;
    } catch (error) {
      console.error("Error accessing camera:", error);
      throw new Error(
        "Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan."
      );
    }
  }

  capturePhoto() {
    if (!this.videoElement || !this.stream) {
      throw new Error("Kamera belum diaktifkan");
    }

    const canvas = document.createElement("canvas");
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.8
      );
    });
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }
}

export default CameraHelper;
