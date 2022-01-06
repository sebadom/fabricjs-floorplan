export const getRandomRGBA = (opacity = "0.25") =>
  `rgba(${Math.floor(Math.random() * 256)},${Math.floor(
    Math.random() * 256
  )},${Math.floor(Math.random() * 256)}, ${opacity})`;
