export const loadVideo = (url: string) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.setAttribute("playsinline", "playsinline");
    video.crossOrigin = "anonymous";
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.src = url;
    video.load();
    video.play();
    video.addEventListener("canplaythrough", function () {
      resolve(video);
    });

    // video.addEventListener("error", function (e) {
    //   console.log(e)
    //   reject(e);
    // });
  });
};
