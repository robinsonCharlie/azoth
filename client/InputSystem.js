// All this system accomplishes is making sure that if a key is pressed it counts as pressed
// for a whole frame. If a key is still being held down when the frame switches then it counts
// again for a whole frame.  *call releaseKeys once per frame*
// keys supported: w a s d
// left mouse down, mouse x, mouse y
class InputSystem {
    constructor() {
        this.currentState = {
            w: false,
            s: false,
            a: false,
            d: false,
            mx: 0,
            my: 0,
            mouseDown: false
        }

        this.frameState = {
            w: false,
            s: false,
            a: false,
            d: false,
            mouseDown: false
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'w') {
                this.currentState.w = true
                this.frameState.w = true
            }
            if (event.key === 'a') {
                this.currentState.a = true
                this.frameState.a = true
            }
            if (event.key === 's') {
                this.currentState.s = true
                this.frameState.s = true
            }
            if (event.key === 'd') {
                this.currentState.d = true
                this.frameState.d = true
            }
        })

        document.addEventListener('keyup', (event) => {
            if (event.key === 'w') {
                this.currentState.w = false
            }
            if (event.key === 'a') {
                this.currentState.a = false
            }
            if (event.key === 's') {
                this.currentState.s = false
            }
            if (event.key === 'd') {
                this.currentState.d = false
            }
        })

        document.addEventListener('mousemove', (event) => {
            this.currentState.mx = event.clientX
            this.currentState.my = event.clientY
        })

        document.addEventListener('mousedown', (event) => {
            this.currentState.mouseDown = true
            this.frameState.mouseDown = true
        })

        document.addEventListener('mouseup', (event) => {
            this.currentState.mouseDown = false
        })
    }

    releaseKeys() {
        this.frameState.w = this.currentState.w
        this.frameState.a = this.currentState.a
        this.frameState.s = this.currentState.s
        this.frameState.d = this.currentState.d
        this.frameState.mouseDown = this.currentState.mouseDown
    }
}

module.exports = InputSystem