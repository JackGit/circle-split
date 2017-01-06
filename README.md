## description

Inspired by a d3.js project [ImageMap](http://bl.ocks.org/nswamy14/df13d67b6efeb19eb640), I created a canvas version of it, which supports PC and mobile devices.

![screenshot](http://ofkyhrvda.bkt.clouddn.com/post/image/o_1b5ed5culrte5t6r5arev1s1k7.jpeg)

## demo

Here is the online [demo](http://demo.jackyang.me/circle-split/circle-split-demo.html). Select an image and move or touch screen

## install

```bash
npm i circle-split
```

or include the source JS file directly

```html
<script src="circle-split.min.js"></script>
```

## usage

### initiate

```js
var cs = new CircleSplit('#mountNode', {
  size: 300,
  minDiameter: 4,
  imageCenterType: 'cover',
  eventEnabled: true
});
```

### default options

```js
var defaultOptions = {
  size: 'auto',     // will set mininum value of mountNode's width and height
  minDiameter: 2,   // the circle can split until the diameter reaches to 2 px
  imageCenterType: 'contain',  // designate the center type when put the image of the square box
  eventEnabled: true // enable touchmove and mouseove event
};
```

### public methods

```js
// you can set image by path or an already loaded image element
cs.setImage('path/to/your/image.jpg')
cs.setImage(document.getElementById('targetImageElement'))

// set pure color
cs.setColor('rgba(255,0,0)');

// split
cs.split() // split all circles into next level
cs.split(level) // split all circles into target level
cs.split(x, y) // split hit circle into next level
cs.split(x, y, level) // split hit circle into target level, target level should be higher than circle's current level

// you can bind and unbind event any time
cs.bindEvent()
cs.unbindEvent()

// if you don't need this, please call destroy method
cs.destroy()
```
