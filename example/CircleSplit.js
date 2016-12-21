(function (global, factory) {
  'use strict';
  /* istanbul ignore next */
  typeof exports === 'object' && typeof module !== 'undefined'
    ? module.exports = factory()
    : typeof define === 'function' && define.amd
      ? define(factory)
      : (global.CircleSplit = factory())
}(this, function () {
  'use strict';

  function CircleSplit(el, options) {
    var defaultOptions = {
      minDiameter: 2,
      size: 'auto',
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

    this.diameter = this.options.size / 2;
      this.sourceCanvas = null;
      this.targetCanvas = null;
      this.sourceImage = null;
      this.circles = []; // {x, y, r, readyToSplit}
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
      this.sourceCanvas.width = this.options.size;
      this.sourceCanvas.height = this.options.size;
    },

    createTargetCanvas: function () {
      this.targetCanvas = document.createElement('canvas');
      this.targetCanvas.width = this.options.size;
      this.targetCanvas.height = this.options.size;
      this.el.appendChild(this.targetCanvas);
    },

    drawSourceImage: function () {
      var centerIt = new CenterIt({
        containerWidth: this.options.size,
        containerHeight: this.options.size,
        originWidth: this.sourceImage.naturalWidth,
        originHeight: this.sourceImage.naturalHeight,
        centerType: this.options.imageCenterType
      });
      var context = this.sourceCanvas.getContext('2d');

      context.clearRect(0, 0, this.options.size, this.options.size);
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
        this.circles.push({x: x, y: y, r: r, readyToSplit: false});
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
        this.tagCircle(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
      } else {
        this.tagCircle(e.offsetX, e.offsetY);
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
          break;
        }
      }
    },

    setImage: function (image) {
        this.circles = [];
        this.targetCanvas.getContext('2d').clearRect(0, 0, this.options.size, this.options.size);

        if (typeof image === 'string') {
          this.sourceImage = new Image();
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
      var minDiameter = this.options.minDiameter;

      this.circles.forEach(function (circle) {
        if (circle.readyToSplit && circle.r > minDiameter) {
          this.splitCircle(circle);
        } else {
          circle.readyToSplit = false;
        }
      }, this);
      this.requestAnimationSeed = requestAnimationFrame(this.render.bind(this));
    },

    splitCircle: function (circle) {
      var context = this.targetCanvas.getContext('2d');
      var r = circle.r / 2;

      // clear rect
      context.clearRect(circle.x - circle.r, circle.y - circle.r, circle.r * 2, circle.r * 2);

      // draw new circles
      this.drawCircle(circle.x + r, circle.y - r, r);
      this.drawCircle(circle.x - r, circle.y + r, r);
      this.drawCircle(circle.x + r, circle.y + r, r);

      // repaint current circle
      circle.x -= r;
      circle.y -= r;
      circle.r = r;
      circle.readyToSplit = false;
      this.drawCircle(circle);
    },

    split: function () {
      this.circles.forEach(function (circle) {
        circle.readyToSplit = true;
      });
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

  return CircleSplit;
}));