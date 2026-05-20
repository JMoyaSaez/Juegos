window.SKY = window.SKY || {};

window.SKY.Assets = (() => {
  const images = new Map();

  function loadImage(key, src) {
    return new Promise((resolve, reject) => {
      if (images.has(key)) {
        resolve(images.get(key));
        return;
      }

      const image = new Image();
      image.onload = () => {
        images.set(key, image);
        resolve(image);
      };
      image.onerror = () => reject(new Error(`No se ha podido cargar ${src}`));
      image.src = src;
    });
  }

  function getImage(key) {
    return images.get(key);
  }

  return {
    loadImage,
    getImage,
  };
})();
