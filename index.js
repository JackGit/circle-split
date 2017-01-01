var CenterIt = require('center-it');
var CANVAS_SCALE_RATIO = 2;

function hitTest (x, y, circle) {
  return (
    x > circle.x - circle.r && x < circle.x + circle.r &&
    y > circle.y - circle.r && y < circle.y + circle.r
  );
}

function CircleSplit(el, options) {
  var defaultOptions = {
    minDiameter: 2, // screen pixel
    size: 'auto',   // screen pixel: 'auto', or number of px, like 300, which indicates the width and height or the mount node element
    imageCenterType: 'contain',
    eventEnabled: true
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
  this.circles = []; // {x, y, r, level, px, py} x, y, r is canvas pixel, which is screen pixel * CANVAS_SCALE_RATIO
  this.renderingCircles = [];
  this.maxLevel = 0;

  this.sourceCanvas = null;
  this.targetCanvas = null;
  this.sourceImage = null;
  this.pureColorContent = null;
  this.requestAnimationSeed = 0;

  this.moveEvent = 'ontouchstart' in window ? 'touchmove' : 'mousemove';
  this.moveHandler = this._onMove.bind(this);
  this.rect = this.el.getBoundingClientRect();

  this._init();
}

CircleSplit.prototype = {
  constructor: CircleSplit,

  _init: function () {
    this._createSourceCanvas();
    this._createTargetCanvas();
    this._render();
    this._calMaxLevel();

    if (this.options.eventEnabled) {
      this.bindEvent();
    }
  },

  _createSourceCanvas: function () {
    this.sourceCanvas = document.createElement('canvas');
    this.sourceCanvas.width = this.canvasSize;
    this.sourceCanvas.height = this.canvasSize;
  },

  _createTargetCanvas: function () {
    this.targetCanvas = document.createElement('canvas');
    this.targetCanvas.width = this.canvasSize;
    this.targetCanvas.height = this.canvasSize;
    this.targetCanvas.style.width
      = this.targetCanvas.style.height
      = this.options.size + 'px';
    this.el.appendChild(this.targetCanvas);
  },

  _drawSourceImage: function () {
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

  _drawCircle: function (circle, noPush) {
    var context = this.targetCanvas.getContext('2d');
    var originCircle = this.circles[circle.index];
    var x = circle.x, y = circle.y, r = circle.r;

    if (noPush) {
      originCircle.x = circle.x;
      originCircle.y = circle.y;
      originCircle.r = circle.r;
      originCircle.level = circle.level;
      originCircle.px = circle.px;
      originCircle.py = circle.py;
    } else {
      this.circles.push({x: x, y: y, r: r, level: circle.level, px: circle.px, py: circle.py});
    }

    context.fillStyle = this._getPixelRGBColor(x, y);
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.closePath();
    context.fill();
  },

  _onMove: function (e) {
    var hasTouch = 'ontouchstart' in window;
    var rect = this.rect;

    if (hasTouch) {
      this._tagCircle((e.touches[0].pageX - rect.left) * CANVAS_SCALE_RATIO, (e.touches[0].pageY - rect.top) * CANVAS_SCALE_RATIO);
    } else {
      this._tagCircle(e.offsetX * CANVAS_SCALE_RATIO, e.offsetY * CANVAS_SCALE_RATIO);
    }

    e.preventDefault();
    e.stopPropagation();
  },

  /**
   * you can at maximum split maxLevel times to meet the minDiameter requirement
   */
  _calMaxLevel: function () {
    var level = 1;
    var radius = this.canvasSize / 2;
    var minDiameter = this.options.minDiameter * CANVAS_SCALE_RATIO;

    while (radius >= minDiameter) {
      radius = radius / 2;
      level++;
    }

    this.maxLevel = level;
  },

  _tagCircle: function (x, y, targetLevel) {
    var index = this.findCircle(x, y);
    var circle = this.circles[index];

    if (targetLevel && targetLevel <= circle.level) {
      return;
    }

    if (circle) {
      if (targetLevel) {
        targetLevel = Math.min(targetLevel, this.maxLevel);
      } else {
        targetLevel = Math.min(circle.level + 1, this.maxLevel);
      }
      this.renderingCircles.push({
        x: circle.x,
        y: circle.y,
        r: circle.r,
        index: index,
        level: circle.level,
        targetLevel: targetLevel
      });
    }
  },

  _getPixelRGBColor: function (x, y) {
    var pixelData = null;

    if (this.pureColorContent) {
      return this.pureColorContent;
    } else {
      pixelData = this.sourceCanvas.getContext('2d').getImageData(parseInt(x), parseInt(y), 1, 1).data;
      return 'rgb(' + pixelData[0] + ',' + pixelData[1] + ',' + pixelData[2] + ')';
    }
  },

  _splitCircle: function (circle) {
    var context = this.targetCanvas.getContext('2d');
    var gap = circle.targetLevel - circle.level;
    var r = circle.r / Math.pow(2, gap);
    var size = circle.r / r;
    var top = circle.y - circle.r;
    var left = circle.x - circle.r;

    // clear rect
    context.clearRect(left, top, circle.r * 2, circle.r * 2);

    for (var i = 0; i < size; i++) {
      for (var j = 0; j < size; j++) {
        // the first circle will be consider the current split circle, no need to push as new circle into this.circles
        this._drawCircle({
          x: left + j * 2 * r + r,
          y: top + i * 2 * r + r,
          r: r,
          index: circle.index,
          level: circle.targetLevel,
          px: circle.x,
          py: circle.y
        }, i === 0 && j === 0);
      }
    }
  },

  _render: function () {
    var maxLevel = this.maxLevel;
    var renderingCircles = this.renderingCircles;
    var circle;

    while(circle = renderingCircles.pop()) {
      if (circle.level <= maxLevel) {
        this._splitCircle(circle);
      }
    }

    this.requestAnimationSeed = requestAnimationFrame(this._render.bind(this));
  },

  _resetCanvas: function (canvas) {
    canvas.getContext('2d').clearRect(0, 0, this.canvasSize, this.canvasSize);
  },

  bindEvent: function () {
    this.targetCanvas.addEventListener(this.moveEvent, this.moveHandler);
  },

  unbindEvent: function () {
    this.targetCanvas.removeEventListener(this.moveEvent, this.moveHandler);
  },

  findCircle: function (x, y) {
    var circles = this.circles;
    var circle = null, i;

    for (i = 0; i < circles.length; i++) {
      circle = circles[i];
      if (hitTest(x, y, circle)) {
        break;
      }
    }

    return i === circles.length ? -1 : i;
  },

  setColor: function (rgbValue) {
    this.pureColorContent = rgbValue;
    this.sourceImage = null;
    this.circles = [];
    this._resetCanvas(this.targetCanvas);
    this._drawCircle({
      x: this.targetCanvas.width / 2,
      y: this.targetCanvas.height / 2,
      r: this.canvasSize / 2,
      level: 1,
      px: null,
      py: null
    });
  },

  setImage: function (image) {
    this.circles = [];
    this.pureColorContent = null;
    this._resetCanvas(this.targetCanvas);

    if (typeof image === 'string') {
      this.sourceImage = new Image();

      // can't set crossOrigin for local file selection, it makes onload fail in iOS
      image.startsWith('data:image') || (this.sourceImage.crossOrigin = 'anonymous');

      this.sourceImage.onload = function () {
        this._drawSourceImage();
        this._drawCircle({
          x: this.targetCanvas.width / 2,
          y: this.targetCanvas.height / 2,
          r: this.canvasSize / 2,
          level: 1,
          px: null,
          py: null
        });
      }.bind(this);
      this.sourceImage.src = image;
    } else {
      this.sourceImage = image;
      this._drawSourceImage();
      this._drawCircle({
        x: this.targetCanvas.width / 2,
        y: this.targetCanvas.height / 2,
        r: this.canvasSize / 2,
        level: 1,
        px: null,
        py: null
      });
    }
  },

  setMinDiameter: function (value) {
    this.options.minDiameter = value;
    this._calMaxLevel()
  },

  /**
   * split() => split all circles into next level
   * split(level) => split all circles into target level
   * split(x, y, level) => split circle which matches the (x, y) hittest into next level
   */
  split: function () {
    var minDiameter = this.options.minDiameter * CANVAS_SCALE_RATIO;
    var maxLevel = this.maxLevel;
    var params = arguments;

    if (params.length > 1) {
      // split(x, y) | split(x, y, level)
      this._tagCircle(params[0], params[1], params[2]);
    } else if (params.length === 1) {
      // split(level)
      this.circles = [{x: this.targetCanvas.width / 2, y: this.targetCanvas.height / 2, r: this.canvasSize / 2, level: 1}];
      this.renderingCircles = [{
        x: this.circles[0].x,
        y: this.circles[0].y,
        r: this.circles[0].r,
        index: 0,
        level: this.circles[0].level,
        targetLevel: Math.min(params[0], maxLevel)
      }];
    } else {
      // split()
      this.renderingCircles = [];
      this.circles.forEach(function (circle, index) {
        if (circle.level <= maxLevel) {
          this.renderingCircles.push({
            x: circle.x,
            y: circle.y,
            r: circle.r,
            index: index,
            level: circle.level,
            targetLevel: Math.min(circle.level + 1, maxLevel)
          });
        }
      }, this);
    }
  },

  merge: function () {
    console.warn('not implemented');
    return;

    var circle = null;
    var level = null;
    var parentRadius = null;

    if (arguments.length === 2) {
      // merge(x, y)
      circle = this.circles[this.findCircle(arguments[0], arguments[1])];
    } else {
      // marge(circle)
      circle = arguments[0];
    }

    if (!circle) {
      console.warn('cannot find circle to merge');
      return;
    }

    level = this.getLevel(circle);

    if (level === 1) {
      return;
    }

    parentRadius = circle.r * 2;
    this.circles.filter(function (c) {
      return c.px === circle.px && c.py === circle.py && c.level === level;
    });

    // clear rect
    this.targetCanvas.getContext('2d').clearRect(circle.px - parentRadius, circle.py - parentRadius, parentRadius * 2, parentRadius * 2);

    // repain the parent circle

    // reorder the this.circles array TODO: how?
  },

  /**
   * exmaple: canvas size is 828px, circle radius is 414px, the level of this circle is 1.
   * level 1 means you need split (1 - 1) = 0 times of split action
   */
  getLevel: function (circle) {
    return Math.log2(this.canvasSize / (typeof circle === 'object' ? circle.r : circle));
  },

  destroy: function () {
    cancelAnimationFrame(this.requestAnimationSeed);
    this.unbindEvent();
    this.sourceCanvas = null;
    this.targetCanvas = null;
    this.sourceImage = null;
    this.pureColorContent = null;
    this.circles = [];
    this.renderingCircles = [];
  }
};

module.exports = CircleSplit;
