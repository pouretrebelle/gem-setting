import jsfeat from 'jsfeat';

const images = Array.from(document.getElementsByTagName('img'));

const corners = (image) => {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgb(0,255,0)';
  ctx.strokeStyle = 'rgb(0,255,0)';

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

  var count = jsfeat.fast_corners.detect(img_u8, corners, 5);

  var data_u32 = new Uint32Array(imageData.data.buffer);

  render_corners(corners, count, data_u32, canvas.width);
  ctx.putImageData(imageData, 0, 0);

  image.src = canvas.toDataURL();
};

function render_corners(corners, count, img, step) {
  var pix = (0xff << 24) | (0x00 << 16) | (0xff << 8) | 0x00;
  for (var i = 0; i < count; ++i) {
    var x = corners[i].x;
    var y = corners[i].y;
    var off = x + y * step;
    img[off] = pix;
    img[off - 1] = pix;
    img[off + 1] = pix;
    img[off - step] = pix;
    img[off + step] = pix;
  }
}

images.forEach((image) => corners(image));
