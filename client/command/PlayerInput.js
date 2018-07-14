var nengi = require('../../nengi')

class PlayerInput {
    constructor(w, a, s, d, mx, my, mouseDown) {
        this.w = w
        this.a = a
        this.s = s
        this.d = d
        this.mx = mx
        this.my = my
        this.mouseDown = mouseDown
    }
}

PlayerInput.protocol = {
    w: nengi.Boolean,
    a: nengi.Boolean,
    s: nengi.Boolean,
    d: nengi.Boolean,
    mx: nengi.Int16,
    my: nengi.Int16,
    mouseDown: nengi.Boolean
}

module.exports = PlayerInput