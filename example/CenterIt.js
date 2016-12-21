(function (global, factory) {
    'use strict'
    /* istanbul ignore next */
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.CenterIt = factory())
}(this, function () {
    'use strict'
    function CenterIt (options) {
        options = options || /* istanbul ignore next */ {}
        this.options = {
            containerWidth: 100,
            containerHeight: 100,
            originWidth: 100,
            originHeight: 100,
            centerType: 'cover' // 'cover', 'contain'
        }

        /* istanbul ignore next */
        for (var p in this.options) {
            if (options[p] !== undefined) {
                this.options[p] = options[p]
            }
        }

        this._ratio = 1
        this._newWidth = 0
        this._newHeight = 0
        this._offset = {top: 0, left: 0}

        if (this.options.centerType === 'cover') {
            this._coverCenter()
        } else {
            this._containCenter()
        }
    }

    CenterIt.prototype = {
        constructor: CenterIt,

        _coverCenter: function () {
            var originWidth = this.options.originWidth
            var originHeight = this.options.originHeight
            var containerWidth = this.options.containerWidth
            var containerHeight = this.options.containerHeight
            var originRatio = originWidth / originHeight
            var containerRatio = containerWidth / containerHeight
            var ratio = 1

            if (originRatio > containerRatio) { // left offset required
                ratio = containerHeight / originHeight
                this._newWidth = originWidth * ratio
                this._newHeight = originHeight * ratio
                this._offset = {
                    top: 0,
                    left: (this._newWidth - containerWidth) / -2
                }
            } else if (originRatio < containerRatio) { // top offset required
                ratio = containerWidth / originWidth
                this._newWidth = originWidth * ratio
                this._newHeight = originHeight * ratio
                this._offset = {
                    top: (this._newHeight - containerHeight) / -2,
                    left: 0
                }
            } else { // no offset required
                ratio = containerWidth / originWidth
                this._newWidth = originWidth * ratio
                this._newHeight = originHeight * ratio
                this._offset = {
                    top: 0,
                    left: 0
                }
            }
            this._ratio = ratio
        },

        _containCenter: function () {
            var originWidth = this.options.originWidth
            var originHeight = this.options.originHeight
            var containerWidth = this.options.containerWidth
            var containerHeight = this.options.containerHeight
            var originRatio = originWidth / originHeight
            var containerRatio = containerWidth / containerHeight
            var ratio = 1

            if (originRatio > containerRatio) { // top offset required
                ratio = containerWidth / originWidth
                this._newWidth = originWidth * ratio
                this._newHeight = originHeight * ratio
                this._offset = {
                    top: (this._newHeight - containerHeight) / -2,
                    left: 0
                }
            } else if (originRatio < containerRatio) { // left offset required
                ratio = containerHeight / originHeight
                this._newWidth = originWidth * ratio
                this._newHeight = originHeight * ratio
                this._offset = {
                    top: 0,
                    left: (this._newWidth - containerWidth) / -2
                }
            } else { // no offset required
                ratio = containerWidth / originWidth
                this._newWidth = originWidth * ratio
                this._newHeight = originHeight * ratio
                this._offset = {
                    top: 0,
                    left: 0
                }
            }

            this._ratio = ratio
        },

        ratio: function () {
            return this._ratio
        },

        width: function () {
            return this._newWidth
        },

        height: function () {
            return this._newHeight
        },

        offset: function () {
            return this._offset
        }
    }

    return CenterIt
}))