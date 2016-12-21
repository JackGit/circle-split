var CenterIt = require('center-it');
var CANVAS_SCALE_RATIO = 2;

function CircleSplit(el, options) {
  var defaultOptions = {
    minDiameter: 2, // screen pixel
    size: 'auto',   // screen pixel: 'auto', or number of px, like 300, which indicates the width and height or the mount node element
    imageCenterType: 'contain'
  };

  options || (options = {});
  this.options = {};

  for (var p in defaultOptions) {
    if (options[p] !== null && options[p] !== undefined) {
      this.options[p] = options[p];
    } else {
      this.options[p] = defaultOptions[p];
    }
  }

  this.el = typeof el === 'object' ? el : document.querySelector(el);

  if (this.options.size === 'auto') {
    this.options.size = Math.min(this.el.clientWidth, this.el.clientHeight);
  }

  this.canvasSize = this.options.size * CANVAS_SCALE_RATIO;
  this.diameter = this.canvasSize / 2;
  this.circles = []; // {x, y, r, readyToSplit} x, y, r is canvas pixel, which is screen pixel * CANVAS_SCALE_RATIO
  this.renderingCircles = [];

  this.sourceCanvas = null;
  this.targetCanvas = null;
  this.sourceImage = null;
  this.requestAnimationSeed = 0;

  this.moveEvent = 'ontouchstart' in window ? 'touchmove' : 'mousemove';
  this.moveHandler = this.onMove.bind(this);
  this.rect = this.el.getBoundingClientRect();

  this.init();
}

CircleSplit.prototype = {
  constructor: CircleSplit,

  init: function () {
    this.createSourceCanvas();
    this.createTargetCanvas();
    this.bindEvent();
    this.render();
  },

  createSourceCanvas: function () {
    this.sourceCanvas = document.createElement('canvas');
    this.sourceCanvas.width = this.canvasSize;
    this.sourceCanvas.height = this.canvasSize;
  },

  createTargetCanvas: function () {
    this.targetCanvas = document.createElement('canvas');
    this.targetCanvas.width = this.canvasSize;
    this.targetCanvas.height = this.canvasSize;
    this.targetCanvas.style.width
      = this.targetCanvas.style.height
      = this.options.size + 'px';
    this.el.appendChild(this.targetCanvas);
  },

  drawSourceImage: function () {
    var canvasSize = this.canvasSize;
    var centerIt = new CenterIt({
      containerWidth: canvasSize,
      containerHeight: canvasSize,
      originWidth: this.sourceImage.naturalWidth,
      originHeight: this.sourceImage.naturalHeight,
      centerType: this.options.imageCenterType
    });
    var context = this.sourceCanvas.getContext('2d');

    context.clearRect(0, 0, canvasSize, canvasSize);
    context.drawImage(
      this.sourceImage,
      centerIt.offset().left,
      centerIt.offset().top,
      centerIt.width(),
      centerIt.height()
    );
  },

  drawCircle: function () {
    var context = this.targetCanvas.getContext('2d');
    var x, y, r;

    if (arguments.length === 3) {
      // new circle
      x = arguments[0];
      y = arguments[1];
      r = arguments[2];
      this.circles.push({x: x, y: y, r: r});
    } else {
      // repaint existing circle
      x = arguments[0].x;
      y = arguments[0].y;
      r = arguments[0].r;
    }

    context.fillStyle = this.getPixelRGBColor(x, y);
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.closePath();
    context.fill();
  },

  bindEvent: function () {
    this.targetCanvas.addEventListener(this.moveEvent, this.moveHandler);
  },

  unbindEvent: function () {
    this.targetCanvas.removeEventListener(this.moveEvent, this.moveHandler);
  },

  onMove: function (e) {
    var hasTouch = 'ontouchstart' in window;
    var rect = this.rect;

    if (hasTouch) {
      this.tagCircle((e.touches[0].clientX - rect.left) * CANVAS_SCALE_RATIO, (e.touches[0].clientY - rect.top) * CANVAS_SCALE_RATIO);
    } else {
      this.tagCircle(e.offsetX * CANVAS_SCALE_RATIO, e.offsetY * CANVAS_SCALE_RATIO);
    }

    e.preventDefault();
    e.stopPropagation();
  },

  tagCircle: function (x, y) {
    var circles = this.circles;
    var circle = null;

    for (var i = 0; i < circles.length; i++) {
      circle = circles[i];
      // hit test
      if (
        !circle.readyToSplit &&
        x > circle.x - circle.r && x < circle.x + circle.r &&
        y > circle.y - circle.r && y < circle.y + circle.r
      ) {
        circle.readyToSplit = true;
        this.renderingCircles.push({
          x: circle.x,
          y: circle.y,
          r: circle.r,
          index: i
        });
        break;
      }
    }
  },

  setImage: function (image) {
    var canvasSize = this.canvasSize;

    this.circles = [];
    this.targetCanvas.getContext('2d').clearRect(0, 0, canvasSize, canvasSize);

    if (typeof image === 'string') {
      this.sourceImage = new Image();
      this.sourceImage.crossOrigin = 'Anonymous';
      this.sourceImage.onload = function () {
        this.drawSourceImage();
        this.drawCircle(this.targetCanvas.width / 2, this.targetCanvas.height / 2, this.diameter)
      }.bind(this);
      this.sourceImage.src = image;
    } else {
      this.sourceImage = image;
      this.drawSourceImage();
      this.drawCircle(this.targetCanvas.width / 2, this.targetCanvas.height / 2, this.diameter)
    }
  },

  render: function () {
    var minDiameter = this.options.minDiameter * CANVAS_SCALE_RATIO;
    var renderingCircles = this.renderingCircles;
    var circle = null

    while(circle = renderingCircles.pop()) {
        this.circles[circle.index].readyToSplit = false;

        if (circle.r > minDiameter) {
          this.splitCircle(circle);
        }
    }

    this.requestAnimationSeed = requestAnimationFrame(this.render.bind(this));
  },

  splitCircle: function (circle) {
    var context = this.targetCanvas.getContext('2d');
    var originCircle = this.circles[circle.index];
    var r = circle.r / 2;

    // clear rect
    context.clearRect(circle.x - circle.r, circle.y - circle.r, circle.r * 2, circle.r * 2);

    // draw new circles
    this.drawCircle(circle.x + r, circle.y - r, r);
    this.drawCircle(circle.x - r, circle.y + r, r);
    this.drawCircle(circle.x + r, circle.y + r, r);

    // repaint current circle
    originCircle.x -= r;
    originCircle.y -= r;
    originCircle.r = r;
    this.drawCircle(originCircle);
  },

  split: function () {
    var minDiameter = this.options.minDiameter * CANVAS_SCALE_RATIO;
    this.renderingCircles = [];
    this.circles.forEach(function (circle, index) {
      if (circle.r > minDiameter) {
        this.renderingCircles.push({
          x: circle.x,
          y: circle.y,
          r: circle.r,
          index: index
        });
      }
    }, this);
  },

  getPixelRGBColor: function (x, y) {
    var pixelData = this.sourceCanvas.getContext('2d').getImageData(parseInt(x), parseInt(y), 1, 1).data;
    return 'rgb(' + pixelData[0] + ',' + pixelData[1] + ',' + pixelData[2] + ')';
  },

  destroy: function () {
    cancelAnimationFrame(this.requestAnimationSeed);
    this.unbindEvent();
    this.sourceCanvas = null;
    this.targetCanvas = null;
    this.sourceImage = null;
    this.circles = [];
  }
};

module.exports = CircleSplit;
