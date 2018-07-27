import jsfeat from 'jsfeat';

const images = Array.from(document.getElementsByTagName('img')).filter(
  (img, i) => i % 2
);

const removeDuplicates = (arr) => {
  let s = new Set(arr);
  let it = s.values();
  return Array.from(it);
};

const corners = (image) => {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');

  const img_u8 = new jsfeat.matrix_t(
    canvas.width,
    canvas.height,
    jsfeat.U8_t | jsfeat.C1_t
  );

  let corners = [];
  var i = canvas.width * canvas.height;
  while (--i >= 0) {
    corners[i] = new jsfeat.keypoint_t(0, 0, 0, 0);
  }

  const threshold = 10;

  jsfeat.fast_corners.set_threshold(threshold);

  ctx.drawImage(image, 0, 0);
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  jsfeat.imgproc.grayscale(imageData.data, canvas.width, canvas.height, img_u8);

  let options = {
    blur_radius: 3,
    low_threshold: 5,
    high_threshold: 25,
  };
  var r = options.blur_radius | 0;
  var kernel_size = (r + 1) << 1;

  jsfeat.imgproc.gaussian_blur(img_u8, img_u8, kernel_size, 0);

  var count = jsfeat.imgproc.canny(
    img_u8,
    img_u8,
    options.low_threshold | 0,
    options.high_threshold | 0
  );

  var data_u32 = new Uint32Array(imageData.data.buffer);

  let hits = [];

  // scan the canny image from all sides and record the first pixel hit

  for (let row = 0; row < img_u8.rows; row++) {
    let start = row * img_u8.cols;
    let adder = 1;
    let i = start;
    let found = false;

    // left to right
    while (i < start + img_u8.cols && !found) {
      if (img_u8.data[i] & 0xff) {
        found = true;
        hits.push(i);
      }
      i += adder;
    }

    // right to left
    i = start + img_u8.cols * adder;
    found = false;
    while (i > start && !found) {
      if (img_u8.data[i] & 0xff) {
        found = true;
        hits.push(i);
      }
      i -= adder;
    }
  }

  for (let col = 0; col < img_u8.cols; col++) {
    let start = col;
    let adder = img_u8.rows;
    let i = start;
    let found = false;

    // top to bottom
    while (i < start + img_u8.rows * adder && !found) {
      if (img_u8.data[i] & 0xff) {
        found = true;
        hits.push(i);
      }
      i += adder;
    }

    // bottom to top
    i = start + img_u8.rows * adder;
    found = false;
    while (i > start && !found) {
      if (img_u8.data[i] & 0xff) {
        found = true;
        hits.push(i);
      }
      i -= adder;
    }
  }

  hits = removeDuplicates(hits);

  const polarData = calcPolarData(hits, img_u8);

  drawPolarData(polarData, img_u8, data_u32);

  ctx.putImageData(imageData, 0, 0);

  image.src = canvas.toDataURL();
};

const calcPolarData = (hits, img_u8) => {
  let polarData = [];
  const pivotX = img_u8.cols / 2;
  const pivotY = img_u8.rows / 2;

  hits.forEach((i) => {
    const x = i % img_u8.cols;
    const y = Math.floor(i / img_u8.cols);

    const angle = Math.atan2(y - pivotY, -(x - pivotX)) + Math.PI;
    const distance = Math.sqrt(
      Math.pow(x - pivotX, 2) + Math.pow(y - pivotY, 2)
    );

    polarData.push({ angle, distance });
  });

  polarData.sort((a, b) => {
    return a.angle - b.angle;
  });

  return polarData;
};

const drawPolarData = (data, img_u8, data_u32) => {
  // make everything black
  let j = img_u8.cols * img_u8.rows;
  while (--j >= 0) {
    data_u32[j] = 0xff000000;
  }
  // make all the hits white
  data.forEach((datum) => {
    const num =
      img_u8.cols * Math.floor(datum.distance) +
      Math.floor((datum.angle / (Math.PI * 2)) * img_u8.cols);
    data_u32[num] = 0xffffffff;
  });
};

// corners(images[0]);
images.forEach((image) => corners(image));
